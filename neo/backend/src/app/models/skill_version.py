"""SkillVersion model definition."""

from datetime import UTC, datetime

from sqlalchemy import (
    JSON,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
)
from sqlalchemy.orm import relationship

from app.database import Base


class SkillVersion(Base):
    """SkillVersion model.

    Stores published version history of a Skill. Each publish creates a new
    version record that locks the file state at that moment.

    Attributes:
        id: Primary key (bigint for scalability)
        skill_id: Associated Skill ID (FK)
        version: Version string (e.g., "1.0.0")
        file_snapshot: JSON locking the file state at publish time
        comment: Release note
        created_at: Publish timestamp
    """

    __tablename__ = "skill_versions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    skill_id = Column(
        Integer,
        ForeignKey("skills.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    version = Column(String(50), nullable=False)
    file_snapshot = Column(JSON, nullable=False)
    comment = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)

    # Relationships
    skill = relationship("Skill", back_populates="versions")

    __table_args__ = (Index("uk_skill_version", "skill_id", "version", unique=True),)

    def __repr__(self) -> str:
        return f"<SkillVersion(id={self.id}, skill_id={self.skill_id}, version={self.version})>"
