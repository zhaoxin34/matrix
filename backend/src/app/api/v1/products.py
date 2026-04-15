"""Products API routes."""

import math

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.product import (
    ProductCreate,
    ProductListResponse,
    ProductResponse,
    ProductUpdate,
)
from app.services.product_service import ProductService

router = APIRouter()


@router.get("", response_model=ProductListResponse)
def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category_id: int | None = None,
    db: Session = Depends(get_db),
) -> ProductListResponse:
    """List all products with pagination."""
    service = ProductService(db)
    skip = (page - 1) * page_size
    items = service.get_multi(skip=skip, limit=page_size, category_id=category_id)
    total = service.count(category_id=category_id)
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    return ProductListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)) -> ProductResponse:
    """Get product by ID."""
    service = ProductService(db)
    return service.get_by_id(product_id)


@router.post("", response_model=ProductResponse)
def create_product(
    product_data: ProductCreate, db: Session = Depends(get_db)
) -> ProductResponse:
    """Create a new product."""
    service = ProductService(db)
    return service.create(product_data)


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int, product_data: ProductUpdate, db: Session = Depends(get_db)
) -> ProductResponse:
    """Update product by ID."""
    service = ProductService(db)
    return service.update(product_id, product_data)


@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)) -> dict:
    """Delete product by ID."""
    service = ProductService(db)
    service.delete(product_id)
    return {"message": "Product deleted successfully"}
