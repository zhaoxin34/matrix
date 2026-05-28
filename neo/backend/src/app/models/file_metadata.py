"""FileMetadata model definition."""

from datetime import UTC, datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
)
from sqlalchemy.orm import relationship

from app.database import Base


class FileMetadata(Base):
    """FileMetadata model.

    Stores metadata for files within a Skill. The directory structure is
    implicitly expressed through the path field (e.g., "scripts/file1.sh").

    Attributes:
        id: Primary key (bigint for scalability)
        skill_id: Associated Skill ID (FK)
        name: File name (e.g., "file1.sh")
        path: File path (e.g., "scripts/file1.sh")
        size: File size in bytes
        created_at: Creation timestamp
        updated_at: Last update timestamp
    """

    __tablename__ = "file_metadata"

    id = Column(Integer, primary_key=True, autoincrement=True)
    skill_id = Column(
        Integer,
        ForeignKey("skills.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = Column(String(255), nullable=False)
    path = Column(String(512), unique=True, nullable=False, index=True)
    size = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    # Relationships
    skill = relationship("Skill", back_populates="files")
    versions = relationship(
        "File",
        back_populates="file_metadata_rel",
        cascade="all, delete-orphan",
        order_by="desc(File.version)",
    )

    __table_args__ = (Index("idx_file_name", "name"),)

    def __repr__(self) -> str:
        return f"<FileMetadata(id={self.id}, name={self.name}, path={self.path})>"
