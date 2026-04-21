"""Orders API routes."""

from fastapi import APIRouter, Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user_optional
from app.models.user import User
from app.schemas.order import OrderCreate, OrderResponse, OrderUpdate
from app.services.order_service import OrderService
from app.services.cart_service import CartService

router = APIRouter()


def get_order_identity(
    user: User | None = Depends(get_current_user_optional),
    session_id: str | None = Cookie(default=None),
) -> tuple[int | None, str | None]:
    """Resolve order identity from JWT user or session cookie."""
    return (user.id if user else None, session_id)


@router.get("", response_model=list[OrderResponse])
def list_orders(
    identity: tuple[int | None, str | None] = Depends(get_order_identity),
    db: Session = Depends(get_db),
) -> list[OrderResponse]:
    """List all orders for the current user or session."""
    user_id, session_id = identity
    service = OrderService(db)
    return service.get_by_identity(user_id, session_id)


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    identity: tuple[int | None, str | None] = Depends(get_order_identity),
    db: Session = Depends(get_db),
) -> OrderResponse:
    """Get order by ID."""
    user_id, session_id = identity
    service = OrderService(db)
    order = service.get_by_id(order_id)
    if order.user_id != user_id and order.session_id != session_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this order",
        )
    return order


@router.post("", response_model=OrderResponse)
def create_order(
    order_data: OrderCreate,
    identity: tuple[int | None, str | None] = Depends(get_order_identity),
    db: Session = Depends(get_db),
) -> OrderResponse:
    """Create a new order from cart."""
    user_id, session_id = identity

    if user_id is None and session_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must be logged in or have session to place order",
        )

    cart_service = CartService(db)
    order_service = OrderService(db)

    cart_items = cart_service.get_for_identity(user_id, session_id)
    if not cart_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cart is empty",
        )

    total = cart_service.get_cart_total_for_identity(user_id, session_id)

    order = order_service.create_with_cart(
        user_id=user_id,
        session_id=session_id,
        order_data=order_data,
        cart_items=cart_items,
        total_amount=total,
    )

    cart_service.clear_for_identity(user_id, session_id)

    return order


@router.put("/{order_id}", response_model=OrderResponse)
def update_order(
    order_id: int,
    order_data: OrderUpdate,
    identity: tuple[int | None, str | None] = Depends(get_order_identity),
    db: Session = Depends(get_db),
) -> OrderResponse:
    """Update order by ID (e.g., cancel)."""
    user_id, session_id = identity
    service = OrderService(db)
    order = service.get_by_id(order_id)
    if order.user_id != user_id and order.session_id != session_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this order",
        )
    return service.update(order_id, order_data)


@router.delete("/{order_id}")
def delete_order(
    order_id: int,
    identity: tuple[int | None, str | None] = Depends(get_order_identity),
    db: Session = Depends(get_db),
) -> dict:
    """Delete order by ID."""
    user_id, session_id = identity
    service = OrderService(db)
    order = service.get_by_id(order_id)
    if order.user_id != user_id and order.session_id != session_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this order",
        )
    service.delete(order_id)
    return {"message": "Order deleted successfully"}
