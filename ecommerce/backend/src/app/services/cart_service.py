"""Cart service."""

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.models.product import Product
from app.repositories.cart_repo import CartRepository
from app.schemas.cart import CartItemCreate, CartItemUpdate


class CartService:
    """Cart service for business logic."""

    def __init__(self, db: Session):
        """Initialize service with database session."""
        self.db = db
        self.repo = CartRepository(db)

    def get_by_id(self, cart_item_id: int) -> CartRepository:
        """Get cart item by ID."""
        cart_item = self.repo.get_by_id(cart_item_id)
        if not cart_item:
            raise NotFoundException("Cart item not found")
        return cart_item

    def get_by_user(self, user_id: int) -> list:
        """Get all cart items for a user."""
        return self.repo.get_by_user(user_id)

    def get_multi(self, skip: int = 0, limit: int = 100) -> list:
        """Get multiple cart items."""
        return self.repo.get_multi(skip=skip, limit=limit)

    def create(self, user_id: int, cart_data: CartItemCreate) -> CartRepository:
        """Create a new cart item."""
        existing = self.repo.get_by_user_and_product(user_id, cart_data.product_id)
        if existing:
            existing.quantity += cart_data.quantity
            self.db.commit()
            self.db.refresh(existing)
            return existing
        return self.repo.create(user_id, cart_data)

    def update(self, cart_item_id: int, cart_data: CartItemUpdate) -> CartRepository:
        """Update an existing cart item."""
        cart_item = self.get_by_id(cart_item_id)
        return self.repo.update(cart_item, cart_data)

    def delete(self, cart_item_id: int) -> None:
        """Delete a cart item."""
        cart_item = self.get_by_id(cart_item_id)
        self.repo.delete(cart_item)

    def clear(self, user_id: int) -> None:
        """Clear all cart items for a user."""
        self.repo.delete_by_user(user_id)

    def get_cart_total(self, user_id: int) -> float:
        """Calculate cart total for a user."""
        cart_items = self.repo.get_by_user(user_id)
        total = 0.0
        for item in cart_items:
            product = (
                self.db.query(Product).filter(Product.id == item.product_id).first()
            )
            if product:
                total += product.price * item.quantity
        return total

    def count(self, user_id: int | None = None) -> int:
        """Count cart items."""
        return self.repo.count(user_id=user_id)
