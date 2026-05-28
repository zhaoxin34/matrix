"""SkillVersion schemas for API request/response validation."""

from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.skill import FileSnapshotItem


class SkillVersionCreate(BaseModel):
    """Request schema for publishing a Skill version."""

    version: str = Field(..., min_length=1, max_length=50, description="Version string")
    comment: str = Field(..., min_length=1, max_length=500, description="Release note")


class SkillVersionResponse(BaseModel):
    """Response schema for Skill version."""

    id: int
    skill_id: int
    version: str
    file_snapshot: list[FileSnapshotItem]
    comment: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class SkillVersionListItem(BaseModel):
    """Skill version item for list response."""

    id: int
    version: str
    comment: str | None
    created_at: datetime
    is_current: bool


class SkillVersionListResponse(BaseModel):
    """Response schema for version list."""

    total: int
    items: list[SkillVersionListItem]


class SkillRollbackRequest(BaseModel):
    """Request schema for rolling back a Skill."""

    version_id: int = Field(..., description="Target version ID to rollback to")


class SkillRollbackResponse(BaseModel):
    """Response schema for Skill rollback."""

    code: str
    draft_snapshot: list[FileSnapshotItem]
    rolled_back_version: str
