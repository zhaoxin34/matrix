"""Cart API routes."""

import secrets
from fastapi import APIRouter, Cookie, Depends, Header, HTTPException, status, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user_optional
from app.models.user import User
from app.schemas.cart import (
    CartItemCreate,
    CartItemResponse,
    CartItemUpdate,
    CartResponse,
)
from app.services.cart_service import CartService

router = APIRouter()


def get_cart_identity(
    user: User | None = Depends(get_current_user_optional),
    session_id: str | None = Cookie(default=None),
    x_cart_session_id: str | None = Header(default=None),
) -> tuple[int | None, str | None]:
    """Resolve cart identity from JWT user, session cookie, or X-Cart-Session-Id header."""
    # Prefer cookie, fall back to header (for cross-origin requests from frontend proxy)
    resolved_session = session_id or x_cart_session_id
    return (user.id if user else None, resolved_session)


@router.get("/items", response_model=CartResponse)
def list_cart_items(
    identity: tuple[int | None, str | None] = Depends(get_cart_identity),
    db: Session = Depends(get_db),
) -> CartResponse:
    """List all cart items for the current user or session."""
    user_id, session_id = identity
    if user_id is None and session_id is None:
        return CartResponse(items=[], total=0.0)
    service = CartService(db)
    items = service.get_for_identity(user_id, session_id)
    total = service.get_cart_total_for_identity(user_id, session_id)
    return CartResponse(items=items, total=total)


@router.get("/{cart_item_id}", response_model=CartItemResponse)
def get_cart_item(
    cart_item_id: int,
    identity: tuple[int | None, str | None] = Depends(get_cart_identity),
    db: Session = Depends(get_db),
) -> CartItemResponse:
    """Get cart item by ID."""
    user_id, session_id = identity
    service = CartService(db)
    item = service.get_by_id(cart_item_id)
    # Verify ownership
    if item.user_id != user_id and item.session_id != session_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this cart item",
        )
    return item


@router.post("/items", response_model=CartItemResponse)
def create_cart_item(
    cart_data: CartItemCreate,
    response: Response,
    identity: tuple[int | None, str | None] = Depends(get_cart_identity),
    db: Session = Depends(get_db),
) -> CartItemResponse:
    """Add item to cart."""
    user_id, session_id = identity
    # Generate session_id for guest users on first add
    if user_id is None and session_id is None:
        session_id = secrets.token_urlsafe(32)
        response.set_cookie(
            key="cart_session_id",
            value=session_id,
            # Allow JavaScript access for cart session (not a security-sensitive cookie)
            max_age=60 * 60 * 24 * 7,  # 7 days
            samesite="lax",
        )
    service = CartService(db)
    sku_variant = cart_data.sku_variant
    item = service.create_for_identity(user_id, session_id, cart_data, sku_variant)
    # Return session_id in header for frontend storage
    if session_id:
        response.headers["X-Cart-Session-Id"] = session_id
    return item


@router.put("/{cart_item_id}", response_model=CartItemResponse)
def update_cart_item(
    cart_item_id: int,
    cart_data: CartItemUpdate,
    identity: tuple[int | None, str | None] = Depends(get_cart_identity),
    db: Session = Depends(get_db),
) -> CartItemResponse:
    """Update cart item by ID."""
    user_id, session_id = identity
    service = CartService(db)
    item = service.get_by_id(cart_item_id)
    # Verify ownership
    if item.user_id != user_id and item.session_id != session_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this cart item",
        )
    return service.update(cart_item_id, cart_data)


@router.delete("/{cart_item_id}")
def delete_cart_item(
    cart_item_id: int,
    identity: tuple[int | None, str | None] = Depends(get_cart_identity),
    db: Session = Depends(get_db),
) -> dict:
    """Delete cart item by ID."""
    user_id, session_id = identity
    service = CartService(db)
    item = service.get_by_id(cart_item_id)
    # Verify ownership
    if item.user_id != user_id and item.session_id != session_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this cart item",
        )
    service.delete(cart_item_id)
    return {"message": "Cart item deleted successfully"}


@router.delete("/items")
def clear_cart(
    identity: tuple[int | None, str | None] = Depends(get_cart_identity),
    db: Session = Depends(get_db),
) -> dict:
    """Clear all cart items for the current user or session."""
    user_id, session_id = identity
    if user_id is None and session_id is None:
        return {"message": "Cart cleared successfully"}
    service = CartService(db)
    service.clear_for_identity(user_id, session_id)
    return {"message": "Cart cleared successfully"}
