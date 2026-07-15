"""Interview Agent API endpoints."""

from typing import Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from agent_service.agents.interview.state import InterviewState
from agent_service.clients.backend import BackendAPIError, InterviewBackendClient
from agent_service.config import settings

router = APIRouter(prefix="/api/v1/interviews", tags=["interviews"])

# In-memory storage for active interviews (in production, use Redis)
active_interviews: dict[int, dict[str, Any]] = {}


class StartInterviewRequest(BaseModel):
    """Request to start an interview."""

    workspace_code: str = Field(..., description="Workspace code")
    expert_id: int = Field(..., description="Expert user ID")
    question_tree_id: int = Field(..., description="Question tree template ID")
    agent_id: int | None = Field(None, description="Agent ID (optional)")


class StartInterviewResponse(BaseModel):
    """Response after starting an interview."""

    interview_id: int
    session_id: int
    first_question: str
    questions_count: int


class SubmitAnswerRequest(BaseModel):
    """Request to submit an answer."""

    workspace_code: str = Field(..., description="Workspace code")
    answer: str = Field(..., description="Expert's answer to current question")


class SubmitAnswerResponse(BaseModel):
    """Response after submitting an answer."""

    turn_id: int
    next_question: str | None = None
    has_more_questions: bool
    suggested_followups: list[str] = []


class InterviewStatusResponse(BaseModel):
    """Interview status response."""

    interview_id: int
    status: str
    current_question_index: int
    questions_count: int
    turns_count: int
    current_question: str | None = None


class ApiResponse(BaseModel):
    """Standard API response wrapper."""

    code: int = 0
    message: str = "ok"
    data: dict | list | None = None


def get_backend_client() -> InterviewBackendClient:
    """Get backend client instance."""
    return InterviewBackendClient(
        base_url=settings.backend_base_url,
        api_key=settings.backend_api_key,
    )


@router.post("/start", response_model=ApiResponse)
def start_interview(request: StartInterviewRequest) -> ApiResponse:
    """Start a new interview session.

    Uses agent_mapping API to resolve workspace+type to agent, then uses
    the agent's prototype configuration for the interview.
    """
    client = get_backend_client()

    try:
        # 1. Get agent mapping (expert_interview type)
        mapping = client.get_agent_mapping(request.workspace_code, "expert_interview")
        agent_id = mapping.get("agent_id")

        if not agent_id:
            raise HTTPException(
                status_code=404,
                detail=f"No expert_interview agent configured for workspace {request.workspace_code}",
            )

        # 2. Get agent details (includes prototype info)
        agent = client.get_agent(request.workspace_code, agent_id)
        prototype_id = agent.get("prototype_id")

        # 3. Get question tree
        question_tree = client.get_question_tree(request.workspace_code, request.question_tree_id)
        questions = question_tree.get("questions", [])

        if not questions:
            raise HTTPException(status_code=400, detail="Question tree has no questions")

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

        # 6. Initialize state with agent info
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
            "current_question": None,
            "current_answer": None,
            "should_continue": True,
            "max_followup_depth": settings.max_followup_depth,
            "current_followup_depth": 0,
        }

        # 7. Get first question
        first_question = questions[0]["text"] if questions else ""

        # 8. Store active interview
        active_interviews[interview_id] = {
            "state": state,
            "client": client,
        }

        return ApiResponse(
            code=0,
            data={
                "interview_id": interview_id,
                "session_id": session_id,
                "agent_id": agent_id,
                "first_question": first_question,
                "questions_count": len(questions),
            },
        )

    except BackendAPIError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/{interview_id}/answer", response_model=ApiResponse)
def submit_answer(
    interview_id: int,
    request: SubmitAnswerRequest,
) -> ApiResponse:
    """Submit an answer and get the next question."""
    if interview_id not in active_interviews:
        raise HTTPException(status_code=404, detail="Interview not found")

    interview_data = active_interviews[interview_id]
    state = interview_data["state"]
    client = interview_data["client"]

    try:
        # Update current answer
        state["current_answer"] = request.answer

        # Save turn
        turn = client.add_interview_turn(
            workspace_code=request.workspace_code,
            interview_id=interview_id,
            question=state["current_question"] or "",
            answer=request.answer,
            turn_type="followup" if state.get("current_followup_depth", 0) > 0 else "initial",
        )

        # Move to next question
        state["current_question_index"] += 1
        state["current_followup_depth"] = 0

        # Check if more questions
        has_more = state["current_question_index"] < len(state["questions"])

        next_question = None
        suggested_followups = []

        if has_more:
            next_question = state["questions"][state["current_question_index"]]["text"]
            # Get configured followups if any
            current_q = state["questions"][state["current_question_index"]]
            suggested_followups = current_q.get("followups", [])

        # Update stored state
        active_interviews[interview_id]["state"] = state

        return ApiResponse(
            code=0,
            data={
                "turn_id": turn["id"],
                "next_question": next_question,
                "has_more_questions": has_more,
                "suggested_followups": suggested_followups,
            },
        )

    except BackendAPIError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get("/{interview_id}/status", response_model=ApiResponse)
def get_interview_status(
    interview_id: int,
    workspace_code: str = Query(..., description="Workspace code"),
) -> ApiResponse:
    """Get current interview status."""
    if interview_id not in active_interviews:
        raise HTTPException(status_code=404, detail="Interview not found")

    state = active_interviews[interview_id]["state"]

    return ApiResponse(
        code=0,
        data={
            "interview_id": interview_id,
            "status": "in_progress" if state["should_continue"] else "completed",
            "current_question_index": state["current_question_index"],
            "questions_count": len(state["questions"]),
            "turns_count": len(state["turns"]),
            "current_question": state["current_question"],
        },
    )


@router.post("/{interview_id}/end", response_model=ApiResponse)
def end_interview(
    interview_id: int,
    workspace_code: str = Query(..., description="Workspace code"),
) -> ApiResponse:
    """End an interview session."""
    if interview_id not in active_interviews:
        raise HTTPException(status_code=404, detail="Interview not found")

    client = active_interviews[interview_id]["client"]

    try:
        result = client.end_interview(
            workspace_code=workspace_code,
            interview_id=interview_id,
        )

        # Remove from active interviews
        del active_interviews[interview_id]

        return ApiResponse(
            code=0,
            data={
                "interview_id": interview_id,
                "ended_at": result.get("ended_at"),
            },
        )

    except BackendAPIError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
