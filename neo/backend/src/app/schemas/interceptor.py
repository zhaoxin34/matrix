"""Interceptor schemas."""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, field_validator


class InterceptorMode(str, Enum):
    """Interceptor mode."""

    OBSERVE = "observe"
    INTERCEPT = "intercept"


def _validate_trigger(v: dict[str, Any]) -> dict[str, Any]:
    """Validate trigger JSON structure."""
    if not isinstance(v, dict):
        raise ValueError("trigger must be a JSON object")
    trigger_type = v.get("type")
    if not trigger_type:
        raise ValueError("trigger must have 'type' field")
    if trigger_type not in ["dom", "network"]:
        raise ValueError("trigger.type must be 'dom' or 'network'")
    if trigger_type == "dom" and "selector" not in v:
        raise ValueError("trigger for 'dom' type must have 'selector' field")
    if trigger_type == "network" and "url_pattern" not in v:
        raise ValueError("trigger for 'network' type must have 'url_pattern' field")
    return v


class InterceptorCreate(BaseModel):
    """Schema for creating an interceptor."""

    embedded_site_id: int = Field(..., description="Associated site ID")
    name: str = Field(..., min_length=1, max_length=255, description="Interceptor name")
    event_name: str = Field(..., min_length=1, max_length=255, description="Event name to report")
    entity_name: str = Field(..., min_length=1, max_length=255, description="Entity being operated on")
    target_entity_name: str | None = Field(None, max_length=255, description="Target entity")
    mode: InterceptorMode = Field(default=InterceptorMode.OBSERVE, description="Interceptor mode")
    trigger: dict[str, Any] = Field(..., description="Trigger configuration")
    before_actions: list[dict[str, Any]] | None = Field(default_factory=list, description="Before actions")
    after_actions: list[dict[str, Any]] | None = Field(default_factory=list, description="After actions")
    page_url_pattern: str | None = Field(None, max_length=512, description="Page URL pattern")
    debounce_ms: int = Field(default=1000, ge=0, le=60000, description="Debounce time in ms")

    _validate_trigger = field_validator("trigger")(_validate_trigger)


class InterceptorUpdate(BaseModel):
    """Schema for updating an interceptor."""

    embedded_site_id: int | None = Field(None, description="Associated site ID")
    name: str | None = Field(None, min_length=1, max_length=255, description="Interceptor name")
    event_name: str | None = Field(None, min_length=1, max_length=255, description="Event name")
    entity_name: str | None = Field(None, min_length=1, max_length=255, description="Entity")
    target_entity_name: str | None = Field(None, max_length=255, description="Target entity")
    mode: InterceptorMode | None = Field(None, description="Interceptor mode")
    trigger: dict[str, Any] | None = Field(None, description="Trigger configuration")
    before_actions: list[dict[str, Any]] | None = Field(None, description="Before actions")
    after_actions: list[dict[str, Any]] | None = Field(None, description="After actions")
    page_url_pattern: str | None = Field(None, max_length=512, description="Page URL pattern")
    debounce_ms: int | None = Field(None, ge=0, le=60000, description="Debounce time in ms")

    _validate_trigger = field_validator("trigger")(_validate_trigger)


class InterceptorResponse(BaseModel):
    """Schema for interceptor response."""

    id: int = Field(..., description="Interceptor ID")
    workspace_id: int = Field(..., description="Workspace ID")
    embedded_site_id: int = Field(..., description="Site ID")
    name: str = Field(..., description="Interceptor name")
    event_name: str = Field(..., description="Event name")
    mode: str = Field(..., description="Interceptor mode")
    entity_name: str = Field(..., description="Entity")
    target_entity_name: str | None = Field(None, description="Target entity")
    trigger_type: str | None = Field(None, description="Trigger type")
    trigger: dict[str, Any] = Field(..., description="Trigger config", validation_alias="trigger")
    before_actions: list[dict[str, Any]] = Field(..., description="Before actions", validation_alias="before_actions")
    after_actions: list[dict[str, Any]] = Field(..., description="After actions", validation_alias="after_actions")
    page_url_pattern: str | None = Field(None, description="Page URL pattern")
    debounce_ms: int = Field(..., description="Debounce time")
    status: str = Field(..., description="Status")
    created_at: datetime = Field(..., description="Created at")
    updated_at: datetime = Field(..., description="Updated at")
    created_by: int = Field(..., description="Created by")

    model_config = {"from_attributes": True, "populate_by_name": True}


class InterceptorListResponse(BaseModel):
    """Schema for interceptor list response."""

    items: list[InterceptorResponse] = Field(..., description="Interceptor list")
    total: int = Field(..., description="Total count")
    page: int = Field(..., description="Current page")
    page_size: int = Field(..., description="Page size")
