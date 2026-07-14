"""knlg_agent_mapping model: maps a workspace-scoped usage type to a concrete Agent instance.

The (workspace_id, type) pair is unique: each workspace can have at most one
Agent bound to a given type. This is the single source of truth that
downstream consumers (e.g. ai-interview-agent) use to look up "which Agent
should run for type=expert_interview in this workspace?".

Attributes:
    id: Primary key
    workspace_id: Workspace this mapping belongs to (FK -> workspaces.id)
    type: Usage type, e.g. 'expert_interview', 'sales_assistant'
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
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.database import Base


class KnlgAgentMapping(Base):
    """Agent type-to-instance mapping scoped to a workspace."""

    __tablename__ = "knlg_agent_mapping"

    id = Column(Integer, primary_key=True, autoincrement=True)
    workspace_id = Column(
        Integer,
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="所属 Workspace ID",
    )
    type = Column(
        String(32),
        nullable=False,
        comment="用途类型，如 expert_interview / sales_assistant",
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

    __table_args__ = (
        UniqueConstraint(
            "workspace_id",
            "type",
            name="uk_knlg_agent_mapping_workspace_type",
        ),
    )

    def __repr__(self) -> str:
        return (
            f"<KnlgAgentMapping(id={self.id}, "
            f"workspace_id={self.workspace_id}, "
            f"type='{self.type}', "
            f"agent_id={self.agent_id})>"
        )
