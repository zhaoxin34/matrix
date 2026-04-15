"""Order service."""

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.repositories.order_repo import OrderRepository
from app.schemas.order import OrderCreate, OrderUpdate


class OrderService:
    """Order service for business logic."""

    def __init__(self, db: Session):
        """Initialize service with database session."""
        self.db = db
        self.repo = OrderRepository(db)

    def get_by_id(self, order_id: int) -> OrderRepository:
        """Get order by ID."""
        order = self.repo.get_by_id(order_id)
        if not order:
            raise NotFoundException("Order not found")
        return order

    def get_by_user(self, user_id: int) -> list:
        """Get all orders for a user."""
        return self.repo.get_by_user(user_id)

    def get_multi(
        self, skip: int = 0, limit: int = 100, user_id: int | None = None
    ) -> list:
        """Get multiple orders."""
        return self.repo.get_multi(skip=skip, limit=limit, user_id=user_id)

    def create(
        self, user_id: int, order_data: OrderCreate, total_amount: float
    ) -> OrderRepository:
        """Create a new order."""
        return self.repo.create(user_id, order_data, total_amount)

    def update(self, order_id: int, order_data: OrderUpdate) -> OrderRepository:
        """Update an existing order."""
        order = self.get_by_id(order_id)
        return self.repo.update(order, order_data)

    def delete(self, order_id: int) -> None:
        """Delete an order."""
        order = self.get_by_id(order_id)
        self.repo.delete(order)

    def count(self, user_id: int | None = None) -> int:
        """Count orders."""
        return self.repo.count(user_id=user_id)
