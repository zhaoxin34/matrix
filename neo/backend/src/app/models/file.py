"""File model definition."""

from datetime import UTC, datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base


class File(Base):
    """File model.

    Stores file content versions. Each update creates a new record to
    preserve history. The path is stored in FileMetadata, not here.

    Attributes:
        id: Primary key (bigint for scalability)
        file_metadata_id: Associated FileMetadata ID (FK)
        version: Version number (incremented on each update)
        content: File content (LONGTEXT in MySQL)
        created_at: Creation timestamp
    """

    __tablename__ = "files"

    id = Column(Integer, primary_key=True, autoincrement=True)
    file_metadata_id = Column(
        Integer,
        ForeignKey("file_metadata.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    version = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)

    # Relationships
    file_metadata_rel = relationship("FileMetadata", back_populates="versions")

    __table_args__ = (Index("uk_file_metadata_version", "file_metadata_id", "version", unique=True),)

    def __repr__(self) -> str:
        return f"<File(id={self.id}, file_metadata_id={self.file_metadata_id}, version={self.version})>"
