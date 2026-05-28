"""Skill schemas for API request/response validation."""

from datetime import datetime

from pydantic import BaseModel, Field

from app.models.skill import SkillLevel, SkillStatus


class FileSnapshotItem(BaseModel):
    """File snapshot item schema."""

    file_metadata_id: int
    file_id: int


class SkillCreate(BaseModel):
    """Request schema for creating a Skill."""

    code: str = Field(..., min_length=1, max_length=100, description="Unique identifier")
    name: str = Field(..., min_length=1, max_length=200, description="Display name")
    level: SkillLevel = Field(..., description="Granularity level")
    tags: list[str] | None = Field(default=None, description="Tag array")


class SkillUpdate(BaseModel):
    """Request schema for updating a Skill."""

    name: str | None = Field(default=None, min_length=1, max_length=200)
    level: SkillLevel | None = Field(default=None)
    tags: list[str] | None = Field(default=None)


class SkillVersionInfo(BaseModel):
    """Skill version info for listing."""

    id: int
    version: str
    comment: str | None
    created_at: datetime


class SkillListItem(BaseModel):
    """Skill item for list response."""

    id: int
    code: str
    name: str
    level: SkillLevel
    tags: list[str] | None
    status: SkillStatus
    current_version: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class SkillListResponse(BaseModel):
    """Response schema for Skill list."""

    total: int
    items: list[SkillListItem]
    page: int
    page_size: int


class SkillDetail(BaseModel):
    """Response schema for Skill detail."""

    id: int
    code: str
    name: str
    level: SkillLevel
    tags: list[str] | None
    status: SkillStatus
    draft_snapshot: list[FileSnapshotItem] | None
    current_version: SkillVersionInfo | None
    create_user_id: int | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SkillResponse(BaseModel):
    """Response schema for single Skill (create/update response)."""

    id: int
    code: str
    name: str
    level: SkillLevel
    tags: list[str] | None
    status: SkillStatus
    draft_snapshot: list[FileSnapshotItem] | None
    create_user_id: int | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SkillDisableResponse(BaseModel):
    """Response schema for disabling a Skill."""

    code: str
    status: SkillStatus
    disabled_at: datetime


class SkillDeleteResponse(BaseModel):
    """Response schema for deleting a Skill."""

    success: bool = True
