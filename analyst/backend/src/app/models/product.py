"""Product model for analyst data warehouse."""

from datetime import datetime

from sqlalchemy import DateTime, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Product(Base):
    """Product dimension table for analyst warehouse.

    Stores product master data loaded from dim_products.
    """

    __tablename__ = "dim_products"

    product_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    original_id: Mapped[int] = mapped_column(Integer, nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    original_price: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    brand: Mapped[str | None] = mapped_column(String(100), nullable=True)
    category_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(Integer, default=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    etl_time: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
