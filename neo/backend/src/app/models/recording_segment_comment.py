"""RecordingSegmentComment model definition."""

from datetime import UTC, datetime

from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base


class RecordingSegmentComment(Base):
    """RecordingSegmentComment model.

    A comment attached to a specific time range of a recording segment.
    Time fields (show_time / hide_time) are expressed as seconds offset
    from the segment's start, with millisecond precision.

    Attributes:
        id: Primary key
        uid: UUID for external reference
        recording_id: Associated recording (FK, CASCADE on delete)
        segment_id: Associated segment (FK, CASCADE on delete)
        show_time: Start of display range (seconds, relative to segment start)
        hide_time: End of display range (seconds, relative to segment start)
        abstract: Short summary (≤255 chars, required)
        content: Detailed description (optional)
        creator_id: Creator user ID (FK, RESTRICT on delete)
        created_at: Creation timestamp
        updated_at: Last update timestamp
    """

    __tablename__ = "recording_segment_comment"

    id = Column(Integer, primary_key=True, autoincrement=True)
    uid = Column(String(36), unique=True, nullable=False, index=True)
    recording_id = Column(
        Integer,
        ForeignKey("recording.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    segment_id = Column(
        Integer,
        ForeignKey("segment.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    show_time = Column(Numeric(10, 3), nullable=False)
    hide_time = Column(Numeric(10, 3), nullable=False)
    abstract = Column(String(255), nullable=False)
    content = Column(Text, nullable=True)
    creator_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    # Relationships
    recording = relationship("Recording", foreign_keys=[recording_id])
    segment = relationship("Segment", foreign_keys=[segment_id])
    creator = relationship("User", foreign_keys=[creator_id])

    __table_args__ = (
        Index("idx_recording_segment_comment_seg", "segment_id", "show_time"),
        Index("idx_recording_segment_comment_rec", "recording_id"),
        Index("idx_recording_segment_comment_creator", "creator_id"),
        CheckConstraint(
            "hide_time > show_time",
            name="chk_recording_segment_comment_time_range",
        ),
        CheckConstraint(
            "show_time >= 0",
            name="chk_recording_segment_comment_show_time_non_negative",
        ),
    )

    def __repr__(self) -> str:
        return (
            f"<RecordingSegmentComment(id={self.id}, uid={self.uid}, "
            f"segment_id={self.segment_id}, show_time={self.show_time}, "
            f"hide_time={self.hide_time})>"
        )
