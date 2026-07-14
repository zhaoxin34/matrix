"""knlg_agent_mapping model: maps a workspace-scoped usage type to a concrete Agent instance.

The (workspace_id, type) pair is the primary key, enforcing "each type can
be configured at most once per workspace" at the database level. This is
the single source of truth that downstream consumers (e.g. ai-interview-agent)
use to look up "which Agent should run for type=expert_interview in this
workspace?".

`type` values are constrained at the application layer to the
AgentPrototypeType enum (see app.models.agent_prototype.AgentType).

Attributes:
    workspace_id: Workspace this mapping belongs to (FK -> workspaces.id)
    type: Usage type, must match agent_prototype.type values
    agent_id: The Agent instance that handles this type (FK -> agent.id)
    created_at: Record creation timestamp
    updated_at: Last update timestamp
"""

from datetime import UTC, datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    PrimaryKeyConstraint,
    String,
)
from sqlalchemy.orm import relationship

from app.database import Base


class KnlgAgentMapping(Base):
    """Agent type-to-instance mapping scoped to a workspace.

    Composite primary key (workspace_id, type).
    """

    __tablename__ = "knlg_agent_mapping"

    workspace_id = Column(
        Integer,
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        comment="所属 Workspace ID",
    )
    type = Column(
        String(32),
        nullable=False,
        comment="用途类型，与 agent_prototype.type 对齐：site_operation / expert_interview",
    )
    agent_id = Column(
        Integer,
        ForeignKey("agent.id", ondelete="RESTRICT"),
        nullable=False,
        comment="关联 Agent 实例 ID",
    )
    created_at = Column(
        DateTime,
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    # Relationships (read-only helpers)
    workspace = relationship("Workspace", foreign_keys=[workspace_id])
    agent = relationship("Agent", foreign_keys=[agent_id])

    __table_args__ = (PrimaryKeyConstraint("workspace_id", "type", name="pk_knlg_agent_mapping"),)

    def __repr__(self) -> str:
        return f"<KnlgAgentMapping(workspace_id={self.workspace_id}, type='{self.type}', agent_id={self.agent_id})>"
