"""Pydantic schemas for status."""

import re
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

# Entity name format: {type}_{id}, e.g., 'lead_123', 'user_zhangsan'
ENTITY_NAME_PATTERN = re.compile(r"^[a-z0-9_]+_[a-zA-Z0-9_]+$")


class StatusBase(BaseModel):
    """Base schema for status."""

    entity_name: str = Field(..., max_length=255, description="Associated entity, format: {type}_{id}")
    attributes: dict[str, Any] = Field(..., description="Attribute snapshot")
    captured_at: datetime = Field(..., description="When the status was captured")
    source: Optional[str] = Field(None, max_length=128, description="Source of the status")
    session_id: Optional[str] = Field(None, max_length=64, description="Session ID")
    embedded_site_id: Optional[int] = Field(None, description="Associated embedded site ID")

    @field_validator("entity_name")
    @classmethod
    def validate_entity_name(cls, v: str) -> str:
        """Validate entity_name format: {type}_{id}."""
        if not ENTITY_NAME_PATTERN.match(v):
            raise ValueError("Entity name must follow format: {type}_{id}, e.g., 'lead_123' or 'user_zhangsan'")
        return v


class StatusCreate(StatusBase):
    """Schema for creating a status."""

    pass


class StatusUpdate(BaseModel):
    """Schema for updating a status."""

    entity_name: Optional[str] = Field(None, max_length=255)
    attributes: Optional[dict[str, Any]] = None
    captured_at: Optional[datetime] = None
    source: Optional[str] = Field(None, max_length=128)
    session_id: Optional[str] = Field(None, max_length=64)
    embedded_site_id: Optional[int] = Field(None, description="Associated embedded site ID")

    @field_validator("entity_name")
    @classmethod
    def validate_entity_name(cls, v: Optional[str]) -> Optional[str]:
        """Validate entity_name format if provided."""
        if v is None:
            return v
        if not ENTITY_NAME_PATTERN.match(v):
            raise ValueError("Entity name must follow format: {type}_{id}")
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
