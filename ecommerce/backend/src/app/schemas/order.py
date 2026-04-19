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

    status: str = "paid"


class OrderCreate(BaseCreate):
    """Order create schema."""

    # For logged-in users selecting a saved address
    address_id: int | None = None
    # Inline address fields (for guests or logged-in users entering new address)
    recipient_name: str | None = None
    phone: str | None = None
    province: str | None = None
    city: str | None = None
    district: str | None = None
    street: str | None = None


class OrderUpdate(BaseUpdate):
    """Order update schema."""

    status: str | None = None


class OrderResponse(OrderBase, BaseResponse):
    """Order response schema."""

    id: int
    user_id: int
    session_id: str | None = None
    address_id: int | None = None
    total_amount: float
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemResponse] = []
    # Inline address for response
    recipient_name: str | None = None
    phone: str | None = None
    province: str | None = None
    city: str | None = None
    district: str | None = None
    street: str | None = None
