"""Interview Agent state definitions."""

from typing import TypedDict

from pydantic import BaseModel, Field


class InterviewTurn(BaseModel):
    """Represents one turn of interview Q&A."""

    question_id: str = Field(description="Question identifier")
    question_text: str = Field(description="Question text")
    answer_text: str = Field(description="Expert's answer")
    turn_type: str = Field(default="initial", description="Type: initial/followup")
    confidence: float = Field(default=0.5, description="Confidence score 0-1")
    tags: list[str] | None = Field(default=None, description="Extracted tags")
    parent_turn_id: str | None = Field(default=None, description="Parent turn if followup")


class InterviewState(TypedDict):
    """State for the interview agent LangGraph."""

    # Session info
    workspace_code: str
    expert_id: int
    interview_id: int | None
    session_id: int | None

    # Question tree
    question_tree: dict
    questions: list[dict]  # Parsed question list
    current_question_index: int

    # Conversation
    turns: list[InterviewTurn]
    current_question: str | None
    current_answer: str | None

    # Control
    should_continue: bool
    max_followup_depth: int
    current_followup_depth: int


class InterviewConfig(BaseModel):
    """Configuration for interview agent."""

    workspace_code: str
    expert_id: int
    question_tree_id: int
    agent_id: int

    # LLM settings
    model: str = "gpt-4o"
    temperature: float = 0.7
    max_tokens: int = 4096

    # Interview settings
    max_followup_depth: int = 5
    max_initial_questions: int | None = None  # None = all

    # Backend settings
    backend_url: str = "http://localhost:8000"
    api_key: str = ""
