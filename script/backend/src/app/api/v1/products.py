"""Products API routes."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.product import (
    ProductListResponse,
    ProductResponse,
    SearchSuggestion,
)
from app.services.product_service import ProductService

router = APIRouter()


@router.get("", response_model=ProductListResponse)
def list_products(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category_id: int | None = None,
    brand: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    in_stock: bool = False,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    db: Session = Depends(get_db),
) -> ProductListResponse:
    """List all products with pagination, filtering, and sorting."""
    service = ProductService(db)
    return service.get_multi_paginated(
        page=page,
        limit=limit,
        category_id=category_id,
        brand=brand,
        min_price=min_price,
        max_price=max_price,
        in_stock=in_stock if in_stock else None,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.get("/search", response_model=list[SearchSuggestion])
def search_products(
    q: str = Query(..., min_length=2),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
) -> list[SearchSuggestion]:
    """Search products by keyword for autocomplete suggestions."""
    service = ProductService(db)
    return service.search(q, limit=limit)


@router.get("/brands", response_model=list[str])
def list_brands(db: Session = Depends(get_db)) -> list[str]:
    """Get all unique brand names."""
    service = ProductService(db)
    return service.get_brands()


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)) -> ProductResponse:
    """Get product by ID with full details."""
    service = ProductService(db)
    return service.get_by_id(product_id)
