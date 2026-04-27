"""Skill database model."""

import enum
from datetime import datetime

from sqlalchemy import JSON, BigInteger, DateTime, Enum, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class SkillLevel(str, enum.Enum):
    Planning = "Planning"
    Functional = "Functional"
    Atomic = "Atomic"


class SkillStatus(str, enum.Enum):
    draft = "draft"
    active = "active"
    disabled = "disabled"


class Skill(Base):
    """Skill model."""

    __tablename__ = "skill"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    level: Mapped[SkillLevel] = mapped_column(Enum(SkillLevel), nullable=False)
    tags: Mapped[list | None] = mapped_column(JSON, nullable=True)
    author: Mapped[str | None] = mapped_column(String(50), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[SkillStatus] = mapped_column(Enum(SkillStatus), default=SkillStatus.draft, nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
