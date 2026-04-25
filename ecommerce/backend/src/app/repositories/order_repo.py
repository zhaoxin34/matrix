"""Order repository."""

from sqlalchemy.orm import Session

from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
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

    def get_by_session(self, session_id: str) -> list[Order]:
        """Get all orders for a session (guest)."""
        return self.db.query(Order).filter(Order.session_id == session_id).all()

    def get_by_identity(self, user_id: int | None, session_id: str | None) -> list[Order]:
        """Get orders by user_id or session_id."""
        query = self.db.query(Order)
        if user_id:
            query = query.filter(Order.user_id == user_id)
        elif session_id:
            query = query.filter(Order.session_id == session_id)
        else:
            return []
        return query.order_by(Order.created_at.desc()).all()

    def get_multi(self, skip: int = 0, limit: int = 100, user_id: int | None = None) -> list[Order]:
        """Get multiple orders with pagination."""
        query = self.db.query(Order)
        if user_id:
            query = query.filter(Order.user_id == user_id)
        return query.offset(skip).limit(limit).all()

    def create(
        self,
        user_id: int | None,
        session_id: str | None,
        order_data: OrderCreate,
        total_amount: float,
        cart_items: list,
    ) -> Order:
        """Create a new order from cart items."""
        order = Order(
            user_id=user_id if user_id else 0,
            session_id=session_id,
            status="paid",
            total_amount=total_amount,
        )
        self.db.add(order)
        self.db.flush()

        # Batch fetch products to avoid N+1 queries
        product_ids = [item.product_id for item in cart_items]
        products = {p.id: p for p in self.db.query(Product).filter(Product.id.in_(product_ids)).all()}

        for cart_item in cart_items:
            product = products.get(cart_item.product_id)
            if not product:
                continue

            order_item = OrderItem(
                order_id=order.id,
                product_id=cart_item.product_id,
                quantity=cart_item.quantity,
                unit_price=float(product.price),
            )
            self.db.add(order_item)

            product.stock = max(0, product.stock - cart_item.quantity)

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
