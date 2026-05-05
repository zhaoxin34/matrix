"""Order model for analyst data warehouse."""

from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Order(Base):
    """Order fact table for analyst warehouse.

    Stores order records when user completes payment.
    """

    __tablename__ = "dwd_fact_orders"

    order_detail_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    original_order_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    session_id: Mapped[str] = mapped_column(String(64), nullable=True, index=True)
    order_status: Mapped[str] = mapped_column(String(50), default="paid")
    is_paid: Mapped[int] = mapped_column(Integer, default=1)
    is_completed: Mapped[int] = mapped_column(Integer, default=0)
    total_amount: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    paid_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    etl_time: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Order items stored as JSON for simplicity
    items: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON array of items
