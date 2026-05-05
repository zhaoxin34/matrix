"""Event model for analyst data warehouse."""

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Event(Base):
    """Event fact table for analyst warehouse.

    Stores all user behavior events.
    """

    __tablename__ = "dwd_fact_events"

    event_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(String(64), nullable=True, index=True)
    user_id: Mapped[str] = mapped_column(String(64), nullable=True, index=True)
    event_name: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    current_state: Mapped[str] = mapped_column(String(50), nullable=True)
    event_value: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)
    event_time: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    etl_time: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
