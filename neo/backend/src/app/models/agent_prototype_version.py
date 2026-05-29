"""Agent Prototype Version model definition."""

from datetime import UTC, datetime

from sqlalchemy import (
    JSON,
    Boolean,
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


class AgentPrototypeVersion(Base):
    """Agent Prototype Version model.

    Stores historical snapshots of Agent Prototype for version control
    and rollback capabilities.

    Attributes:
        id: Primary key (bigint for scalability)
        agent_prototype_id: Reference to parent Agent Prototype
        version: Version number (e.g., "1.0.0")
        prompts_snapshot: Complete prompts configuration at publish time
        config_snapshot: Complete config at publish time
        change_summary: Description of changes in this version
        is_rollback: Flag indicating if this version was created by rollback
        created_by: User who created this version
        created_at: Version creation timestamp
    """

    __tablename__ = "agent_prototype_version"

    id = Column(Integer, primary_key=True, autoincrement=True)
    agent_prototype_id = Column(
        Integer,
        ForeignKey("agent_prototype.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    version = Column(String(32), nullable=False)
    prompts_snapshot = Column(JSON, nullable=False)
    config_snapshot = Column(JSON, nullable=False)
    change_summary = Column(Text, nullable=True)
    is_rollback = Column(Boolean, nullable=False, default=False)
    created_by = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)

    # Relationships
    prototype = relationship(
        "AgentPrototype",
        back_populates="versions",
    )

    __table_args__ = (
        Index("idx_agent_version_agent", "agent_prototype_id"),
        Index("idx_agent_version_created", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<AgentPrototypeVersion(id={self.id}, prototype_id={self.agent_prototype_id}, version={self.version})>"
