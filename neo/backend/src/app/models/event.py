"""Event model definition."""

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, String
from sqlalchemy.dialects.mysql import JSON
from sqlalchemy.orm import relationship
from sqlalchemy.types import TypeDecorator

from app.database import Base


class JSONType(TypeDecorator):
    """Platform-independent JSON type.

    Uses MySQL's JSON type when available, otherwise falls back to JSON.
    Ensures values are serialized/deserialized properly.
    """

    impl = JSON
    cache_ok = True

    def process_result_value(self, value: Any, dialect: Any) -> Any:
        """Convert database value to Python object."""
        if value is None:
            return None
        return value


class Event(Base):
    """Event model.

    Event represents an action performed by a user or system,
    describing who did what and when.

    Attributes:
        id: Primary key
        name: Event name, e.g., 'lead.assigned'
        entity_name: Associated entity (subject), format: {type}_{id}
        target_entity_name: Target entity (object), e.g., 'user_zhangsan'
        actor: Who triggered the event, e.g., 'user_john'
        timestamp: When the event occurred
        page_url: Page URL (context source)
        session_id: Session ID for grouping events
        event_metadata: Extended data in JSON format
        workspace_id: Associated workspace ID
        created_by: Creator user ID
        created_at: Creation timestamp
        updated_at: Last update timestamp
    """

    __tablename__ = "events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False, index=True)
    entity_name = Column(String(255), nullable=False, index=True)
    target_entity_name = Column(String(255), nullable=True)
    actor = Column(String(255), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    page_url = Column(String(512), nullable=True)
    session_id = Column(String(64), nullable=True, index=True)
    event_metadata = Column("metadata", JSONType, nullable=True)
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
    workspace = relationship("Workspace", back_populates="events")
    embedded_site = relationship("EmbeddedSite", back_populates="events")

    __table_args__ = (
        Index("idx_ev_workspace", "workspace_id"),
        Index("idx_ev_name", "name"),
        Index("idx_ev_entity_name", "entity_name"),
        Index("idx_ev_actor", "actor"),
        Index("idx_ev_timestamp", "timestamp"),
        Index("idx_ev_session_id", "session_id"),
        Index("idx_ev_created_by", "created_by"),
        Index("idx_ev_embedded_site", "embedded_site_id"),
    )

    def __repr__(self) -> str:
        return f"<Event(id={self.id}, name={self.name}, actor={self.actor})>"
