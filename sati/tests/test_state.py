"""Tests for state module."""

import pytest

from sati.state import StateMachine
from sati.user import User, UserProfile, UserState


@pytest.fixture
def state_machine() -> StateMachine:
    """Create a state machine for testing."""
    return StateMachine()


@pytest.fixture
def sample_user() -> User:
    """Create a sample user for testing."""
    profile = UserProfile(
        user_id="test-user",
        age=30,
        gender=1,
        marital_status=1,
        child_count=1,
        child_age_group=2,
        has_house=1,
        has_car=1,
        has_mortgage=1,
        has_car_loan=1,
        has_other_loan=0,
        dependent_parents=1,
        occupation_type=3,
        employment_status=1,
        industry=1,
        work_experience=8,
        education_level=4,
        income_monthly=15000,
        income_stable=2,
        savings_level=3,
        has_investment=1,
        spending_style=2,
        payment_preference=1,
    )
    state = UserState(current_state="landing")
    return User(profile=profile, state=state)


class TestStateMachine:
    """Test StateMachine class."""

    def test_get_allowed_states_landing(self, state_machine: StateMachine) -> None:
        """Landing state allows login, browse, exit."""
        allowed = state_machine.get_allowed_states("landing")
        assert set(allowed) == {"login", "browse", "exit"}

    def test_get_allowed_states_login(self, state_machine: StateMachine) -> None:
        """Login state allows browse, exit."""
        allowed = state_machine.get_allowed_states("login")
        assert set(allowed) == {"browse", "exit"}

    def test_get_allowed_states_browse(self, state_machine: StateMachine) -> None:
        """Browse state allows landing, browse, cart, exit."""
        allowed = state_machine.get_allowed_states("browse")
        assert set(allowed) == {"landing", "browse", "cart", "exit"}

    def test_get_allowed_states_cart(self, state_machine: StateMachine) -> None:
        """Cart state allows landing, browse, pay, exit."""
        allowed = state_machine.get_allowed_states("cart")
        assert set(allowed) == {"landing", "browse", "pay", "exit"}

    def test_get_allowed_states_pay(self, state_machine: StateMachine) -> None:
        """Pay state allows landing, exit."""
        allowed = state_machine.get_allowed_states("pay")
        assert set(allowed) == {"landing", "exit"}

    def test_get_allowed_states_exit(self, state_machine: StateMachine) -> None:
        """Exit state has no allowed transitions."""
        allowed = state_machine.get_allowed_states("exit")
        assert allowed == []

    def test_get_allowed_states_unknown(self, state_machine: StateMachine) -> None:
        """Unknown state returns empty list."""
        allowed = state_machine.get_allowed_states("unknown")
        assert allowed == []

    def test_is_valid_transition_valid(self, state_machine: StateMachine) -> None:
        """Valid transitions return True."""
        assert state_machine.is_valid_transition("landing", "login") is True
        assert state_machine.is_valid_transition("browse", "cart") is True
        assert state_machine.is_valid_transition("cart", "pay") is True

    def test_is_valid_transition_invalid(self, state_machine: StateMachine) -> None:
        """Invalid transitions return False."""
        assert state_machine.is_valid_transition("landing", "pay") is False
        assert state_machine.is_valid_transition("login", "cart") is False
        assert state_machine.is_valid_transition("pay", "browse") is False

    def test_get_transition_weight_valid(self, state_machine: StateMachine) -> None:
        """Valid transition returns the weight."""
        weight = state_machine.get_transition_weight("browse", "cart", 0.5)
        assert weight == 0.5

    def test_get_transition_weight_invalid(self, state_machine: StateMachine) -> None:
        """Invalid transition returns 0."""
        weight = state_machine.get_transition_weight("landing", "pay", 0.5)
        assert weight == 0.0

    def test_transition_success(self, state_machine: StateMachine, sample_user: User) -> None:
        """Valid transition updates user state."""
        sample_user.state.current_state = "landing"
        result = state_machine.transition(sample_user, "browse")

        assert result is True
        assert sample_user.state.current_state == "browse"

    def test_transition_failure(self, state_machine: StateMachine, sample_user: User) -> None:
        """Invalid transition returns False and doesn't change state."""
        sample_user.state.current_state = "landing"
        result = state_machine.transition(sample_user, "pay")

        assert result is False
        assert sample_user.state.current_state == "landing"

    def test_transition_to_exit(self, state_machine: StateMachine, sample_user: User) -> None:
        """Can transition to exit state."""
        sample_user.state.current_state = "browse"
        result = state_machine.transition(sample_user, "exit")

        assert result is True
        assert sample_user.state.current_state == "exit"
