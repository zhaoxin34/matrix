"""Pydantic schemas for knlg_agent_mapping API."""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class AgentMappingType(str, Enum):
    """Mapping type values, aligned with AgentPrototypeType.

    The frontend surfaces this as a select; the backend rejects unknown
    values automatically.
    """

    SITE_OPERATION = "site_operation"
    EXPERT_INTERVIEW = "expert_interview"


class AgentMappingCreate(BaseModel):
    """Schema for creating a new (type -> agent_id) mapping."""

    type: AgentMappingType = Field(
        ...,
        description="用途类型，必须与 agent_prototype.type 枚举一致",
    )
    agent_id: int = Field(..., gt=0, description="关联 Agent 实例 ID")


class AgentMappingUpdate(BaseModel):
    """Schema for updating the agent_id of an existing mapping.

    `type` is immutable after creation; only `agent_id` can be changed.
    """

    agent_id: int = Field(..., gt=0, description="新的 Agent 实例 ID")


class AgentMappingResponse(BaseModel):
    """Schema for an Agent Mapping response payload.

    Note: the natural primary key is (workspace_id, type), so there is no
    separate `id` field.
    """

    workspace_id: int
    type: AgentMappingType
    agent_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AgentMappingListResponse(BaseModel):
    """Schema for paginated list of Agent Mappings."""

    items: list[AgentMappingResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
