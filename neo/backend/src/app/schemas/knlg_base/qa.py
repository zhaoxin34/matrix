"""QA Library (knlg_question, knlg_interview, knlg_question_tree) Pydantic schemas."""

from datetime import datetime

from pydantic import BaseModel, Field

# ============ Question Tree Templates ============


class QuestionTreeCreate(BaseModel):
    """Schema for creating a question tree template."""

    name: str = Field(..., min_length=1, max_length=255)
    domain: str = Field(..., min_length=1, max_length=64)
    description: str | None = Field(None, max_length=2000)
    questions: list[dict] = Field(
        ...,
        description="Array of question objects with id/text/followups",
    )


class QuestionTreeUpdate(BaseModel):
    """Schema for updating a question tree (creates new version)."""

    name: str | None = Field(None, min_length=1, max_length=255)
    domain: str | None = Field(None, min_length=1, max_length=64)
    description: str | None = Field(None, max_length=2000)
    questions: list[dict] | None = None
    is_active: bool | None = None


class QuestionTreeResponse(BaseModel):
    id: int
    name: str
    domain: str
    description: str | None
    questions: list[dict]
    version: str
    is_active: bool
    workspace_id: int
    created_by: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class QuestionTreeListQuery(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    domain: str | None = None
    is_active: bool | None = None


class QuestionTreeListResponse(BaseModel):
    items: list[QuestionTreeResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ============ Questions ============


class QuestionCreate(BaseModel):
    text: str = Field(..., min_length=1)
    domain: str = Field(..., min_length=1, max_length=64)
    tags: list[str] | None = None
    parent_question_id: int | None = None
    tree_id: int | None = None
    priority: int = Field(default=0, ge=0)


class QuestionUpdate(BaseModel):
    text: str | None = Field(None, min_length=1)
    domain: str | None = Field(None, min_length=1, max_length=64)
    tags: list[str] | None = None
    tree_id: int | None = None
    parent_question_id: int | None = None
    priority: int | None = Field(None, ge=0)


class QuestionResponse(BaseModel):
    id: int
    text: str
    domain: str
    tags: list[str] | None
    parent_question_id: int | None
    tree_id: int | None
    priority: int
    status: str
    workspace_id: int
    created_by: int
    created_at: datetime
    updated_at: datetime
    interview_count: int | None = Field(None, description="Number of interviews for this question")

    model_config = {"from_attributes": True}


class QuestionListQuery(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    domain: str | None = None
    status: str | None = None
    tags: str | None = Field(None, description="Comma-separated tag list")
    keyword: str | None = Field(None, max_length=200)
    tree_id: int | None = None


class QuestionListResponse(BaseModel):
    items: list[QuestionResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ============ Interview Sessions ============


class InterviewSessionCreate(BaseModel):
    expert_id: int = Field(..., description="Expert user ID")
    topic: str = Field(..., min_length=1, max_length=255)
    mode: str = Field(default="manual", description="ai_agent / manual (P0 only supports manual)")


class InterviewSessionUpdate(BaseModel):
    topic: str | None = Field(None, min_length=1, max_length=255)
    mode: str | None = None


class InterviewSessionResponse(BaseModel):
    id: int
    expert_id: int
    topic: str
    mode: str
    started_at: datetime | None
    ended_at: datetime | None
    workspace_id: int
    created_at: datetime
    interviews: list["InterviewResponse"] | None = Field(
        None,
        description="Interviews in this session (only included in detail response)",
    )

    model_config = {"from_attributes": True}


class InterviewSessionEndResponse(BaseModel):
    id: int
    ended_at: datetime

    model_config = {"from_attributes": True}


# ============ Interviews ============


class InterviewCreate(BaseModel):
    session_id: int = Field(...)
    question_id: int = Field(...)
    expert_id: int = Field(...)
    mode: str = Field(default="manual")


class InterviewResponse(BaseModel):
    id: int
    session_id: int
    question_id: int
    expert_id: int
    mode: str
    summary: str | None
    started_at: datetime | None
    ended_at: datetime | None
    workspace_id: int
    created_at: datetime
    turns: list["InterviewTurnResponse"] | None = Field(
        None,
        description="Turns in this interview (only included in detail response)",
    )

    model_config = {"from_attributes": True}


class InterviewEndResponse(BaseModel):
    id: int
    ended_at: datetime
    question_status_updated: str | None = Field(
        None,
        description="If linked question status was auto-updated to 'answered'",
    )

    model_config = {"from_attributes": True}


# ============ Interview Turns ============


class InterviewTurnCreate(BaseModel):
    question: str = Field(..., min_length=1)
    answer: str = Field(..., min_length=1)
    parent_turn_id: int | None = None
    type: str = Field(default="initial", description="initial/followup/counter_example/clarification")
    confidence: float = Field(default=0.5, ge=0.0, le=1.0)
    source_case_ids: list[int] | None = None
    tags: list[str] | None = None
    metadata_: dict | None = Field(None, alias="metadata")


class InterviewTurnUpdate(BaseModel):
    question: str | None = Field(None, min_length=1)
    answer: str | None = Field(None, min_length=1)
    type: str | None = None
    confidence: float | None = Field(None, ge=0.0, le=1.0)
    tags: list[str] | None = None
    metadata_: dict | None = Field(None, alias="metadata")


class InterviewTurnResponse(BaseModel):
    id: int
    interview_id: int
    sequence: int
    question: str
    answer: str
    type: str
    confidence: float
    parent_turn_id: int | None
    source_case_ids: list[int] | None
    tags: list[str] | None
    expert_id: int
    metadata_: dict | None = Field(None, alias="metadata")
    workspace_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class InterviewTurnListResponse(BaseModel):
    items: list[InterviewTurnResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class InterviewTurnReorderRequest(BaseModel):
    """Schema for reordering turns within an interview."""

    items: list[dict] = Field(
        ...,
        description="List of {turn_id, sequence} objects",
    )


# ============ Turn References ============


class TurnRefCreate(BaseModel):
    source_turn_id: int = Field(...)
    target_turn_id: int = Field(...)
    relation: str = Field(
        ...,
        description="support / counter_example / refine / derived_from / replaced_by",
    )
    note: str | None = Field(None, max_length=1000)


class TurnRefResponse(BaseModel):
    id: int
    source_turn_id: int
    target_turn_id: int
    relation: str
    note: str | None
    created_by: int
    created_at: datetime

    model_config = {"from_attributes": True}


class TurnRefListResponse(BaseModel):
    items: list[TurnRefResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# Resolve forward references
InterviewSessionResponse.model_rebuild()
InterviewResponse.model_rebuild()
