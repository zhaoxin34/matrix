"""Category schema definitions."""


from pydantic import BaseModel, ConfigDict


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


class CategoryUpdate(BaseModel):
    """Category update schema."""

    name: str | None = None
    description: str | None = None
    parent_id: int | None = None
    level: int | None = None
    sort_order: int | None = None


class CategoryResponse(BaseModel):
    """Category response schema."""

    id: int
    name: str
    description: str | None = None
    parent_id: int | None = None
    level: int
    sort_order: int

    model_config = ConfigDict(from_attributes=True)


class CategoryTreeResponse(BaseModel):
    """Category tree response with children."""

    id: int
    name: str
    level: int
    children: list[CategoryResponse] = []

    model_config = ConfigDict(from_attributes=True)
