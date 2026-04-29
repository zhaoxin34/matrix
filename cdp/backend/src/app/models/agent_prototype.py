"""Agent Prototype database model."""

import enum
from datetime import datetime
from typing import TYPE_CHECKING, TypedDict

from sqlalchemy import JSON, BigInteger, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.agent_prototype_version import AgentPrototypeVersion


class AgentPrototypeStatus(str, enum.Enum):
    draft = "draft"
    enabled = "enabled"
    disabled = "disabled"


class AgentPromptType(str, enum.Enum):
    """Prompt types for agent configuration."""

    SOUL = "soul"  # Core soul: defines agent's personality, values and behavior rules
    MEMORY = "memory"  # Memory mechanism: defines how agent stores and retrieves past experiences
    REASONING = "reasoning"  # Reasoning style: defines agent's thinking chain and problem solving patterns
    AGENTS = "agents"  # Multi-agent: defines role division for multi-agent collaboration
    WORKFLOW = "workflow"  # Workflow: defines standard process and steps for task execution
    COMMUNICATION = "communication"  # Communication style: defines interaction norms with users/other agents


class PromptsField(TypedDict, total=False):
    """Prompts field structure."""

    soul: str
    memory: str
    reasoning: str
    agents: str
    workflow: str
    communication: str


class AgentPrototype(Base):
    """Agent Prototype model."""

    __tablename__ = "agent_prototype"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    version: Mapped[str] = mapped_column(String(50), nullable=False, default="1.0.0")
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    temperature: Mapped[float] = mapped_column(Float, default=0.7)
    max_tokens: Mapped[int] = mapped_column(Integer, default=4096)
    prompts: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    status: Mapped[AgentPrototypeStatus] = mapped_column(
        String(20), default=AgentPrototypeStatus.draft, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    created_by: Mapped[int] = mapped_column(BigInteger, nullable=False)
    updated_by: Mapped[int | None] = mapped_column(BigInteger, nullable=True)

    # Relationships
    versions: Mapped[list["AgentPrototypeVersion"]] = relationship(
        "AgentPrototypeVersion",
        back_populates="prototype",
        order_by="desc(AgentPrototypeVersion.created_at)",
        cascade="all, delete-orphan",
    )