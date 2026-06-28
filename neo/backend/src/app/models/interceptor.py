"""Interceptor model definition."""

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, String
from sqlalchemy.dialects.mysql import JSON
from sqlalchemy.orm import relationship
from sqlalchemy.types import TypeDecorator

from app.database import Base


class JSONType(TypeDecorator):
    """Platform-independent JSON type."""

    impl = JSON
    cache_ok = True

    def process_result_value(self, value: Any, dialect: Any) -> Any:
        if value is None:
            return None
        return value


class Interceptor(Base):
    """Interceptor model.

    Interceptor is a rule configured on a specific site to capture events
    and trigger actions.

    Attributes:
        id: Primary key
        workspace_id: Associated workspace ID
        embedded_site_id: Associated site ID
        name: Interceptor name
        event_name: Event name to report
        mode: 'observe' or 'intercept'
        entity_name: Entity being operated on (subject)
        target_entity_name: Target entity (object)
        trigger_type: Type from trigger.type (dom/network)
        trigger: Full trigger configuration
        before_actions: Actions to execute before trigger
        after_actions: Actions to execute after trigger
        page_url_pattern: Page URL pattern to limit scope
        debounce_ms: Debounce time in milliseconds
        status: ENABLED or DISABLED
        created_at: Creation timestamp
        updated_at: Last update timestamp
        created_by: Creator user ID
    """

    __tablename__ = "interceptors"

    id = Column(Integer, primary_key=True, autoincrement=True)
    workspace_id = Column(
        Integer,
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    embedded_site_id = Column(
        Integer,
        ForeignKey("embedded_sites.id", ondelete="SET NULL"),
        nullable=False,
        index=True,
    )
    name = Column(String(255), nullable=False)
    event_name = Column(String(255), nullable=False)
    mode = Column(String(50), nullable=False, default="observe")
    entity_name = Column(String(255), nullable=False)
    target_entity_name = Column(String(255), nullable=True)
    trigger_type = Column(String(50), nullable=True)
    trigger = Column("trigger", JSONType, nullable=False)
    before_actions = Column("before_actions", JSONType, nullable=True, default=list)
    after_actions = Column("after_actions", JSONType, nullable=True, default=list)
    page_url_pattern = Column(String(512), nullable=True)
    debounce_ms = Column(Integer, nullable=False, default=1000)
    status = Column(String(50), nullable=False, default="ENABLED", index=True)
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
    created_by = Column(Integer, nullable=False)

    # Relationships
    workspace = relationship("Workspace", back_populates="interceptors")
    embedded_site = relationship("EmbeddedSite", back_populates="interceptors")

    __table_args__ = (
        Index("idx_int_workspace", "workspace_id"),
        Index("idx_int_site", "embedded_site_id"),
        Index("idx_int_status", "status"),
        Index("idx_int_name", "name"),
    )

    def __repr__(self) -> str:
        return f"<Interceptor(id={self.id}, name={self.name}, status={self.status})>"
