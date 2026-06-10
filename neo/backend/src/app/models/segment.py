"""Segment model definition."""

from datetime import UTC, datetime

from sqlalchemy import (
    BigInteger,
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


class Segment(Base):
    """Segment model.

    A Segment represents a single rrweb recording file (every 10 minutes).

    Attributes:
        id: Primary key
        uid: UUID for external reference
        recording_id: Associated recording (FK)
        sequence: Sequence number within the recording (starts from 1)
        start_time: Segment start timestamp
        end_time: Segment end timestamp
        page_urls: JSON array of page URLs visited during this segment
        storage_key: S3 storage path
        size: File size in bytes
        created_at: Creation timestamp
    """

    __tablename__ = "segment"

    id = Column(Integer, primary_key=True, autoincrement=True)
    uid = Column(String(36), unique=True, nullable=False, index=True)
    recording_id = Column(
        Integer,
        ForeignKey("recording.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sequence = Column(Integer, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    page_urls = Column(Text, nullable=False, default="[]")  # JSON stored as text
    storage_key = Column(String(512), nullable=False)
    size = Column(BigInteger, nullable=False, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)

    # Relationships
    recording = relationship(
        "Recording",
        back_populates="segments",
    )

    __table_args__ = (Index("uk_segment_recording_sequence", "recording_id", "sequence", unique=True),)

    def __repr__(self) -> str:
        return f"<Segment(id={self.id}, uid={self.uid}, recording_id={self.recording_id}, sequence={self.sequence})>"
