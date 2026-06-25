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
        entity_name: Associated entity, format: {type}_{id}
        attributes: Attribute snapshot in JSON format
        captured_at: When the status was captured
        source: Source of the status, e.g., 'crm_page_view'
        session_id: Session ID for grouping
        workspace_id: Associated workspace ID
        created_by: Creator user ID
        created_at: Creation timestamp
        updated_at: Last update timestamp
    """

    __tablename__ = "statuses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    entity_name = Column(String(255), nullable=False, index=True)
    attributes = Column(JSON, nullable=False)
    captured_at = Column(DateTime, nullable=False, index=True)
    source = Column(String(128), nullable=True, index=True)
    session_id = Column(String(64), nullable=True, index=True)
    workspace_id = Column(
        Integer,
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    embedded_site_id = Column(Integer, ForeignKey("embedded_sites.id", ondelete="SET NULL"), nullable=True, index=True)
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
    embedded_site = relationship("EmbeddedSite", back_populates="statuses")

    __table_args__ = (
        Index("idx_st_workspace", "workspace_id"),
        Index("idx_st_entity_name", "entity_name"),
        Index("idx_st_captured_at", "captured_at"),
        Index("idx_st_source", "source"),
        Index("idx_st_session_id", "session_id"),
        Index("idx_st_created_by", "created_by"),
        UniqueConstraint("entity_name", "captured_at", name="uk_st_entity_captured"),
        Index("idx_st_embedded_site", "embedded_site_id"),
    )

    def __repr__(self) -> str:
        return f"<Status(id={self.id}, entity_name={self.entity_name}, captured_at={self.captured_at})>"
