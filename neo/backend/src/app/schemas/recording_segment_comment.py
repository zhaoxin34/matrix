"""RecordingSegmentComment schemas."""

from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class CreatorBrief(BaseModel):
    """Brief creator info embedded in comment responses."""

    id: int
    name: str


class RecordingSegmentCommentBase(BaseModel):
    """Base schema for shared fields."""

    show_time: Decimal = Field(..., ge=0, description="Show time (seconds relative to segment start)")
    hide_time: Decimal = Field(..., gt=0, description="Hide time (seconds relative to segment start)")
    abstract: str = Field(..., min_length=1, max_length=255, description="Required short summary")
    content: Optional[str] = Field(None, max_length=5000, description="Optional detailed description")

    @field_validator("hide_time")
    @classmethod
    def hide_after_show(cls, v: Decimal, info) -> Decimal:
        """Ensure hide_time > show_time."""
        show = info.data.get("show_time")
        if show is not None and v <= show:
            raise ValueError("hide_time must be greater than show_time")
        return v


class RecordingSegmentCommentCreate(RecordingSegmentCommentBase):
    """Create schema."""

    segment_uid: str = Field(..., description="Segment UID this comment belongs to")


class RecordingSegmentCommentUpdate(BaseModel):
    """Update schema — all fields optional, but at least one must be provided."""

    show_time: Optional[Decimal] = Field(None, ge=0)
    hide_time: Optional[Decimal] = Field(None, gt=0)
    abstract: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = Field(None, max_length=5000)

    @field_validator("hide_time")
    @classmethod
    def hide_after_show(cls, v: Optional[Decimal], info) -> Optional[Decimal]:
        """Ensure hide_time > show_time when both provided."""
        if v is None:
            return v
        show = info.data.get("show_time")
        if show is not None and v <= show:
            raise ValueError("hide_time must be greater than show_time")
        return v


class RecordingSegmentCommentResponse(BaseModel):
    """Response schema."""

    uid: str
    recording_uid: str
    segment_uid: str
    show_time: float
    hide_time: float
    abstract: str
    content: Optional[str] = None
    creator: CreatorBrief
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RecordingSegmentCommentListResponse(BaseModel):
    """Paginated list response."""

    items: list[RecordingSegmentCommentResponse]
    pagination: dict


class BatchDeleteRequest(BaseModel):
    """Batch delete request body."""

    comment_uids: list[str] = Field(..., min_length=1, max_length=200)


class BatchDeleteResponse(BaseModel):
    """Batch delete response."""

    deleted_count: int
    skipped: list[str] = Field(default_factory=list)
