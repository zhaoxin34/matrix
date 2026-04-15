"""Category schema definitions."""

from datetime import datetime

from app.schemas.common import BaseCreate, BaseResponse, BaseSchema, BaseUpdate


class CategoryBase(BaseSchema):
    """Category base schema."""

    name: str
    description: str | None = None


class CategoryCreate(BaseCreate):
    """Category create schema."""

    name: str
    description: str | None = None


class CategoryUpdate(BaseUpdate):
    """Category update schema."""

    name: str | None = None
    description: str | None = None


class CategoryResponse(CategoryBase, BaseResponse):
    """Category response schema."""

    id: int
    created_at: datetime
    updated_at: datetime
