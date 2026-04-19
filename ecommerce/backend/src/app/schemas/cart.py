"""Cart schema definitions."""

from datetime import datetime

from app.schemas.common import BaseCreate, BaseResponse, BaseSchema, BaseUpdate
from app.schemas.product import ProductResponse


class CartItemBase(BaseSchema):
    """Cart item base schema."""

    product_id: int
    quantity: int = 1
    sku_variant: dict | None = None


class CartItemCreate(BaseCreate):
    """Cart item create schema."""

    product_id: int
    quantity: int = 1
    sku_variant: dict | None = None


class CartItemUpdate(BaseUpdate):
    """Cart item update schema."""

    quantity: int | None = None
    sku_variant: dict | None = None


class CartItemResponse(CartItemBase, BaseResponse):
    """Cart item response schema."""

    id: int
    user_id: int | None = None
    session_id: str | None = None
    created_at: datetime
    product: ProductResponse | None = None


class CartResponse(BaseSchema):
    """Cart response schema."""

    items: list[CartItemResponse]
    total: float
