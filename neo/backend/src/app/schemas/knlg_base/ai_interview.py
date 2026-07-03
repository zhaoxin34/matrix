"""Phase 3 AI Interview Pydantic schemas."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class AiSessionCreate(BaseModel):
    """Create AI interview session request."""

    topic: str = Field(..., min_length=1, max_length=255)
    tree_id: int | None = None
    max_turns: int = Field(default=8, ge=1, le=50)


class AiSessionResponse(BaseModel):
    id: int
    expert_id: int
    topic: str
    mode: str
    status: str
    tree_id: int | None = None
    current_turn_index: int
    max_turns: int
    last_event_id: str | None = None
    summary: str | None = None
    started_at: datetime | None = None
    ended_at: datetime | None = None
    workspace_id: int
    created_by: int
    created_at: datetime
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class AiSessionDetailResponse(AiSessionResponse):
    """Detailed AI session response (placeholder for future fields)."""

    pass


class AiSessionListResponse(BaseModel):
    items: list[AiSessionResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
