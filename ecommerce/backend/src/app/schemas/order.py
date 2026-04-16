"""Order schema definitions."""

from datetime import datetime

from app.schemas.common import BaseCreate, BaseResponse, BaseSchema, BaseUpdate


class OrderItemBase(BaseSchema):
    """Order item base schema."""

    product_id: int
    quantity: int
    unit_price: float


class OrderItemCreate(BaseCreate):
    """Order item create schema."""

    product_id: int
    quantity: int


class OrderItemResponse(OrderItemBase, BaseResponse):
    """Order item response schema."""

    id: int


class OrderBase(BaseSchema):
    """Order base schema."""

    status: str = "pending"


class OrderCreate(BaseCreate):
    """Order create schema."""

    items: list[OrderItemCreate]
    address_id: int


class OrderUpdate(BaseUpdate):
    """Order update schema."""

    status: str | None = None


class OrderResponse(OrderBase, BaseResponse):
    """Order response schema."""

    id: int
    user_id: int
    total_amount: float
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemResponse] = []
