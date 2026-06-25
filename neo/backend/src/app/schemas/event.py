"""Pydantic schemas for events."""

import re
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

# Entity name format: {type}_{id}, e.g., 'lead_123', 'user_zhangsan'
ENTITY_NAME_PATTERN = re.compile(r"^[a-z0-9_]+_[a-zA-Z0-9_]+$")


class EventBase(BaseModel):
    """Base schema for event."""

    name: str = Field(..., max_length=255, description="Event name, e.g., 'lead.assigned'")
    entity_name: str = Field(..., max_length=255, description="Associated entity (subject), format: {type}_{id}")
    target_entity_name: str | None = Field(None, max_length=255, description="Target entity (object)")
    actor: str = Field(..., max_length=255, description="Who triggered the event")
    timestamp: datetime = Field(..., description="When the event occurred")
    page_url: str | None = Field(None, max_length=512, description="Page URL")
    session_id: str | None = Field(None, max_length=64, description="Session ID")
    metadata: Any | None = Field(default=None, description="Extended data")
    embedded_site_id: int | None = Field(None, description="Associated embedded site ID")

    @field_validator("entity_name")
    @classmethod
    def validate_entity_name(cls, v: str) -> str:
        """Validate entity_name format: {type}_{id}."""
        if not ENTITY_NAME_PATTERN.match(v):
            raise ValueError("Entity name must follow format: {type}_{id}, e.g., 'lead_123' or 'user_zhangsan'")
        return v

    @field_validator("page_url")
    @classmethod
    def validate_url(cls, v: str | None) -> str | None:
        """Validate page_url is a valid URL format if provided."""
        if v is None:
            return v
        url_pattern = re.compile(
            r"^https?://"
            r"(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|"
            r"localhost|"
            r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})"
            r"(?::\d+)?"
            r"(?:/?|[/?]\S+)$",
            re.IGNORECASE,
        )
        if not url_pattern.match(v):
            raise ValueError("Invalid URL format. Must start with http:// or https://")
        return v


class EventCreate(EventBase):
    """Schema for creating an event."""


class EventUpdate(BaseModel):
    """Schema for updating an event."""

    name: str | None = Field(None, max_length=255)
    entity_name: str | None = Field(None, max_length=255)
    target_entity_name: str | None = Field(None, max_length=255)
    actor: str | None = Field(None, max_length=255)
    timestamp: datetime | None = None
    page_url: str | None = Field(None, max_length=512)
    session_id: str | None = Field(None, max_length=64)
    metadata: Any | None = Field(default=None)
    embedded_site_id: int | None = Field(None, description="Associated embedded site ID")

    @field_validator("entity_name")
    @classmethod
    def validate_entity_name(cls, v: str | None) -> str | None:
        """Validate entity_name format if provided."""
        if v is None:
            return v
        if not ENTITY_NAME_PATTERN.match(v):
            raise ValueError("Entity name must follow format: {type}_{id}")
        return v

    @field_validator("page_url")
    @classmethod
    def validate_url(cls, v: str | None) -> str | None:
        """Validate page_url is a valid URL format if provided."""
        if v is None:
            return v
        url_pattern = re.compile(
            r"^https?://"
            r"(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|"
            r"localhost|"
            r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})"
            r"(?::\d+)?"
            r"(?:/?|[/?]\S+)$",
            re.IGNORECASE,
        )
        if not url_pattern.match(v):
            raise ValueError("Invalid URL format. Must start with http:// or https://")
        return v


class EventResponse(EventBase):
    """Schema for event response."""

    id: int
    workspace_id: int
    created_by: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EventListResponse(BaseModel):
    """Schema for event list response with pagination."""

    items: list[EventResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
