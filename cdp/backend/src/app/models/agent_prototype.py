"""Agent prototype models."""

import enum
from datetime import datetime

from sqlalchemy import JSON, BigInteger, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AgentPrototypeStatus(str, enum.Enum):
    draft = "draft"
    enabled = "enabled"
    disabled = "disabled"


class AgentPrototype(Base):
    """Agent prototype model."""

    __tablename__ = "agent_prototype"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    version: Mapped[str] = mapped_column(String(50), nullable=False, default="1.0.0")
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    temperature: Mapped[float | None] = mapped_column(Float, nullable=True, default=0.7)
    max_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True, default=4096)
    prompts: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    status: Mapped[AgentPrototypeStatus] = mapped_column(
        Enum(AgentPrototypeStatus), nullable=False, default=AgentPrototypeStatus.draft
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)
    updated_by: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=True)

    # Relationships
    versions: Mapped[list["AgentPrototypeVersion"]] = relationship(
        "AgentPrototypeVersion", back_populates="prototype", cascade="all, delete-orphan"
    )


class AgentPrototypeVersion(Base):
    """Agent prototype version model."""

    __tablename__ = "agent_prototype_version"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    prototype_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("agent_prototype.id", ondelete="CASCADE"), nullable=False, index=True
    )
    version: Mapped[str] = mapped_column(String(50), nullable=False)
    prompts_snapshot: Mapped[dict] = mapped_column(JSON, nullable=False)
    config_snapshot: Mapped[dict] = mapped_column(JSON, nullable=False)
    change_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    created_by: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False)

    # Relationships
    prototype: Mapped["AgentPrototype"] = relationship("AgentPrototype", back_populates="versions")  # type: ignore[name-defined]  # noqa: F821
