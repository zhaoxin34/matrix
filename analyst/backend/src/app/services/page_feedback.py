"""Page feedback service - calculates PageState based on session and state machine."""

import random

from app.schemas.collect import PageAttributes, PageState
from app.services.session import (
    UserSession,
    UserState,
)


class PageFeedbackService:
    """Service to calculate PageState for sati.

    This replaces FakePageFeedback in sati, providing real page states
    based on session history and state machine rules.
    """

    CATEGORIES = ["数码", "服装", "食品", "家居", "美妆", "运动", "图书"]
    BRANDS = ["Apple", "华为", "小米", "耐克", "阿迪", "优衣库", "蒙牛", "伊利"]

    def get_page_state(self, session: UserSession, action: str) -> PageState:
        """Calculate PageState based on current session and action.

        Args:
            session: User session data
            action: The action that was just performed (landing, browse, add_cart, pay, login, exit)

        Returns:
            PageState: The page state to return to sati
        """
        current_state = session.current_state

        # Determine next state based on action
        if action == "exit":
            return PageState(page_type="exit", page_subtype="", page_attributes=PageAttributes())

        # Handle login action
        if action == "login" or current_state == UserState.LOGIN:
            return PageState(page_type="login", page_subtype="login_page", page_attributes=PageAttributes())

        # Landing/browse scenarios
        if action in ("landing", "browse") or current_state in (UserState.LANDING, UserState.PAY):
            return self._get_landing_page(action)

        # Browse scenarios
        if action == "browse" or current_state == UserState.BROWSE:
            return self._get_browse_page(session)

        # Cart/add_cart scenarios
        if action in ("cart", "add_cart") or current_state == UserState.CART:
            return self._get_cart_page()

        # Pay scenarios
        if action == "pay" or current_state == UserState.PAY:
            return self._get_payment_page()

        # Default fallback
        return PageState(page_type="exit", page_subtype="", page_attributes=PageAttributes())

    def _get_landing_page(self, action: str) -> PageState:
        """Generate landing page type (homepage, red_packet, or coupon)."""
        # 40% chance for red_packet (young users)
        if random.random() < 0.4:
            amount = random.randint(5, 50)
            return PageState(
                page_type="landing",
                page_subtype="red_packet",
                page_attributes=PageAttributes(
                    amount=float(amount),
                    expire_hours=24,
                    min_amount=random.choice([100, 200, 500]),
                ),
            )
        # 30% chance for coupon
        elif random.random() < 0.3:
            return PageState(
                page_type="landing",
                page_subtype="coupon",
                page_attributes=PageAttributes(
                    discount_amount=random.choice([10, 20, 50, 100]),
                    min_amount=random.choice([100, 200, 500]),
                    category=random.choice(self.CATEGORIES),
                ),
            )
        # Default: homepage
        return PageState(
            page_type="landing",
            page_subtype="homepage",
            page_attributes=PageAttributes(
                banner_count=random.randint(3, 5),
                featured_categories=random.sample(self.CATEGORIES, 4),
            ),
        )

    def _get_browse_page(self, session: UserSession) -> PageState:
        """Generate browse page (product_list or product_detail)."""
        # 30% chance to show product detail
        if random.random() < 0.3:
            price = float(random.randint(50, 5000))
            original_price = int(price * random.uniform(1.2, 2.0))
            return PageState(
                page_type="browse",
                page_subtype="product_detail",
                page_attributes=PageAttributes(
                    product_id=f"PROD_{random.randint(10000, 99999)}",
                    category=random.choice(self.CATEGORIES),
                    brand=random.choice(self.BRANDS),
                    price=price,
                    original_price=float(original_price),
                    discount=round(random.uniform(0.7, 0.95), 2),
                    stock=random.randint(10, 100),
                ),
            )
        # Default: product list
        return PageState(
            page_type="browse",
            page_subtype="product_list",
            page_attributes=PageAttributes(
                category=random.choice(self.CATEGORIES),
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
                order_id=f"ORD_{random.randint(100000, 999999)}",
                amount=float(random.randint(100, 5000)),
                payment_methods=["credit_card", "alipay", "wechat_pay", "bank_transfer"][: random.randint(2, 4)],
            ),
        )


# Global service instance
page_feedback_service = PageFeedbackService()
