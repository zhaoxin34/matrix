"""Session management and state machine for user behavior tracking."""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

from app.schemas.collect import PageAttributes


class UserState(str, Enum):
    """User states following sati/DESIGN.md state machine."""

    LANDING = "landing"
    LOGIN = "login"
    BROWSE = "browse"
    CART = "cart"
    PAY = "pay"
    EXIT = "exit"


# State transition matrix (1 = allowed, 0 = not allowed)
# Rows: current_state, Columns: next_state
# Order: LANDING, LOGIN, BROWSE, CART, PAY, EXIT
TRANSITION_MATRIX = {
    UserState.LANDING: {UserState.LOGIN: 1, UserState.BROWSE: 1, UserState.EXIT: 1},
    UserState.LOGIN: {UserState.BROWSE: 1, UserState.EXIT: 1},
    UserState.BROWSE: {UserState.LANDING: 1, UserState.CART: 1, UserState.EXIT: 1},
    UserState.CART: {UserState.LANDING: 1, UserState.BROWSE: 1, UserState.PAY: 1, UserState.EXIT: 1},
    UserState.PAY: {UserState.LANDING: 1, UserState.EXIT: 1},
    UserState.EXIT: {},
}


# Page state weight factors (W_page)
PAGE_STATE_WEIGHTS = {
    ("homepage", "browse"): 1.0,
    ("red_packet", "browse"): 1.2,
    ("coupon", "browse"): 1.1,
    ("product_list", "browse"): 1.0,
    ("product_detail", "add_cart"): 1.5,
    ("product_detail", "browse"): 0.8,
    ("cart_page", "payment"): 1.3,
    ("payment_page", "exit"): 1.2,
    ("login_page", "browse"): 0.5,
}


# Fixed transition weights (not dependent on user features)
FIXED_WEIGHTS = {
    (UserState.LANDING, UserState.LOGIN): 0.4,
    (UserState.LANDING, UserState.BROWSE): 0.4,
    (UserState.LANDING, UserState.EXIT): 0.6,
    (UserState.LOGIN, UserState.BROWSE): 0.4,
    (UserState.LOGIN, UserState.EXIT): 0.6,
    (UserState.BROWSE, UserState.LANDING): 0.3,
    (UserState.BROWSE, UserState.CART): 0.6,
    (UserState.BROWSE, UserState.EXIT): 0.4,
    (UserState.CART, UserState.LANDING): 0.3,
    (UserState.CART, UserState.BROWSE): 0.4,
    (UserState.CART, UserState.PAY): 2.0,
    (UserState.CART, UserState.EXIT): 0.5,
    (UserState.PAY, UserState.LANDING): 0.4,
    (UserState.PAY, UserState.EXIT): 1.2,
}


# Page subtype definitions
PAGE_SUBTYPES = {
    UserState.LANDING: ["homepage", "red_packet", "coupon"],
    UserState.LOGIN: ["login_page"],
    UserState.BROWSE: ["product_list", "product_detail"],
    UserState.CART: ["cart_page"],
    UserState.PAY: ["payment_page"],
    UserState.EXIT: [""],
}


@dataclass
class UserSession:
    """User session data stored in memory."""

    session_id: str
    user_id: str | None = None
    current_state: UserState = UserState.LANDING
    current_page_subtype: str = "homepage"
    current_page_attributes: PageAttributes = field(default_factory=PageAttributes)
    last_active_time: datetime = field(default_factory=datetime.utcnow)
    last_action: str = ""
    action_history: list[dict] = field(default_factory=list)

    def update_state(
        self, new_state: UserState, page_subtype: str = "", page_attributes: PageAttributes | None = None
    ) -> None:
        """Update session state after an action."""
        self.current_state = new_state
        if page_subtype:
            self.current_page_subtype = page_subtype
        if page_attributes:
            self.current_page_attributes = page_attributes
        self.last_active_time = datetime.utcnow()


class SessionManager:
    """In-memory session manager."""

    def __init__(self) -> None:
        self._sessions: dict[str, UserSession] = {}

    def get_or_create_session(self, session_id: str, user_id: str | None = None) -> UserSession:
        """Get existing session or create a new one."""
        if session_id not in self._sessions:
            self._sessions[session_id] = UserSession(
                session_id=session_id,
                user_id=user_id,
                current_state=UserState.LANDING,
                current_page_subtype="homepage",
            )
        return self._sessions[session_id]

    def get_session(self, session_id: str) -> UserSession | None:
        """Get session by ID."""
        return self._sessions.get(session_id)

    def update_session(self, session: UserSession) -> None:
        """Update session in store."""
        self._sessions[session.session_id] = session


# Global session manager instance
session_manager = SessionManager()
