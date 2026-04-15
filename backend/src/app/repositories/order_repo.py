"""Order repository."""

from sqlalchemy.orm import Session

from app.models.order import Order, OrderItem
from app.schemas.order import OrderCreate, OrderUpdate


class OrderRepository:
    """Order repository for database operations."""

    def __init__(self, db: Session):
        """Initialize repository with database session."""
        self.db = db

    def get_by_id(self, order_id: int) -> Order | None:
        """Get order by ID."""
        return self.db.query(Order).filter(Order.id == order_id).first()

    def get_by_user(self, user_id: int) -> list[Order]:
        """Get all orders for a user."""
        return self.db.query(Order).filter(Order.user_id == user_id).all()

    def get_multi(
        self, skip: int = 0, limit: int = 100, user_id: int | None = None
    ) -> list[Order]:
        """Get multiple orders with pagination."""
        query = self.db.query(Order)
        if user_id:
            query = query.filter(Order.user_id == user_id)
        return query.offset(skip).limit(limit).all()

    def create(
        self, user_id: int, order_data: OrderCreate, total_amount: float
    ) -> Order:
        """Create a new order."""
        order = Order(
            user_id=user_id,
            status="pending",
            total_amount=total_amount,
        )
        self.db.add(order)
        self.db.flush()

        for item in order_data.items:
            order_item = OrderItem(
                order_id=order.id,
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price=0.0,
            )
            self.db.add(order_item)

        self.db.commit()
        self.db.refresh(order)
        return order

    def update(self, order: Order, order_data: OrderUpdate) -> Order:
        """Update an existing order."""
        for field, value in order_data.model_dump(exclude_unset=True).items():
            setattr(order, field, value)
        self.db.commit()
        self.db.refresh(order)
        return order

    def delete(self, order: Order) -> None:
        """Delete an order."""
        self.db.delete(order)
        self.db.commit()

    def count(self, user_id: int | None = None) -> int:
        """Count orders."""
        query = self.db.query(Order)
        if user_id:
            query = query.filter(Order.user_id == user_id)
        return query.count()
