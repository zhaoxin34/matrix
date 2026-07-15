"""WebSocket endpoints for interview agent."""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from agent_service.clients.backend import BackendAPIError, InterviewBackendClient
from agent_service.config import settings
from agent_service.schemas.websocket import (
    WSAck,
    WSAnswer,
    WSAnswerReceived,
    WSEndInterview,
    WSError,
    WSInterviewComplete,
    WSQuestion,
    WSSessionStarted,
    WSStartInterview,
)

router = APIRouter()


# Connection manager
class ConnectionManager:
    """Manage WebSocket connections."""

    def __init__(self):
        self.active_connections: dict[int, WebSocket] = {}

    async def connect(self, websocket: WebSocket, interview_id: int):
        await websocket.accept()
        self.active_connections[interview_id] = websocket

    def disconnect(self, interview_id: int):
        if interview_id in self.active_connections:
            del self.active_connections[interview_id]

    async def send_json(self, interview_id: int, data: dict):
        if interview_id in self.active_connections:
            await self.active_connections[interview_id].send_json(data)


manager = ConnectionManager()


def get_backend_client() -> InterviewBackendClient:
    """Get backend client instance."""
    return InterviewBackendClient(
        base_url=settings.backend_base_url,
        api_key=settings.backend_api_key,
    )


@router.websocket("/ws/interview")
async def interview_websocket(websocket: WebSocket):
    """WebSocket endpoint for interview agent."""
    await websocket.accept()

    client = get_backend_client()
    interview_id: int | None = None

    try:
        while True:
            # Receive message
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type == "start":
                # Start new interview
                request = WSStartInterview(**data)

                try:
                    # 1. Get agent mapping
                    mapping = client.get_agent_mapping(request.workspace_code, "expert_interview")
                    agent_id = mapping.get("agent_id")

                    if not agent_id:
                        await websocket.send_json(
                            WSError(
                                code=404, message=f"No expert_interview agent for {request.workspace_code}"
                            ).model_dump()
                        )
                        continue

                    # 2. Get agent details
                    agent = client.get_agent(request.workspace_code, agent_id)
                    prototype_id = agent.get("prototype_id")

                    # 3. Get question tree
                    question_tree = client.get_question_tree(request.workspace_code, request.question_tree_id)
                    questions = question_tree.get("questions", [])

                    if not questions:
                        await websocket.send_json(
                            WSError(code=400, message="Question tree has no questions").model_dump()
                        )
                        continue

                    # 4. Create interview session
                    session = client.create_interview_session(
                        workspace_code=request.workspace_code,
                        expert_id=request.expert_id,
                        topic=question_tree.get("name", "访谈"),
                    )
                    session_id = session["id"]

                    # 5. Create interview
                    interview = client.create_interview(
                        workspace_code=request.workspace_code,
                        session_id=session_id,
                        question_id=request.question_tree_id,
                        expert_id=request.expert_id,
                    )
                    interview_id = interview["id"]

                    # 6. Send session started
                    first_question = questions[0]
                    await websocket.send_json(
                        WSSessionStarted(
                            interview_id=interview_id,
                            session_id=session_id,
                            agent_id=agent_id,
                            first_question=first_question.get("text", ""),
                            questions_count=len(questions),
                        ).model_dump()
                    )

                    # 7. Send first question
                    await websocket.send_json(
                        WSQuestion(
                            question_id=first_question.get("id", "q1"),
                            question_text=first_question.get("text", ""),
                            question_index=0,
                            total_questions=len(questions),
                            is_followup=False,
                        ).model_dump()
                    )

                    # Store in manager (connection already accepted)
                    manager.active_connections[interview_id] = websocket

                except BackendAPIError as e:
                    await websocket.send_json(WSError(code=e.status_code, message=e.message).model_dump())
                except Exception as e:
                    await websocket.send_json(WSError(code=500, message=f"Start error: {str(e)}").model_dump())

            elif msg_type == "answer":
                print(f"DEBUG: Received answer data: {data}")
                request = WSAnswer(**data)
                interview_id = request.interview_id
                print(f"DEBUG: Parsed interview_id: {interview_id}")

                try:
                    # Get current question from state (simplified - in real impl would need state store)
                    # For now, we'll assume we have the current question
                    current_question = "问题内容"  # Would come from state

                    print(f"DEBUG add_interview_turn: workspace=crm, interview_id={interview_id}, answer={request.answer}", flush=True)

                    # Add interview turn
                    turn = client.add_interview_turn(
                        workspace_code="crm",  # Would come from state
                        interview_id=interview_id,
                        question=current_question,
                        answer=request.answer,
                        turn_type="initial",
                    )

                    await websocket.send_json(WSAnswerReceived(turn_id=turn.get("id", 0)).model_dump())

                    # TODO: Decide if follow-up needed (would use LangGraph)
                    # For now, send ack
                    await websocket.send_json(WSAck(message="Answer recorded").model_dump())

                except BackendAPIError as e:
                    await websocket.send_json(WSError(code=e.status_code, message=e.message).model_dump())

            elif msg_type == "end":
                request = WSEndInterview(**data)

                try:
                    client.end_interview(
                        workspace_code="crm",  # Would come from state
                        interview_id=request.interview_id,
                    )

                    await websocket.send_json(
                        WSInterviewComplete(
                            interview_id=request.interview_id,
                            total_turns=0,  # Would come from state
                            summary="访谈已结束",
                        ).model_dump()
                    )

                    manager.disconnect(request.interview_id)
                    break

                except BackendAPIError as e:
                    await websocket.send_json(WSError(code=e.status_code, message=e.message).model_dump())

    except WebSocketDisconnect:
        if interview_id:
            manager.disconnect(interview_id)
    except Exception as e:
        if interview_id:
            manager.disconnect(interview_id)
        await websocket.send_json(WSError(code=500, message=str(e)).model_dump())
