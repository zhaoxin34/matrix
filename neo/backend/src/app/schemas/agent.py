"""Agent Pydantic schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class AgentSkill(BaseModel):
    """Agent skill reference."""

    id: int = Field(..., description="Skill ID")
    version: Optional[str] = Field(None, description="Skill version")


class AgentConfig(BaseModel):
    """Agent runtime configuration."""

    temperature: float = Field(default=0.7, description="Model temperature")
    max_tokens: int = Field(default=4096, description="Max output tokens")
    thinking: str = Field(default="low", description="Thinking depth: low/medium/high")
    timeout: int = Field(default=60, description="Timeout in seconds")
    retry: dict = Field(default_factory=dict, description="Retry configuration")


# ============ Request Schemas ============


class AgentCreate(BaseModel):
    """Schema for creating a new Agent."""

    name: str = Field(..., min_length=1, max_length=32, description="Agent name (unique within workspace)")
    description: Optional[str] = Field(None, max_length=500, description="Description")
    prototype_id: int = Field(..., description="Prototype ID")
    prototype_version: str = Field(..., description="Prototype version")
    model: Optional[str] = Field(None, max_length=64, description="Model (inherits from prototype if not specified)")
    skills: list = Field(default_factory=list, description="Enabled skills (list of strings or dicts)")
    config: dict = Field(default_factory=dict, description="Runtime configuration")


class AgentUpdate(BaseModel):
    """Schema for updating an Agent."""

    name: Optional[str] = Field(None, min_length=1, max_length=32, description="Agent name")
    description: Optional[str] = Field(None, max_length=500, description="Description")
    model: Optional[str] = Field(None, max_length=64, description="Model")
    skills: Optional[list] = Field(None, description="Enabled skills")
    config: Optional[dict] = Field(None, description="Runtime configuration")


class AgentListQuery(BaseModel):
    """Schema for listing Agents with filters."""

    page: int = Field(default=1, ge=1, description="Page number")
    page_size: int = Field(default=20, ge=1, le=100, description="Items per page")
    status: Optional[str] = Field(None, description="Filter by status: enabled/disabled")
    prototype_id: Optional[int] = Field(None, description="Filter by prototype")
    search: Optional[str] = Field(None, max_length=100, description="Search in name/description")


# ============ Response Schemas ============


class AgentResponse(BaseModel):
    """Schema for Agent response."""

    id: int
    name: str
    description: Optional[str]
    prototype_id: int
    prototype_version: str
    workspace_id: int
    model: str
    skills: list  # Can be list of dicts or list of strings
    config: dict
    status: str
    created_by: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AgentListResponse(BaseModel):
    """Schema for Agent list response with pagination."""

    items: list[AgentResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class AgentStatusResponse(BaseModel):
    """Schema for Agent status update response."""

    id: int
    status: str
    updated_at: datetime

    model_config = {"from_attributes": True}
