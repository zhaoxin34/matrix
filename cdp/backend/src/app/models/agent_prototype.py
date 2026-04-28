"""Agent Prototype database model."""

import enum
from datetime import datetime

from sqlalchemy import JSON, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


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


class AgentPrototype(Base):
    """Agent prototype model."""

    __tablename__ = "agent_prototype"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    version: Mapped[str] = mapped_column(String(50), nullable=False, default="1.0.0")
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    temperature: Mapped[float] = mapped_column(Float, nullable=False, default=0.7)
    max_tokens: Mapped[int] = mapped_column(Integer, nullable=False, default=4096)
    prompt_selections: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    status: Mapped[AgentPrototypeStatus] = mapped_column(
        Enum(AgentPrototypeStatus), nullable=False, default=AgentPrototypeStatus.draft
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    updated_by: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    prompts: Mapped[list["AgentPrototypePrompt"]] = relationship(
        "AgentPrototypePrompt", back_populates="prototype", cascade="all, delete-orphan"
    )
    versions: Mapped[list["AgentPrototypeVersion"]] = relationship(
        "AgentPrototypeVersion", back_populates="prototype", cascade="all, delete-orphan"
    )


class AgentPrototypePrompt(Base):
    """Agent prototype prompt model."""

    __tablename__ = "agent_prototype_prompt"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    prototype_id: Mapped[str] = mapped_column(String(36), ForeignKey("agent_prototype.id"), nullable=False, index=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    version: Mapped[str] = mapped_column(String(50), nullable=False, default="1.0.0")
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    updated_by: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    prototype: Mapped["AgentPrototype"] = relationship("AgentPrototype", back_populates="prompts")  # type: ignore[name-defined]  # noqa: F821


class AgentPrototypeVersion(Base):
    """Agent prototype version history model."""

    __tablename__ = "agent_prototype_version"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    prototype_id: Mapped[str] = mapped_column(String(36), ForeignKey("agent_prototype.id"), nullable=False, index=True)
    version: Mapped[str] = mapped_column(String(50), nullable=False)
    config_snapshot: Mapped[dict] = mapped_column(JSON, nullable=False)
    prompt_snapshot: Mapped[dict] = mapped_column(JSON, nullable=False)
    change_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    created_by: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    prototype: Mapped["AgentPrototype"] = relationship("AgentPrototype", back_populates="versions")  # type: ignore[name-defined]  # noqa: F821
