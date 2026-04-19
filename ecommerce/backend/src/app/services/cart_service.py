"""Cart service."""

import json

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.models.product import Product
from app.repositories.cart_repo import CartRepository
from app.schemas.cart import CartItemCreate, CartItemUpdate


class CartService:
    """Cart service for business logic."""

    def __init__(self, db: Session, session_id: str | None = None):
        """Initialize service with database session."""
        self.db = db
        self.repo = CartRepository(db)
        self.session_id = session_id

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

    def create(self, user_id: int, cart_data: CartItemCreate, sku_variant: str | None = None) -> CartRepository:
        """Create a new cart item."""
        existing = self.repo.get_by_user_and_product(user_id, cart_data.product_id)
        if existing:
            existing.quantity += cart_data.quantity
            self.db.commit()
            self.db.refresh(existing)
            return existing
        return self.repo.create(user_id, cart_data, sku_variant)

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
        return self._calculate_total(cart_items)

    def count(self, user_id: int | None = None) -> int:
        """Count cart items."""
        return self.repo.count(user_id=user_id)

    def get_for_identity(self, user_id: int | None, session_id: str | None) -> list:
        """Get cart items based on user_id or session_id."""
        if user_id is not None:
            return self.repo.get_by_user(user_id)
        elif session_id is not None:
            return self.repo.get_by_session(session_id)
        return []

    def get_cart_total_for_identity(self, user_id: int | None, session_id: str | None) -> float:
        """Calculate cart total for user or session."""
        items = self.get_for_identity(user_id, session_id)
        return self._calculate_total(items)

    def _calculate_total(self, items: list) -> float:
        """Calculate total price for cart items."""
        total = 0.0
        for item in items:
            product = (
                self.db.query(Product).filter(Product.id == item.product_id).first()
            )
            if product:
                total += product.price * item.quantity
        return total

    def create_for_identity(
        self,
        user_id: int | None,
        session_id: str | None,
        cart_data: CartItemCreate,
        sku_variant: str | None = None
    ):
        """Create cart item for either user or session."""
        # Serialize sku_variant to JSON string if dict
        if isinstance(sku_variant, dict):
            sku_variant = json.dumps(sku_variant)

        if user_id is not None:
            existing = self.repo.get_by_user_and_product(user_id, cart_data.product_id)
            if existing:
                existing.quantity += cart_data.quantity
                self.db.commit()
                self.db.refresh(existing)
                return existing
            return self.repo.create(user_id, cart_data, sku_variant)
        elif session_id is not None:
            existing = self.repo.get_by_session_and_product(session_id, cart_data.product_id)
            if existing:
                existing.quantity += cart_data.quantity
                self.db.commit()
                self.db.refresh(existing)
                return existing
            return self.repo.create_for_session(session_id, cart_data, sku_variant)
        raise ValueError("Either user_id or session_id must be provided")

    def count_for_identity(self, user_id: int | None, session_id: str | None) -> int:
        """Count cart items for user or session."""
        if user_id is not None:
            return self.repo.count(user_id=user_id)
        elif session_id is not None:
            return len(self.repo.get_by_session(session_id))
        return 0

    def clear_for_identity(self, user_id: int | None, session_id: str | None) -> None:
        """Clear cart for user or session."""
        if user_id is not None:
            self.repo.delete_by_user(user_id)
        elif session_id is not None:
            self.repo.delete_by_session(session_id)

    def merge_guest_cart(self, user_id: int, guest_session_id: str) -> int:
        """Merge guest cart into user cart. Returns count of items merged."""
        guest_items = self.repo.get_by_session(guest_session_id)
        if not guest_items:
            return 0

        merged_count = 0
        for guest_item in guest_items:
            # Check if user already has this product
            user_item = self.repo.get_by_user_and_product(user_id, guest_item.product_id)
            if user_item:
                # Add quantities together
                user_item.quantity += guest_item.quantity
                self.db.commit()
            else:
                # Transfer guest item to user
                guest_item.user_id = user_id
                guest_item.session_id = None
                self.db.commit()
            merged_count += 1

        # Delete all guest cart items
        self.repo.delete_by_session(guest_session_id)
        return merged_count
