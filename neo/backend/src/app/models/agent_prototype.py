"""Agent Prototype model definition."""

from datetime import UTC, datetime
from enum import Enum as PyEnum

from sqlalchemy import (
    JSON,
    BigInteger,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
)
from sqlalchemy.orm import relationship

from app.database import Base


class AgentStatus(str, PyEnum):
    """Agent prototype status enum."""

    DRAFT = "draft"
    ENABLED = "enabled"
    DISABLED = "disabled"


class AgentType(str, PyEnum):
    """Agent prototype type enum.

    Attributes:
        SITE_OPERATION: 站点操作型 Agent（如 Browser Agent）
        EXPERT_INTERVIEW: 专家访谈型 Agent（如 AI 访谈助手）
    """

    SITE_OPERATION = "site_operation"
    EXPERT_INTERVIEW = "expert_interview"


class AgentPrototype(Base):
    """Agent Prototype model.

    Agent Prototype is a template for creating Agents. It contains prompts
    configuration and version management.

    Attributes:
        id: Primary key (bigint for scalability)
        code: URL-friendly unique identifier
        name: Display name
        description: Optional description
        version: Current published version (e.g., "1.0.0"), NULL if draft
        model: Model configuration string (legacy, kept for backward compatibility)
        provider_id: Reference to ModelProvider (new)
        model_id: Model identifier from ModelConfig (new)
        model_config: Runtime model configuration JSON (new)
        prompts: Prompts configuration (JSON)
        config: Runtime configuration (JSON)
        status: Status (draft/enabled/disabled)
        created_by: Creator user ID
        created_at: Creation timestamp
        updated_at: Last update timestamp
    """

    __tablename__ = "agent_prototype"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(32), unique=True, nullable=False, index=True)
    name = Column(String(64), nullable=False)
    description = Column(String(500), nullable=True)
    version = Column(String(32), nullable=True)  # NULL when status is draft
    model = Column(String(64), nullable=False, default="gpt-4")
    prompts = Column(JSON, nullable=False, default=dict)
    config = Column(JSON, nullable=False, default=dict)
    status = Column(
        Enum(AgentStatus),
        nullable=False,
        default=AgentStatus.DRAFT,
    )
    created_by = Column(BigInteger, nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    # Model Provider reference (new fields)
    provider_id = Column(
        BigInteger,
        ForeignKey("agent_model_provider.id", ondelete="SET NULL"),
        nullable=True,
    )
    model_id = Column(String(64), nullable=True)
    llm_config = Column("model_config", JSON, nullable=True)  # DB column is model_config
    type = Column(
        Enum(AgentType),
        nullable=False,
        default=AgentType.SITE_OPERATION,
        index=True,
    )

    # Relationships
    provider = relationship("ModelProvider", foreign_keys=[provider_id])
    versions = relationship(
        "AgentPrototypeVersion",
        back_populates="prototype",
        cascade="all, delete-orphan",
        order_by="desc(AgentPrototypeVersion.created_at)",
    )

    __table_args__ = (
        Index("idx_agent_pt_status", "status"),
        Index("idx_agent_pt_created_by", "created_by"),
    )

    def __repr__(self) -> str:
        return f"<AgentPrototype(id={self.id}, code={self.code}, name={self.name}, status={self.status})>"
