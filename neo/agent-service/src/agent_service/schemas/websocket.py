"""WebSocket message schemas for interview agent."""

from typing import Literal

from pydantic import BaseModel, Field


class WSStartInterview(BaseModel):
    """Client -> Server: Start a new interview."""

    type: Literal["start"] = "start"
    workspace_code: str = Field(description="Workspace code")
    expert_id: int = Field(description="Expert user ID")
    question_tree_id: int = Field(description="Question tree template ID")


class WSAnswer(BaseModel):
    """Client -> Server: Submit an answer."""

    type: Literal["answer"] = "answer"
    interview_id: int = Field(description="Interview ID")
    answer: str = Field(description="Expert's answer to current question")


class WSEndInterview(BaseModel):
    """Client -> Server: End interview."""

    type: Literal["end"] = "end"
    interview_id: int = Field(description="Interview ID")


# Server -> Client messages


class WSSessionStarted(BaseModel):
    """Server -> Client: Interview session started."""

    type: Literal["session_started"] = "session_started"
    interview_id: int
    session_id: int
    agent_id: int
    first_question: str
    questions_count: int


class WSQuestion(BaseModel):
    """Server -> Client: New question arrived."""

    type: Literal["question"] = "question"
    question_id: str
    question_text: str
    question_index: int
    total_questions: int
    is_followup: bool = False


class WSAnswerReceived(BaseModel):
    """Server -> Client: Answer was recorded."""

    type: Literal["answer_received"] = "answer_received"
    turn_id: int


class WSFollowupRequired(BaseModel):
    """Server -> Client: Follow-up question needed (LLM thinking)."""

    type: Literal["followup_required"] = "followup_required"
    thinking: bool = True


class WSTurnComplete(BaseModel):
    """Server -> Client: Turn completed."""

    type: Literal["turn_complete"] = "turn_complete"
    turn_id: int
    question_id: str
    question_text: str
    answer_text: str
    tags: list[str] = []
    confidence: float = 0.5


class WSInterviewComplete(BaseModel):
    """Server -> Client: Interview finished."""

    type: Literal["interview_complete"] = "interview_complete"
    interview_id: int
    total_turns: int
    summary: str = ""


class WSError(BaseModel):
    """Server -> Client: Error occurred."""

    type: Literal["error"] = "error"
    code: int
    message: str


class WSAck(BaseModel):
    """Server -> Client: Acknowledgment."""

    type: Literal["ack"] = "ack"
    message: str = "ok"
