"""Skill model definition."""

from datetime import UTC, datetime
from enum import Enum as PyEnum

from sqlalchemy import (
    JSON,
    Column,
    DateTime,
    Enum,
    Index,
    Integer,
    String,
)
from sqlalchemy.orm import relationship

from app.database import Base


class SkillLevel(str, PyEnum):
    """Skill level enum."""

    PLANNING = "Planning"
    FUNCTIONAL = "Functional"
    ATOMIC = "Atomic"


class SkillStatus(str, PyEnum):
    """Skill status enum."""

    DRAFT = "draft"
    ACTIVE = "active"
    DISABLED = "disabled"


class Skill(Base):
    """Skill model.

    Skill is a reusable capability unit for Agents, consisting of markdown
    documentation and script files with version management.

    Attributes:
        id: Primary key (bigint for scalability)
        code: URL-friendly unique identifier
        name: Display name
        level: Granularity level (Planning/Functional/Atomic)
        tags: Tag array (JSON)
        create_user_id: Creator user ID
        status: Status (draft/active/disabled)
        draft_snapshot: JSON storing current editing state
        deleted_at: Soft delete timestamp
        created_at: Creation timestamp
        updated_at: Last update timestamp
    """

    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False)
    level = Column(Enum(SkillLevel), nullable=False)
    tags = Column(JSON, nullable=True)  # JSON array of strings
    create_user_id = Column(Integer, nullable=True, index=True)
    status = Column(
        Enum(SkillStatus),
        nullable=False,
        default=SkillStatus.DRAFT,
    )
    draft_snapshot = Column(JSON, nullable=True)  # [{"file_metadata_id": 1, "file_id": 101}, ...]
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    # Relationships
    versions = relationship(
        "SkillVersion",
        back_populates="skill",
        cascade="all, delete-orphan",
        order_by="desc(SkillVersion.created_at)",
    )
    files = relationship(
        "FileMetadata",
        back_populates="skill",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("idx_skill_status", "status"),
        Index("idx_skill_level", "level"),
        Index("idx_skill_deleted_at", "deleted_at"),
    )

    def __repr__(self) -> str:
        return f"<Skill(id={self.id}, code={self.code}, name={self.name})>"
