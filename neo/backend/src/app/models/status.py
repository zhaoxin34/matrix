"""Status model definition."""

from datetime import UTC, datetime

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class Status(Base):
    """Status model.

    Status represents a snapshot of entity attributes at a specific time.

    Attributes:
        id: Primary key (bigint for scalability)
        entity_type: Entity type, e.g., 'lead', 'user'
        entity_id: Entity ID, unique identifier in business system
        attributes: Attribute snapshot in JSON format
        stat_at: Statistics time
        source: Source of the status, e.g., 'crm_page_view'
        session_id: Session ID for grouping
        workspace_id: Associated workspace ID
        created_by: Creator user ID
        created_at: Creation timestamp
        updated_at: Last update timestamp
    """

    __tablename__ = "statuses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    entity_type = Column(String(128), nullable=False, index=True)
    entity_id = Column(String(255), nullable=False, index=True)
    attributes = Column(JSON, nullable=False)
    stat_at = Column(DateTime, nullable=False, index=True)
    source = Column(String(128), nullable=True, index=True)
    session_id = Column(String(64), nullable=True, index=True)
    workspace_id = Column(
        Integer,
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_by = Column(Integer, nullable=False, index=True)
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

    # Relationships
    workspace = relationship("Workspace", back_populates="statuses")

    __table_args__ = (
        Index("idx_st_workspace", "workspace_id"),
        Index("idx_st_entity_type", "entity_type"),
        Index("idx_st_entity_id", "entity_id"),
        Index("idx_st_stat_at", "stat_at"),
        Index("idx_st_source", "source"),
        Index("idx_st_session_id", "session_id"),
        Index("idx_st_created_by", "created_by"),
        UniqueConstraint("entity_type", "entity_id", "stat_at", name="uk_st_entity_stat_at"),
    )

    def __repr__(self) -> str:
        return f"<Status(id={self.id}, entity_type={self.entity_type}, entity_id={self.entity_id}, stat_at={self.stat_at})>"
