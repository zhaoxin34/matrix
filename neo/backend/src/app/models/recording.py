"""Recording model definition."""

from datetime import UTC, datetime
from enum import Enum as PyEnum

from sqlalchemy import (
    BigInteger,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base


class RecordingStatus(str, PyEnum):
    """Recording status enum."""

    RECORDING = "recording"
    COMPLETED = "completed"
    FAILED = "failed"


class RecordingSource(str, PyEnum):
    """Recording source enum."""

    AGENT = "agent"
    UPLOAD = "upload"


class Recording(Base):
    """Recording model.

    A Recording represents a complete video recording composed of multiple Segments.

    Attributes:
        id: Primary key
        uid: UUID for external reference
        workspace_id: Associated workspace (FK)
        name: Recording name
        tags: JSON array of tags
        status: recording/completed/failed
        enter_url: Entry URL when recording started
        exit_url: Exit URL when recording stopped
        total_duration: Total duration in seconds
        total_size: Total size in bytes
        source: agent/upload
        created_by: Creator user ID (FK)
        created_at: Creation timestamp
        updated_at: Last update timestamp
    """

    __tablename__ = "recording"

    id = Column(Integer, primary_key=True, autoincrement=True)
    uid = Column(String(36), unique=True, nullable=False, index=True)
    workspace_id = Column(
        Integer,
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = Column(String(128), nullable=False)
    tags = Column(Text, nullable=False, default="[]")  # JSON stored as text
    status = Column(
        Enum(RecordingStatus),
        nullable=False,
        default=RecordingStatus.RECORDING,
    )
    enter_url = Column(String(2048), nullable=True)
    exit_url = Column(String(2048), nullable=True)
    total_duration = Column(Integer, nullable=False, default=0)
    total_size = Column(BigInteger, nullable=False, default=0)
    source = Column(
        Enum(RecordingSource),
        nullable=False,
        default=RecordingSource.AGENT,
    )
    created_by = Column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    # Relationships
    workspace = relationship(
        "Workspace",
        foreign_keys=[workspace_id],
    )
    creator = relationship(
        "User",
        foreign_keys=[created_by],
    )
    segments = relationship(
        "Segment",
        back_populates="recording",
        cascade="all, delete-orphan",
        order_by="Segment.sequence",
    )

    __table_args__ = (
        Index("idx_recording_workspace_status", "workspace_id", "status"),
        Index("idx_recording_created_at", "created_at"),
        Index("idx_recording_name", "name"),
    )

    def __repr__(self) -> str:
        return f"<Recording(id={self.id}, uid={self.uid}, name={self.name})>"
