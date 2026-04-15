"""Orders API routes."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.order import OrderCreate, OrderResponse, OrderUpdate
from app.services.order_service import OrderService

router = APIRouter()


@router.get("", response_model=list[OrderResponse])
def list_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user_id: int | None = None,
    db: Session = Depends(get_db),
) -> list[OrderResponse]:
    """List all orders with pagination."""
    service = OrderService(db)
    skip = (page - 1) * page_size
    return service.get_multi(skip=skip, limit=page_size, user_id=user_id)


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)) -> OrderResponse:
    """Get order by ID."""
    service = OrderService(db)
    return service.get_by_id(order_id)


@router.post("", response_model=OrderResponse)
def create_order(
    order_data: OrderCreate, user_id: int = 1, db: Session = Depends(get_db)
) -> OrderResponse:
    """Create a new order."""
    from app.services.cart_service import CartService

    cart_service = CartService(db)
    total = cart_service.get_cart_total(user_id)
    service = OrderService(db)
    order = service.create(user_id, order_data, total)
    cart_service.clear(user_id)
    return order


@router.put("/{order_id}", response_model=OrderResponse)
def update_order(
    order_id: int, order_data: OrderUpdate, db: Session = Depends(get_db)
) -> OrderResponse:
    """Update order by ID."""
    service = OrderService(db)
    return service.update(order_id, order_data)


@router.delete("/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)) -> dict:
    """Delete order by ID."""
    service = OrderService(db)
    service.delete(order_id)
    return {"message": "Order deleted successfully"}
