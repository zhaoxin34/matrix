"""RequestLog model definition."""

from datetime import UTC, datetime
from enum import Enum as PyEnum

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    SmallInteger,
    String,
    Text,
)
from sqlalchemy.dialects.mysql import JSON
from sqlalchemy.orm import relationship

from app.database import Base


class RequestLogEvent(str, PyEnum):
    """Request log event type."""

    START = "start"
    COMPLETE = "complete"
    ERROR = "error"


class RequestLogType(str, PyEnum):
    """Request type."""

    FETCH = "fetch"
    XHR = "xhr"


class RequestLog(Base):
    """RequestLog model.

    Stores XHR/fetch request logs intercepted by the Chrome extension.

    Attributes:
        id: Primary key
        request_id: Unique request ID from Chrome extension
        workspace_id: Associated workspace ID
        embedded_site_id: Associated embedded site ID (NULL if no match)
        event: Event type (start/complete/error)
        type: Request type (fetch/xhr)
        method: HTTP method
        url: Full request URL
        request_headers: Request headers (JSON)
        request_body: Request body (stringified)
        status: Response status code
        status_text: Response status text
        response_headers: Response headers (JSON)
        response_body: Response body (stringified)
        duration_ms: Request duration in milliseconds
        error: Error message
        session_id: Extension session ID
        tab_id: Chrome Tab ID
        created_at: Creation timestamp
    """

    __tablename__ = "request_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    request_id = Column(String(32), unique=True, nullable=False, index=True)
    workspace_id = Column(
        Integer,
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    embedded_site_id = Column(
        Integer,
        ForeignKey("embedded_sites.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    event = Column(
        Enum(RequestLogEvent, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=RequestLogEvent.START,
    )
    type = Column(
        Enum(RequestLogType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    method = Column(String(10), nullable=False)
    url = Column(String(2048), nullable=False)
    request_headers = Column("request_headers", JSON, nullable=True)
    request_body = Column("request_body", Text, nullable=True)
    status = Column(SmallInteger, nullable=True)
    status_text = Column(String(50), nullable=True)
    response_headers = Column("response_headers", JSON, nullable=True)
    response_body = Column("response_body", Text, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    error = Column(Text, nullable=True)
    session_id = Column(String(64), nullable=True, index=True)
    tab_id = Column(String(32), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)

    # Relationships
    workspace = relationship("Workspace", back_populates="request_logs")
    embedded_site = relationship("EmbeddedSite", back_populates="request_logs")

    __table_args__ = (
        Index("idx_rl_workspace", "workspace_id"),
        Index("idx_rl_embedded_site", "embedded_site_id"),
        Index("idx_rl_request_id", "request_id"),
        Index("idx_rl_session_id", "session_id"),
        Index("idx_rl_created_at", "created_at"),
        Index("idx_rl_workspace_created", "workspace_id", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<RequestLog(id={self.id}, request_id={self.request_id}, event={self.event})>"
