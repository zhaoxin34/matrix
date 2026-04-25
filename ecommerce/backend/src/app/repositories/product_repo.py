"""Product repository."""

from sqlalchemy.orm import Session

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


class ProductRepository:
    """Product repository for database operations."""

    def __init__(self, db: Session):
        """Initialize repository with database session."""
        self.db = db

    def get_by_id(self, product_id: int) -> Product | None:
        """Get product by ID."""
        return self.db.query(Product).filter(Product.id == product_id).first()

    def get_by_name(self, name: str) -> Product | None:
        """Get product by name."""
        return self.db.query(Product).filter(Product.name == name).first()

    def get_multi(self, skip: int = 0, limit: int = 100, category_id: int | None = None) -> list[Product]:
        """Get multiple products with pagination."""
        query = self.db.query(Product)
        if category_id:
            query = query.filter(Product.category_id == category_id)
        return query.offset(skip).limit(limit).all()

    def create(self, product_data: ProductCreate) -> Product:
        """Create a new product."""
        product = Product(
            name=product_data.name,
            description=product_data.description,
            price=product_data.price,
            stock=product_data.stock,
            category_id=product_data.category_id,
        )
        self.db.add(product)
        self.db.commit()
        self.db.refresh(product)
        return product

    def update(self, product: Product, product_data: ProductUpdate) -> Product:
        """Update an existing product."""
        for field, value in product_data.model_dump(exclude_unset=True).items():
            setattr(product, field, value)
        self.db.commit()
        self.db.refresh(product)
        return product

    def delete(self, product: Product) -> None:
        """Delete a product."""
        self.db.delete(product)
        self.db.commit()

    def count(self, category_id: int | None = None) -> int:
        """Count total products."""
        query = self.db.query(Product)
        if category_id:
            query = query.filter(Product.category_id == category_id)
        return query.count()
