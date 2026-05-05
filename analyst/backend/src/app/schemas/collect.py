"""Collect API schemas for user event collection."""

from typing import Any

from pydantic import BaseModel, Field


class PageAttributes(BaseModel):
    """Page attributes for page state."""

    category: str | None = None
    brand: str | None = None
    price: float | None = None
    original_price: float | None = None
    discount: float | None = None
    stock: int | None = None
    product_id: str | None = None
    count: int | None = None
    sort_by: str | None = None
    amount: float | None = None
    expire_hours: int | None = None
    min_amount: float | None = None
    items_count: int | None = None
    saved_amount: float | None = None
    order_id: str | None = None
    payment_methods: list[str] | None = None
    banner_count: int | None = None
    featured_categories: list[str] | None = None
    discount_amount: float | None = None
    extra: dict[str, Any] = Field(default_factory=dict)


class PageState(BaseModel):
    """Page state returned to sati after collecting an event."""

    page_type: str = Field(
        description="Page type: landing, browse, add_cart, payment, login, exit"
    )
    page_subtype: str = Field(
        description=(
            "Page subtype: homepage, red_packet, coupon, product_list, "
            "product_detail, cart_page, payment_page, login_page"
        )
    )
    page_attributes: PageAttributes = Field(default_factory=PageAttributes)


class CollectRequest(BaseModel):
    """Request body for /api/v1/collect endpoint."""

    session_id: str = Field(description="User session ID")
    user_id: str | None = Field(default=None, description="User ID (optional for guests)")
    action: str = Field(description="User action: landing, browse, add_cart, pay, login, exit")
    current_state: str = Field(description="Current user state before action")
    event_value: dict[str, Any] | None = Field(default=None, description="Additional event data (JSON)")
    ip_address: str | None = Field(default=None, description="Client IP address")
    user_agent: str | None = Field(default=None, description="Browser user agent")


class CollectResponse(BaseModel):
    """Response for /api/v1/collect endpoint."""

    page_state: PageState
    session_id: str
