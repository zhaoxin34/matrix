"""Cart repository."""

from sqlalchemy.orm import Session

from app.models.cart import CartItem
from app.schemas.cart import CartItemCreate, CartItemUpdate


class CartRepository:
    """Cart repository for database operations."""

    def __init__(self, db: Session):
        """Initialize repository with database session."""
        self.db = db

    def get_by_id(self, cart_item_id: int) -> CartItem | None:
        """Get cart item by ID."""
        return self.db.query(CartItem).filter(CartItem.id == cart_item_id).first()

    def get_by_user_and_product(self, user_id: int, product_id: int) -> CartItem | None:
        """Get cart item by user and product."""
        return self.db.query(CartItem).filter(CartItem.user_id == user_id, CartItem.product_id == product_id).first()

    def get_by_user(self, user_id: int) -> list[CartItem]:
        """Get all cart items for a user."""
        return self.db.query(CartItem).filter(CartItem.user_id == user_id).all()

    def get_multi(self, skip: int = 0, limit: int = 100) -> list[CartItem]:
        """Get multiple cart items with pagination."""
        return self.db.query(CartItem).offset(skip).limit(limit).all()

    def create(self, user_id: int, cart_data: CartItemCreate, sku_variant: str | None = None) -> CartItem:
        """Create a new cart item."""
        cart_item = CartItem(
            user_id=user_id,
            product_id=cart_data.product_id,
            quantity=cart_data.quantity,
            sku_variant=sku_variant,
        )
        self.db.add(cart_item)
        self.db.commit()
        self.db.refresh(cart_item)
        return cart_item

    def get_by_session(self, session_id: str) -> list[CartItem]:
        """Get all cart items for a session."""
        return self.db.query(CartItem).filter(CartItem.session_id == session_id).all()

    def get_by_session_and_product(self, session_id: str, product_id: int) -> CartItem | None:
        """Get cart item by session and product."""
        return (
            self.db.query(CartItem).filter(CartItem.session_id == session_id, CartItem.product_id == product_id).first()
        )

    def create_for_session(
        self, session_id: str, cart_data: CartItemCreate, sku_variant: str | None = None
    ) -> CartItem:
        """Create a new cart item for a session."""
        cart_item = CartItem(
            session_id=session_id,
            product_id=cart_data.product_id,
            quantity=cart_data.quantity,
            sku_variant=sku_variant,
        )
        self.db.add(cart_item)
        self.db.commit()
        self.db.refresh(cart_item)
        return cart_item

    def delete_by_session(self, session_id: str) -> None:
        """Delete all cart items for a session."""
        self.db.query(CartItem).filter(CartItem.session_id == session_id).delete()
        self.db.commit()

    def update_by_session_and_product(self, session_id: str, product_id: int, quantity: int) -> CartItem | None:
        """Update quantity for existing session cart item."""
        cart_item = self.get_by_session_and_product(session_id, product_id)
        if cart_item:
            cart_item.quantity = quantity
            self.db.commit()
            self.db.refresh(cart_item)
        return cart_item

    def update(self, cart_item: CartItem, cart_data: CartItemUpdate) -> CartItem:
        """Update an existing cart item."""
        for field, value in cart_data.model_dump(exclude_unset=True).items():
            setattr(cart_item, field, value)
        self.db.commit()
        self.db.refresh(cart_item)
        return cart_item

    def delete(self, cart_item: CartItem) -> None:
        """Delete a cart item."""
        self.db.delete(cart_item)
        self.db.commit()

    def delete_by_user(self, user_id: int) -> None:
        """Delete all cart items for a user."""
        self.db.query(CartItem).filter(CartItem.user_id == user_id).delete()
        self.db.commit()

    def count(self, user_id: int | None = None) -> int:
        """Count cart items."""
        query = self.db.query(CartItem)
        if user_id:
            query = query.filter(CartItem.user_id == user_id)
        return query.count()
