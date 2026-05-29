"""Agent model definition."""

from datetime import UTC, datetime
from enum import Enum as PyEnum

from sqlalchemy import (
    JSON,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base


class AgentStatus(str, PyEnum):
    """Agent status enum."""

    ENABLED = "enabled"
    DISABLED = "disabled"
    DELETED = "deleted"


class Agent(Base):
    """Agent model.

    Agent is a runnable instance created from an Agent Prototype within a Workspace.
    It contains the actual configuration and can be scheduled for tasks.

    Attributes:
        id: Primary key (BIGINT for scalability)
        name: Agent name identifier (unique within workspace)
        description: Optional description
        prototype_id: Reference to Agent Prototype ID
        prototype_version: Locked Prototype version at creation time
        workspace_id: Associated Workspace ID
        model: Model configuration (can override Prototype)
        skills: Enabled skills list (JSON array of {id, version})
        config: Runtime configuration (JSON)
        status: Agent status (enabled/disabled/deleted)
        created_by: Creator user ID
        created_at: Creation timestamp
        updated_at: Last update timestamp
    """

    __tablename__ = "agent"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(32), nullable=False, index=True)
    description = Column(Text, nullable=True)
    prototype_id = Column(
        Integer,
        ForeignKey("agent_prototype.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    prototype_version = Column(String(32), nullable=False)
    workspace_id = Column(
        Integer,
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    model = Column(String(64), nullable=False)
    skills = Column(JSON, nullable=False, default=list)
    config = Column(JSON, nullable=False, default=dict)
    status = Column(
        String(20),
        nullable=False,
        default=AgentStatus.ENABLED.value,
        index=True,
    )
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    # Relationships
    prototype = relationship(
        "AgentPrototype",
        foreign_keys=[prototype_id],
    )
    workspace = relationship(
        "Workspace",
        foreign_keys=[workspace_id],
    )
    creator = relationship(
        "User",
        foreign_keys=[created_by],
    )

    __table_args__ = (
        # Unique constraint: name must be unique within workspace
        Index("uk_agent_workspace_name", "workspace_id", "name", unique=True),
        Index("idx_agent_workspace_status", "workspace_id", "status"),
    )

    def __repr__(self) -> str:
        return f"<Agent(id={self.id}, name={self.name}, workspace_id={self.workspace_id}, status={self.status})>"
