"""Product schema definitions."""

import json
from datetime import datetime
from typing import Any

from pydantic import BaseModel


class ProductBase(BaseModel):
    """Product base schema."""

    name: str
    description: str | None = None
    price: float
    stock: int = 0
    category_id: int | None = None


class ProductCreate(BaseModel):
    """Product create schema."""

    name: str
    description: str | None = None
    price: float
    stock: int = 0
    category_id: int | None = None
    brand: str | None = None
    images: list[str] = []
    original_price: float | None = None
    sku_variants: list[dict[str, Any]] = []
    specifications: dict[str, str] = {}


class ProductUpdate(BaseModel):
    """Product update schema."""

    name: str | None = None
    description: str | None = None
    price: float | None = None
    stock: int | None = None
    category_id: int | None = None


class ProductResponse(BaseModel):
    """Product response schema."""

    id: int
    name: str
    description: str | None = None
    price: float
    original_price: float | None = None
    stock: int
    brand: str | None = None
    images: list[str] = []
    sales_count: int = 0
    sku_variants: list[dict[str, Any]] = []
    specifications: dict[str, str] = {}
    category_id: int | None = None
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_with_images(cls, product) -> "ProductResponse":
        """Create from ORM model with JSON image parsing."""
        images = []
        if product.images:
            try:
                images = json.loads(product.images)
            except (json.JSONDecodeError, TypeError):
                images = []

        sku_variants = []
        if product.sku_variants:
            try:
                sku_variants = json.loads(product.sku_variants)
            except (json.JSONDecodeError, TypeError):
                sku_variants = []

        specifications = {}
        if product.specifications:
            try:
                specifications = json.loads(product.specifications)
            except (json.JSONDecodeError, TypeError):
                specifications = {}

        return cls(
            id=product.id,
            name=product.name,
            description=product.description,
            price=float(product.price),
            original_price=float(product.original_price) if product.original_price else None,
            stock=product.stock,
            brand=product.brand,
            images=images,
            sales_count=product.sales_count,
            sku_variants=sku_variants,
            specifications=specifications,
            category_id=product.category_id,
            is_active=product.is_active,
            created_at=product.created_at,
            updated_at=product.updated_at,
        )


class ProductListResponse(BaseModel):
    """Product list response with pagination."""

    items: list[ProductResponse]
    total: int
    page: int
    limit: int
    pages: int


class CategoryBase(BaseModel):
    """Base category schema."""

    name: str
    description: str | None = None


class CategoryCreate(BaseModel):
    """Category create schema."""

    name: str
    description: str | None = None
    parent_id: int | None = None
    level: int = 1
    sort_order: int = 0


class CategoryResponse(CategoryBase):
    """Category response schema."""

    id: int
    parent_id: int | None = None
    level: int
    sort_order: int

    class Config:
        from_attributes = True


class CategoryTreeResponse(BaseModel):
    """Category tree with children."""

    id: int
    name: str
    level: int
    children: list[CategoryResponse] = []

    class Config:
        from_attributes = True


class SearchSuggestion(BaseModel):
    """Search autocomplete suggestion."""

    id: int
    name: str
