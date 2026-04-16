"""Product service."""

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.repositories.product_repo import ProductRepository
from app.schemas.product import ProductCreate, ProductUpdate


class ProductService:
    """Product service for business logic."""

    def __init__(self, db: Session):
        """Initialize service with database session."""
        self.db = db
        self.repo = ProductRepository(db)

    def get_by_id(self, product_id: int) -> ProductRepository:
        """Get product by ID."""
        product = self.repo.get_by_id(product_id)
        if not product:
            raise NotFoundException("Product not found")
        return product

    def get_multi(
        self, skip: int = 0, limit: int = 100, category_id: int | None = None
    ) -> list:
        """Get multiple products."""
        return self.repo.get_multi(skip=skip, limit=limit, category_id=category_id)

    def create(self, product_data: ProductCreate) -> ProductRepository:
        """Create a new product."""
        return self.repo.create(product_data)

    def update(self, product_id: int, product_data: ProductUpdate) -> ProductRepository:
        """Update an existing product."""
        product = self.get_by_id(product_id)
        return self.repo.update(product, product_data)

    def delete(self, product_id: int) -> None:
        """Delete a product."""
        product = self.get_by_id(product_id)
        self.repo.delete(product)

    def count(self, category_id: int | None = None) -> int:
        """Count total products."""
        return self.repo.count(category_id=category_id)
