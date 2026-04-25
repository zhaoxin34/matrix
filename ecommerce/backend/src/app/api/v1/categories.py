"""Categories API routes."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.category import Category
from app.schemas.category import (
    CategoryCreate,
    CategoryResponse,
    CategoryTreeResponse,
    CategoryUpdate,
)
from app.services.product_service import ProductService

router = APIRouter()


@router.get("", response_model=list[CategoryTreeResponse])
def list_category_tree(db: Session = Depends(get_db)) -> list[CategoryTreeResponse]:
    """Get category tree with L1 and L2 categories."""
    service = ProductService(db)
    return service.get_category_tree()


@router.get("/flat", response_model=list[CategoryResponse])
def list_categories_flat(
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[CategoryResponse]:
    """List all categories flat with pagination."""
    skip = (page - 1) * page_size
    categories = db.query(Category).order_by(Category.level, Category.sort_order).offset(skip).limit(page_size).all()
    return categories


@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(category_id: int, db: Session = Depends(get_db)) -> CategoryResponse:
    """Get category by ID."""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        from app.core.exceptions import NotFoundException

        raise NotFoundException("Category not found")
    return category


@router.post("", response_model=CategoryResponse)
def create_category(category_data: CategoryCreate, db: Session = Depends(get_db)) -> CategoryResponse:
    """Create a new category."""
    category = Category(
        name=category_data.name,
        description=category_data.description,
        parent_id=category_data.parent_id,
        level=category_data.level,
        sort_order=category_data.sort_order,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(category_id: int, category_data: CategoryUpdate, db: Session = Depends(get_db)) -> CategoryResponse:
    """Update category by ID."""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        from app.core.exceptions import NotFoundException

        raise NotFoundException("Category not found")

    for field, value in category_data.model_dump(exclude_unset=True).items():
        setattr(category, field, value)

    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)) -> dict:
    """Delete category by ID."""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        from app.core.exceptions import NotFoundException

        raise NotFoundException("Category not found")

    db.delete(category)
    db.commit()
    return {"message": "Category deleted successfully"}
