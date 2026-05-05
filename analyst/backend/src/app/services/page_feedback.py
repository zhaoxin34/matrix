"""Page feedback service - calculates PageState based on session and state machine."""

import logging
import random
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.product import Product
from app.schemas.collect import PageAttributes, PageState
from app.services.session import UserSession, UserState

logger = logging.getLogger(__name__)


class PageFeedbackService:
    """Service to calculate PageState for sati.

    This replaces FakePageFeedback in sati, providing real page states
    based on session history, state machine rules, and real product data.
    """

    def __init__(self) -> None:
        """Initialize service with empty product cache."""
        self._products: list[Product] = []
        self._products_loaded = False

    def load_products(self, db: Session) -> None:
        """Load all products from database into memory.

        Args:
            db: Database session
        """
        if self._products_loaded:
            return

        stmt = select(Product).where(Product.is_active == 1)
        result = db.execute(stmt)
        self._products = list(result.scalars().all())
        self._products_loaded = True
        logger.info(f"Loaded {len(self._products)} products into memory")

    def get_random_product(self) -> Product | None:
        """Get a random product from in-memory cache.

        Returns:
            Random Product or None if no products available
        """
        if not self._products:
            return None
        return random.choice(self._products)

    def get_products_by_category(self, category_id: int) -> list[Product]:
        """Get all products in a specific category.

        Args:
            category_id: Category ID to filter by

        Returns:
            List of products in the category
        """
        return [p for p in self._products if p.category_id == category_id]

    def get_page_state(self, session: UserSession, action: str, db: Session | None = None) -> PageState:
        """Calculate PageState based on current session and action.

        Args:
            session: User session data
            action: The action that was just performed (landing, browse, add_cart, pay, login, exit)
            db: Database session (optional, for loading products)

        Returns:
            PageState: The page state to return to sati
        """
        # Load products on first call if not loaded
        if db is not None and not self._products_loaded:
            self.load_products(db)

        current_state = session.current_state

        # Determine next state based on action
        if action == "exit":
            return PageState(page_type="exit", page_subtype="", page_attributes=PageAttributes())

        # Handle login action
        if action == "login" or current_state == UserState.LOGIN:
            return PageState(page_type="login", page_subtype="login_page", page_attributes=PageAttributes())

        # Browse scenarios (more specific, check first)
        if action == "browse" or current_state == UserState.BROWSE:
            return self._get_browse_page(session)

        # Landing/browse scenarios (general case)
        if action in ("landing", "browse") or current_state in (UserState.LANDING, UserState.PAY):
            return self._get_landing_page(action)

        # Cart/add_cart scenarios
        if action in ("cart", "add_cart") or current_state == UserState.CART:
            return self._get_cart_page()

        # Pay scenarios
        if action == "pay" or current_state == UserState.PAY:
            return self._get_payment_page()

        # Default fallback
        return PageState(page_type="exit", page_subtype="", page_attributes=PageAttributes())

    def _get_landing_page(self, action: str) -> PageState:
        """Generate landing page type (homepage, red_packet, or coupon).

        Probability distribution:
        - red_packet: 40%
        - coupon: 18% (30% of remaining 60% after red_packet)
        - homepage: 42%
        """
        r = random.random()
        if r < 0.4:
            # red_packet: 40%
            amount = float(random.randint(5, 50))
            return PageState(
                page_type="landing",
                page_subtype="red_packet",
                page_attributes=PageAttributes(
                    amount=amount,
                    expire_hours=24,
                    min_amount=float(random.choice([100, 200, 500])),
                ),
            )
        elif r < 0.58:  # coupon: 18% (0.4 + 0.18 = 0.58)
            return PageState(
                page_type="landing",
                page_subtype="coupon",
                page_attributes=PageAttributes(
                    discount_amount=float(random.choice([10, 20, 50, 100])),
                    min_amount=float(random.choice([100, 200, 500])),
                    category=random.choice(["数码", "服装", "食品", "家居", "美妆", "运动"]),
                ),
            )
        # homepage: 42%
        return PageState(
            page_type="landing",
            page_subtype="homepage",
            page_attributes=PageAttributes(
                banner_count=random.randint(3, 5),
                featured_categories=random.sample(["数码", "服装", "食品", "家居", "美妆", "运动"], 4),
            ),
        )

    def _get_browse_page(self, session: UserSession) -> PageState:
        """Generate browse page (product_list or product_detail) using real product data."""
        product = self.get_random_product()

        # 30% chance to show product detail
        if random.random() < 0.3 and product:
            return PageState(
                page_type="browse",
                page_subtype="product_detail",
                page_attributes=PageAttributes(
                    product_id=str(product.original_id),
                    category=str(product.category_id) if product.category_id else None,
                    brand=product.brand,
                    price=float(product.price) if product.price else None,
                    original_price=float(product.original_price) if product.original_price else None,
                    discount=None,  # Could calculate from price/original_price
                    stock=random.randint(10, 100),
                ),
            )
        # Default: product list
        return PageState(
            page_type="browse",
            page_subtype="product_list",
            page_attributes=PageAttributes(
                category=str(product.category_id) if product and product.category_id else "1",
                count=random.randint(10, 50),
                sort_by=random.choice(["price_asc", "price_desc", "sales", "relevance"]),
            ),
        )

    def _get_cart_page(self) -> PageState:
        """Generate shopping cart page."""
        return PageState(
            page_type="add_cart",
            page_subtype="cart_page",
            page_attributes=PageAttributes(
                items_count=random.randint(1, 5),
                amount=float(random.randint(100, 2000)),
                saved_amount=float(random.randint(10, 100)),
            ),
        )

    def _get_payment_page(self) -> PageState:
        """Generate payment page."""
        return PageState(
            page_type="payment",
            page_subtype="payment_page",
            page_attributes=PageAttributes(
                order_id="",  # Will be filled by collect endpoint
                amount=float(random.randint(100, 5000)),
                payment_methods=["credit_card", "alipay", "wechat_pay", "bank_transfer"][: random.randint(2, 4)],
            ),
        )


# Global service instance (lazy loaded)
page_feedback_service = PageFeedbackService()
