"""WebSocket endpoints for interview agent."""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from agent_service.agents.interview.state import InterviewState
from agent_service.clients.backend import BackendAPIError, InterviewBackendClient
from agent_service.config import settings
from agent_service.schemas.websocket import (
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


class ConnectionManager:
    """Manage WebSocket connections and interview states."""

    def __init__(self):
        self.active_connections: dict[int, WebSocket] = {}
        self.interview_states: dict[int, InterviewState] = {}

    async def connect(self, websocket: WebSocket, interview_id: int):
        await websocket.accept()
        self.active_connections[interview_id] = websocket

    def disconnect(self, interview_id: int):
        if interview_id in self.active_connections:
            del self.active_connections[interview_id]
        if interview_id in self.interview_states:
            del self.interview_states[interview_id]

    def set_state(self, interview_id: int, state: InterviewState):
        self.interview_states[interview_id] = state

    def get_state(self, interview_id: int) -> InterviewState | None:
        return self.interview_states.get(interview_id)


manager = ConnectionManager()


def get_backend_client() -> InterviewBackendClient:
    """Get backend client instance."""
    return InterviewBackendClient(
        base_url=settings.backend_base_url,
        api_key=settings.backend_api_key,
    )


@router.websocket("/ws/interview")
async def interview_websocket(websocket: WebSocket):
    """WebSocket endpoint for interview agent.

    Protocol:
    1. Client sends {"type": "start", "workspace_code": "...", "expert_id": 1, "question_tree_id": 1}
    2. Server sends {"type": "session_started", "interview_id": 1, ...}
    3. Server sends {"type": "question", "question_text": "...", ...}
    4. Client sends {"type": "answer", "interview_id": 1, "answer": "..."}
    5. Server sends {"type": "turn_complete", ...} or {"type": "followup_required", ...}
    6. Repeat 3-5 for each question
    7. Client sends {"type": "end", "interview_id": 1}
    8. Server sends {"type": "interview_complete", ...}
    """
    await websocket.accept()

    client = get_backend_client()
    interview_id: int | None = None
    current_question_index: int = 0

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type == "start":
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

                    # 6. Initialize state
                    first_question = questions[0]
                    first_question_text = first_question.get("text", "")

                    state: InterviewState = {
                        "workspace_code": request.workspace_code,
                        "expert_id": request.expert_id,
                        "interview_id": interview_id,
                        "session_id": session_id,
                        "agent_id": agent_id,
                        "prototype_id": prototype_id,
                        "question_tree": question_tree,
                        "questions": questions,
                        "current_question_index": 0,
                        "turns": [],
                        "current_question": first_question_text,  # Set to first question text
                        "current_answer": None,
                        "should_continue": True,
                        "max_followup_depth": settings.max_followup_depth,
                        "current_followup_depth": 0,
                    }
                    manager.set_state(interview_id, state)
                    current_question_index = 0

                    # 7. Send session started
                    await websocket.send_json(
                        WSSessionStarted(
                            interview_id=interview_id,
                            session_id=session_id,
                            agent_id=agent_id,
                            first_question=first_question.get("text", ""),
                            questions_count=len(questions),
                        ).model_dump()
                    )

                    # 8. Send first question
                    await websocket.send_json(
                        WSQuestion(
                            question_id=first_question.get("id", "q1"),
                            question_text=first_question.get("text", ""),
                            question_index=0,
                            total_questions=len(questions),
                            is_followup=False,
                        ).model_dump()
                    )

                except BackendAPIError as e:
                    await websocket.send_json(WSError(code=e.status_code, message=e.message).model_dump())

            elif msg_type == "answer":
                request = WSAnswer(**data)
                interview_id = request.interview_id

                try:
                    # Get state
                    state = manager.get_state(interview_id)
                    if not state:
                        await websocket.send_json(WSError(code=404, message="Interview not found").model_dump())
                        continue

                    # Update state with answer
                    state["current_answer"] = request.answer
                    current_question_index = state["current_question_index"]
                    questions = state["questions"]
                    current_question = state.get("current_question", questions[current_question_index].get("text", ""))

                    # Save turn to backend
                    turn = client.add_interview_turn(
                        workspace_code=state["workspace_code"],
                        interview_id=interview_id,
                        question=current_question,
                        answer=request.answer,
                        turn_type="followup" if state.get("current_followup_depth", 0) > 0 else "initial",
                    )

                    await websocket.send_json(WSAnswerReceived(turn_id=turn.get("id", 0)).model_dump())

                    # Move to next question
                    current_question_index += 1
                    state["current_question_index"] = current_question_index
                    state["current_followup_depth"] = 0

                    if current_question_index >= len(questions):
                        # Interview complete
                        await websocket.send_json(
                            WSInterviewComplete(
                                interview_id=interview_id,
                                total_turns=len(state["turns"]) + 1,
                                summary="访谈已完成",
                            ).model_dump()
                        )
                        manager.disconnect(interview_id)
                        break
                    else:
                        # Send next question
                        next_question = questions[current_question_index]
                        next_question_text = next_question.get("text", "")
                        await websocket.send_json(
                            WSQuestion(
                                question_id=next_question.get("id", f"q{current_question_index + 1}"),
                                question_text=next_question_text,
                                question_index=current_question_index,
                                total_questions=len(questions),
                                is_followup=False,
                            ).model_dump()
                        )
                        state["current_question"] = next_question_text
                        state["should_continue"] = True

                    # Update state
                    manager.set_state(interview_id, state)

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
                            total_turns=0,
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
