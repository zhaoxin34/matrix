"""Agent Prototype Pydantic schemas."""

import enum
from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, Field, field_validator


class AgentPromptType(str, enum.Enum):
    """Prompt types for agent configuration."""

    SOUL = "soul"
    MEMORY = "memory"
    REASONING = "reasoning"
    AGENTS = "agents"
    WORKFLOW = "workflow"
    COMMUNICATION = "communication"


class AgentPrototypeStatus(str, enum.Enum):
    """Agent prototype status."""

    DRAFT = "draft"
    ENABLED = "enabled"
    DISABLED = "disabled"


class PromptsField(BaseModel):
    """Prompts field structure."""

    soul: str = ""
    memory: str = ""
    reasoning: str = ""
    agents: str = ""
    workflow: str = ""
    communication: str = ""

    @field_validator("soul", "memory", "reasoning", "agents", "workflow", "communication", mode="before")
    @classmethod
    def empty_string_to_default(cls, v):
        if v is None:
            return ""
        return v


# Request schemas
class CreateAgentPrototype(BaseModel):
    """Create agent prototype request."""

    name: str = Field(..., min_length=1, max_length=255, description="Prototype name")
    description: str | None = Field(None, description="Prototype description")
    model: str = Field(..., min_length=1, max_length=100, description="AI model name")
    temperature: float = Field(0.7, ge=0, le=2, description="Temperature for AI generation")
    max_tokens: int = Field(4096, ge=1, le=100000, description="Max tokens for AI generation")
    prompts: PromptsField = Field(default_factory=PromptsField, description="Prompts configuration")


class UpdateAgentPrototype(BaseModel):
    """Update agent prototype request."""

    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    model: str | None = Field(None, min_length=1, max_length=100)
    temperature: float | None = Field(None, ge=0, le=2)
    max_tokens: int | None = Field(None, ge=1, le=100000)
    prompts: PromptsField | None = None


class PublishRequest(BaseModel):
    """Publish prototype request."""

    version: str = Field(..., description="Version number (e.g., 1.0.0, 1.1.0)")
    change_summary: str | None = Field(None, description="Change summary for this version")


class RollbackRequest(BaseModel):
    """Rollback prototype request."""

    version: str = Field(..., description="Target version to rollback to")


# Response schemas
class AgentPrototypeVersionResponse(BaseModel):
    """Agent prototype version response."""

    id: int
    prototype_id: int
    version: str
    prompts_snapshot: dict
    config_snapshot: dict
    change_summary: str | None
    created_at: datetime
    created_by: int

    class Config:
        from_attributes = True


class AgentPrototypeResponse(BaseModel):
    """Agent prototype response."""

    id: int
    name: str
    description: str | None
    version: str
    model: str
    temperature: float
    max_tokens: int
    prompts: dict
    status: AgentPrototypeStatus
    created_at: datetime
    updated_at: datetime
    created_by: int
    updated_by: int | None

    class Config:
        from_attributes = True


class AgentPrototypeListResponse(BaseModel):
    """Agent prototype list response."""

    id: int
    name: str
    version: str
    status: AgentPrototypeStatus
    model: str
    created_at: datetime

    class Config:
        from_attributes = True


class PaginatedAgentPrototypeResponse(BaseModel):
    """Paginated agent prototype list response."""

    items: list[AgentPrototypeResponse]
    total: int
    page: int
    page_size: int
    total_pages: int