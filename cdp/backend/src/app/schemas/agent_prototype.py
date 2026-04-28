"""Agent Prototype schemas."""

import enum
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class AgentPrototypeStatus(str, enum.Enum):
    draft = "draft"
    published = "published"
    archived = "archived"


class AgentPromptType(str, enum.Enum):
    # Layer 1: Cognition - 解决"怎么思考"
    SOUL = "soul"
    MEMORY = "memory"
    REASONING = "reasoning"
    # Layer 2: Organization - 解决"怎么协作"
    AGENTS = "agents"
    WORKFLOW = "workflow"
    COMMUNICATION = "communication"


# ============== Agent Prototype Schemas ==============


class AgentPrototypeCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="原型名称")
    description: Optional[str] = Field(None, description="原型描述")
    model: str = Field(..., min_length=1, max_length=100, description="模型名称")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0, description="温度参数")
    max_tokens: int = Field(default=4096, ge=1, description="最大token数")
    prompt_selections: Optional[dict] = Field(default=None, description="Prompt版本选择")


class AgentPrototypeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    model: Optional[str] = Field(None, min_length=1, max_length=100)
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(None, ge=1)
    prompt_selections: Optional[dict] = None
    status: Optional[AgentPrototypeStatus] = None


class AgentPrototypeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: Optional[str]
    version: str
    model: str
    temperature: float
    max_tokens: int
    prompt_selections: dict
    status: AgentPrototypeStatus
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int]
    updated_by: Optional[int]


class AgentPrototypeListResponse(BaseModel):
    items: list[AgentPrototypeResponse]
    total: int
    page: int
    page_size: int


# ============== Agent Prototype Prompt Schemas ==============


class AgentPrototypePromptCreate(BaseModel):
    prototype_id: str = Field(..., description="原型ID")
    type: AgentPromptType = Field(..., description="Prompt类型")
    name: Optional[str] = Field(None, max_length=255, description="Prompt名称")
    content: str = Field(..., min_length=1, description="Prompt内容（Markdown）")
    version: str = Field(default="1.0.0", description="版本号")
    order_index: int = Field(default=0, description="排序索引")


class AgentPrototypePromptUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    content: Optional[str] = Field(None, min_length=1)
    order_index: Optional[int] = None


class AgentPrototypePromptResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    prototype_id: str
    type: str
    name: Optional[str]
    content: str
    version: str
    order_index: int
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int]
    updated_by: Optional[int]


class AgentPrototypePromptListResponse(BaseModel):
    items: list[AgentPrototypePromptResponse]
    total: int


# ============== Agent Prototype Version Schemas ==============


class AgentPrototypeVersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    prototype_id: str
    version: str
    config_snapshot: dict
    prompt_snapshot: dict
    change_summary: Optional[str]
    created_at: datetime
    created_by: Optional[int]


class AgentPrototypeVersionListResponse(BaseModel):
    items: list[AgentPrototypeVersionResponse]
    total: int


# ============== Publish / Rollback Schemas ==============


class AgentPrototypePublish(BaseModel):
    version: Optional[str] = Field(None, description="新版本号（不提供则自动递增）")
    change_summary: Optional[str] = Field(None, description="变更说明")


class AgentPrototypeRollback(BaseModel):
    version: str = Field(..., description="要回滚到的目标版本")
