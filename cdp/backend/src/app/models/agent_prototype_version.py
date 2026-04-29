"""Agent Prototype Version database model."""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, DateTime, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.agent_prototype import AgentPrototype


class AgentPrototypeVersion(Base):
    """Agent Prototype Version model for version history."""

    __tablename__ = "agent_prototype_version"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    prototype_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("agent_prototype.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    version: Mapped[str] = mapped_column(String(50), nullable=False)
    prompts_snapshot: Mapped[dict] = mapped_column(JSON, nullable=False)
    config_snapshot: Mapped[dict] = mapped_column(JSON, nullable=False)
    change_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    created_by: Mapped[int] = mapped_column(BigInteger, nullable=False)

    # Relationships
    prototype: Mapped["AgentPrototype"] = relationship(
        "AgentPrototype", back_populates="versions"
    )