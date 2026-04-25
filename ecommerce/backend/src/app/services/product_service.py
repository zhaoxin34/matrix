"""Product service."""

import math

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.repositories.product_repo import ProductRepository
from app.schemas.product import (
    CategoryResponse,
    CategoryTreeResponse,
    ProductListResponse,
    ProductResponse,
    SearchSuggestion,
)


class ProductService:
    """Product service for business logic."""

    def __init__(self, db: Session):
        """Initialize service with database session."""
        self.db = db
        self.repo = ProductRepository(db)

    def get_by_id(self, product_id: int) -> ProductResponse:
        """Get product by ID with full details."""
        product = self.repo.get_by_id(product_id)
        if not product:
            raise NotFoundException("Product not found")
        return ProductResponse.from_orm_with_images(product)

    def get_multi_paginated(
        self,
        page: int = 1,
        limit: int = 20,
        category_id: int | None = None,
        brand: str | None = None,
        min_price: float | None = None,
        max_price: float | None = None,
        in_stock: bool | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> ProductListResponse:
        """Get paginated products with filters and sorting."""
        from app.models.product import Product

        offset = (page - 1) * limit

        # Build query
        query = self.db.query(Product)
        if category_id:
            query = query.filter(Product.category_id == category_id)
        if brand:
            query = query.filter(Product.brand == brand)
        if min_price is not None:
            query = query.filter(Product.price >= min_price)
        if max_price is not None:
            query = query.filter(Product.price <= max_price)
        if in_stock:
            query = query.filter(Product.stock > 0)

        # Get total count
        total = query.count()

        # Apply sorting
        sort_attr = getattr(Product, sort_by, Product.created_at)
        if sort_order == "desc":
            query = query.order_by(sort_attr.desc())
        else:
            query = query.order_by(sort_attr.asc())

        # Apply pagination
        products = query.offset(offset).limit(limit).all()

        # Convert to response
        items = [ProductResponse.from_orm_with_images(p) for p in products]
        pages = math.ceil(total / limit) if limit > 0 else 0

        return ProductListResponse(
            items=items,
            total=total,
            page=page,
            limit=limit,
            pages=pages,
        )

    def search(self, keyword: str, limit: int = 10) -> list[SearchSuggestion]:
        """Search products by keyword for autocomplete."""
        from app.models.product import Product

        if len(keyword) < 2:
            return []

        pattern = f"%{keyword}%"
        products = (
            self.db.query(Product)
            .filter(
                or_(
                    Product.name.ilike(pattern),
                    Product.description.ilike(pattern),
                )
            )
            .filter(Product.is_active)
            .limit(limit)
            .all()
        )

        return [SearchSuggestion(id=p.id, name=p.name) for p in products]

    def get_category_tree(self) -> list[CategoryTreeResponse]:
        """Get category tree with L1 and L2 categories."""
        from app.models.category import Category

        # Get all L1 categories
        l1_categories = self.db.query(Category).filter(Category.level == 1).order_by(Category.sort_order).all()

        # Get all L2 categories
        l2_categories = self.db.query(Category).filter(Category.level == 2).order_by(Category.sort_order).all()

        # Build tree
        l2_by_parent = {}
        for l2 in l2_categories:
            if l2.parent_id not in l2_by_parent:
                l2_by_parent[l2.parent_id] = []
            l2_by_parent[l2.parent_id].append(
                CategoryResponse(
                    id=l2.id,
                    name=l2.name,
                    description=l2.description,
                    parent_id=l2.parent_id,
                    level=l2.level,
                    sort_order=l2.sort_order,
                )
            )

        tree = []
        for l1 in l1_categories:
            tree.append(
                CategoryTreeResponse(
                    id=l1.id,
                    name=l1.name,
                    level=l1.level,
                    children=l2_by_parent.get(l1.id, []),
                )
            )

        return tree

    def get_brands(self) -> list[str]:
        """Get all unique brand names."""
        from app.models.product import Product

        brands = self.db.query(Product.brand).filter(Product.brand.isnot(None)).distinct().all()
        return [b[0] for b in brands if b[0]]
