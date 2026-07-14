"""Pydantic schemas for knlg_agent_mapping API."""

import re
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

# Type value must be lowercase snake_case, starting with a letter, 1-32 chars.
_TYPE_PATTERN = re.compile(r"^[a-z][a-z0-9_]*$")


class AgentMappingCreate(BaseModel):
    """Schema for creating a new (type -> agent_id) mapping."""

    type: str = Field(
        ...,
        min_length=1,
        max_length=32,
        description="用途类型，1-32 字符，小写字母开头，仅含 a-z / 0-9 / _",
    )
    agent_id: int = Field(..., gt=0, description="关联 Agent 实例 ID")

    @field_validator("type")
    @classmethod
    def _validate_type_pattern(cls, v: str) -> str:
        if not _TYPE_PATTERN.match(v):
            raise ValueError(
                "type 必须以小写字母开头，仅含小写字母、数字和下划线",
            )
        return v


class AgentMappingUpdate(BaseModel):
    """Schema for updating the agent_id of an existing mapping.

    `type` is immutable after creation; only `agent_id` can be changed.
    """

    agent_id: int = Field(..., gt=0, description="新的 Agent 实例 ID")


class AgentMappingResponse(BaseModel):
    """Schema for an Agent Mapping response payload."""

    id: int
    workspace_id: int
    type: str
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
