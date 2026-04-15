"""Cart API routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.cart import (
    CartItemCreate,
    CartItemResponse,
    CartItemUpdate,
    CartResponse,
)
from app.services.cart_service import CartService

router = APIRouter()


@router.get("/items", response_model=CartResponse)
def list_cart_items(user_id: int = 1, db: Session = Depends(get_db)) -> CartResponse:
    """List all cart items for a user."""
    service = CartService(db)
    items = service.get_by_user(user_id)
    total = service.get_cart_total(user_id)
    return CartResponse(items=items, total=total)


@router.get("/{cart_item_id}", response_model=CartItemResponse)
def get_cart_item(cart_item_id: int, db: Session = Depends(get_db)) -> CartItemResponse:
    """Get cart item by ID."""
    service = CartService(db)
    return service.get_by_id(cart_item_id)


@router.post("/items", response_model=CartItemResponse)
def create_cart_item(
    cart_data: CartItemCreate, user_id: int = 1, db: Session = Depends(get_db)
) -> CartItemResponse:
    """Add item to cart."""
    service = CartService(db)
    return service.create(user_id, cart_data)


@router.put("/{cart_item_id}", response_model=CartItemResponse)
def update_cart_item(
    cart_item_id: int, cart_data: CartItemUpdate, db: Session = Depends(get_db)
) -> CartItemResponse:
    """Update cart item by ID."""
    service = CartService(db)
    return service.update(cart_item_id, cart_data)


@router.delete("/{cart_item_id}")
def delete_cart_item(cart_item_id: int, db: Session = Depends(get_db)) -> dict:
    """Delete cart item by ID."""
    service = CartService(db)
    service.delete(cart_item_id)
    return {"message": "Cart item deleted successfully"}


@router.delete("/items")
def clear_cart(user_id: int = 1, db: Session = Depends(get_db)) -> dict:
    """Clear all cart items for a user."""
    service = CartService(db)
    service.clear(user_id)
    return {"message": "Cart cleared successfully"}
