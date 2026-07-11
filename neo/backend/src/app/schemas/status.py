"""Pydantic schemas for status."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

# Entity type format: lowercase letters, numbers, underscores, max 128 chars
ENTITY_TYPE_PATTERN = r"^[a-z0-9_]+$"


class StatusBase(BaseModel):
    """Base schema for status."""

    entity_type: str = Field(..., max_length=128, description="Entity type, e.g., 'lead', 'user'")
    entity_id: str = Field(..., max_length=255, description="Entity ID in business system")
    attributes: dict[str, Any] = Field(..., description="Attribute snapshot")
    stat_at: datetime = Field(..., description="Statistics time")
    source: str | None = Field(None, max_length=128, description="Source of the status")
    session_id: str | None = Field(None, max_length=64, description="Session ID")

    @field_validator("entity_type")
    @classmethod
    def validate_entity_type(cls, v: str) -> str:
        """Validate entity_type format: lowercase letters, numbers, underscores."""
        import re

        if not re.match(ENTITY_TYPE_PATTERN, v):
            raise ValueError("Entity type must contain only lowercase letters, numbers, and underscores")
        return v


class StatusCreate(StatusBase):
    """Schema for creating a status."""


class StatusUpdate(BaseModel):
    """Schema for updating a status."""

    entity_type: str | None = Field(None, max_length=128)
    entity_id: str | None = Field(None, max_length=255)
    attributes: dict[str, Any] | None = None
    stat_at: datetime | None = None
    source: str | None = Field(None, max_length=128)
    session_id: str | None = Field(None, max_length=64)

    @field_validator("entity_type")
    @classmethod
    def validate_entity_type(cls, v: str | None) -> str | None:
        """Validate entity_type format if provided."""
        import re

        if v is None:
            return v
        if not re.match(ENTITY_TYPE_PATTERN, v):
            raise ValueError("Entity type must contain only lowercase letters, numbers, and underscores")
        return v


class StatusResponse(StatusBase):
    """Schema for status response."""

    id: int
    workspace_id: int
    created_by: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StatusListResponse(BaseModel):
    """Schema for status list response with pagination."""

    items: list[StatusResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
