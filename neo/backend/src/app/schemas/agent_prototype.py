"""Agent Prototype Pydantic schemas."""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class AgentPrototypeStatus(str, Enum):
    """Agent Prototype status enum."""

    DRAFT = "draft"
    ENABLED = "enabled"
    DISABLED = "disabled"


class PromptsConfig(BaseModel):
    """Prompts configuration structure."""

    system: str = Field(default="", description="System prompt")
    user: str = Field(default="", description="User prompt template")
    assistant: str = Field(default="", description="Assistant prompt")


class AgentConfig(BaseModel):
    """Agent runtime configuration."""

    temperature: float = Field(default=0.7, description="Model temperature")
    max_tokens: int = Field(default=4096, description="Max output tokens")
    thinking: str = Field(default="low", description="Thinking depth: low/medium/high")


# ============ Request Schemas ============


class AgentPrototypeCreate(BaseModel):
    """Schema for creating a new Agent Prototype."""

    name: str = Field(..., min_length=1, max_length=64, description="Prototype name")
    description: str | None = Field(None, max_length=500, description="Description")
    model: str = Field(default="gpt-4", max_length=64, description="Model name (legacy, for backward compatibility)")
    prompts: dict = Field(default_factory=dict, description="Prompts configuration")
    config: dict = Field(default_factory=dict, description="Runtime configuration")
    provider_id: int | None = Field(None, description="Model Provider ID")
    model_id: str | None = Field(None, max_length=64, description="Model ID from ModelConfig")
    llm_config: dict | None = Field(None, description="LLM runtime configuration (temperature, thinking, etc.)")


class AgentPrototypeUpdate(BaseModel):
    """Schema for updating an Agent Prototype."""

    name: str | None = Field(None, min_length=1, max_length=64, description="Prototype name")
    description: str | None = Field(None, max_length=500, description="Description")
    model: str | None = Field(None, max_length=64, description="Model name (legacy)")
    prompts: dict | None = Field(None, description="Prompts configuration")
    config: dict | None = Field(None, description="Runtime configuration")
    provider_id: int | None = Field(None, description="Model Provider ID")
    model_id: str | None = Field(None, max_length=64, description="Model ID from ModelConfig")
    llm_config: dict | None = Field(None, description="LLM runtime configuration")


class AgentPrototypePublish(BaseModel):
    """Schema for publishing an Agent Prototype."""

    change_summary: str = Field(..., min_length=1, description="Change summary (required)")


class AgentPrototypeRollback(BaseModel):
    """Schema for rolling back to a specific version."""

    version_id: int = Field(..., alias="target_version_id", description="Version ID to rollback to")

    model_config = {"populate_by_name": True}


class AgentPrototypeStatusUpdate(BaseModel):
    """Schema for updating prototype status (enable/disable)."""

    status: AgentPrototypeStatus = Field(..., description="New status")


class AgentPrototypeListQuery(BaseModel):
    """Schema for listing Agent Prototypes with filters."""

    page: int = Field(default=1, ge=1, description="Page number")
    page_size: int = Field(default=20, ge=1, le=100, description="Items per page")
    status: AgentPrototypeStatus | None = Field(None, description="Filter by status")
    search: str | None = Field(None, max_length=100, description="Search by name")


# ============ Response Schemas ============


class AgentPrototypeVersionResponse(BaseModel):
    """Schema for Agent Prototype Version response."""

    id: int
    version: str
    change_summary: str | None
    is_rollback: bool
    created_by: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AgentPrototypeResponse(BaseModel):
    """Schema for Agent Prototype response."""

    id: int
    code: str
    name: str
    description: str | None
    version: str | None
    model: str
    prompts: dict
    config: dict
    status: AgentPrototypeStatus
    created_by: int
    created_at: datetime
    updated_at: datetime
    # New fields for model provider
    provider_id: int | None = None
    model_id: str | None = None
    llm_config: dict | None = None

    model_config = ConfigDict(from_attributes=True)


class AgentPrototypeListResponse(BaseModel):
    """Schema for Agent Prototype list response with pagination."""

    items: list[AgentPrototypeResponse]
    total: int
    page: int
    page_size: int


class AgentPrototypeVersionListResponse(BaseModel):
    """Schema for Agent Prototype Version list response."""

    items: list[AgentPrototypeVersionResponse]
    total: int


class AgentPrototypeWithVersionsResponse(AgentPrototypeResponse):
    """Schema for Agent Prototype with version history."""

    versions: list[AgentPrototypeVersionResponse] = []


class NextVersionResponse(BaseModel):
    """Schema for next version number response."""

    next_version: str = Field(..., description="Next version number (e.g., '1.0.1')")
