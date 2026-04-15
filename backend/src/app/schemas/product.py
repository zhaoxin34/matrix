"""Product schema definitions."""

from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import BaseCreate, BaseResponse, BaseSchema, BaseUpdate


class ProductBase(BaseSchema):
    """Product base schema."""

    name: str
    description: str | None = None
    price: float
    stock: int = 0
    category_id: int | None = None


class ProductCreate(BaseCreate):
    """Product create schema."""

    name: str
    description: str | None = None
    price: float
    stock: int = 0
    category_id: int | None = None


class ProductUpdate(BaseUpdate):
    """Product update schema."""

    name: str | None = None
    description: str | None = None
    price: float | None = None
    stock: int | None = None
    category_id: int | None = None


class ProductResponse(ProductBase, BaseResponse):
    """Product response schema."""

    id: int
    created_at: datetime
    updated_at: datetime


class ProductListResponse(BaseModel):
    """Product list response with pagination."""

    items: list[ProductResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
