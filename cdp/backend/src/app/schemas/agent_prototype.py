"""Agent Prototype Schemas"""

import enum
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.models.agent_prototype import AgentPrototypeStatus


class AgentPromptType(str, enum.Enum):
    """Prompt types with descriptions."""

    SOUL = "soul"  # 核心灵魂：定义 Agent 的基本性格、价值观和行为准则
    MEMORY = "memory"  # 记忆机制：定义 Agent 如何存储和检索过往经验
    REASONING = "reasoning"  # 推理方式：定义 Agent 的思考链和问题解决模式
    AGENTS = "agents"  # 多智能体：定义多 Agent 协作时的角色分工
    WORKFLOW = "workflow"  # 工作流程：定义任务执行的标准流程和步骤
    COMMUNICATION = "communication"  # 沟通方式：定义 Agent 与用户/其他 Agent 交互规范


PROMPT_TYPES = {pt.value: pt.value for pt in AgentPromptType}


class PromptsField(BaseModel):
    """Prompts field validation."""

    soul: Optional[str] = Field(None, description="核心灵魂")
    memory: Optional[str] = Field(None, description="记忆机制")
    reasoning: Optional[str] = Field(None, description="推理方式")
    agents: Optional[str] = Field(None, description="多智能体")
    workflow: Optional[str] = Field(None, description="工作流程")
    communication: Optional[str] = Field(None, description="沟通方式")

    @field_validator("soul", "memory", "reasoning", "agents", "workflow", "communication", mode="before")
    @classmethod
    def validate_prompt(cls, v):
        if v is None:
            return ""
        return v


class CreateAgentPrototype(BaseModel):
    """Create agent prototype request."""

    name: str = Field(..., min_length=1, max_length=255, description="原型名称")
    description: Optional[str] = Field(None, description="原型描述")
    model: str = Field(..., min_length=1, max_length=100, description="模型")
    temperature: Optional[float] = Field(0.7, ge=0, le=2, description="温度")
    max_tokens: Optional[int] = Field(4096, ge=1, description="最大 tokens")
    prompts: Optional[PromptsField] = Field(default_factory=PromptsField, description="提示词配置")

    model_config = {"from_attributes": True}


class UpdateAgentPrototype(BaseModel):
    """Update agent prototype request."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    model: Optional[str] = Field(None, min_length=1, max_length=100)
    temperature: Optional[float] = Field(None, ge=0, le=2)
    max_tokens: Optional[int] = Field(None, ge=1)
    prompts: Optional[PromptsField] = None
    status: Optional[AgentPrototypeStatus] = None

    model_config = {"from_attributes": True}


class AgentPrototypeResponse(BaseModel):
    """Agent prototype response."""

    id: int
    name: str
    description: Optional[str] = None
    version: str
    model: str
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    prompts: dict
    status: AgentPrototypeStatus
    created_at: datetime
    updated_at: datetime
    created_by: int
    updated_by: Optional[int] = None

    model_config = {"from_attributes": True}


class AgentPrototypeListResponse(BaseModel):
    """Agent prototype list response."""

    items: list[AgentPrototypeResponse]
    total: int
    page: int
    page_size: int


class PublishRequest(BaseModel):
    """Publish prototype request."""

    version: Optional[str] = Field(None, min_length=1, max_length=50, description="版本号（可选，不提供则自动递增）")
    change_summary: Optional[str] = Field(None, max_length=1000, description="变更说明")


class RollbackRequest(BaseModel):
    """Rollback prototype request."""

    version: str = Field(..., min_length=1, max_length=50, description="要回滚到的版本号")


class VersionResponse(BaseModel):
    """Agent prototype version response."""

    id: int
    prototype_id: int
    version: str
    prompts_snapshot: dict
    config_snapshot: dict
    change_summary: Optional[str] = None
    created_at: datetime
    created_by: int

    model_config = {"from_attributes": True}
