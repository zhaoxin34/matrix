"""Tests for user module."""

from sati.user import User, UserProfile, UserState


class TestUserProfile:
    """Test UserProfile dataclass."""

    def test_create_profile(self) -> None:
        """Can create a user profile with all fields."""
        profile = UserProfile(
            user_id="test-123",
            age=30,
            gender=1,
            marital_status=1,
            child_count=1,
            child_age_group=2,
            has_house=2,
            has_car=1,
            has_mortgage=0,
            has_car_loan=1,
            has_other_loan=0,
            dependent_parents=2,
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
        assert profile.user_id == "test-123"
        assert profile.age == 30
        assert profile.income_monthly == 15000

    def test_to_dict(self) -> None:
        """Profile can be converted to dictionary."""
        profile = UserProfile(
            user_id="test-456",
            age=25,
            gender=0,
            marital_status=0,
            child_count=0,
            child_age_group=0,
            has_house=0,
            has_car=0,
            has_mortgage=0,
            has_car_loan=0,
            has_other_loan=0,
            dependent_parents=0,
            occupation_type=1,
            employment_status=4,
            industry=1,
            work_experience=0,
            education_level=3,
            income_monthly=3000,
            income_stable=1,
            savings_level=1,
            has_investment=0,
            spending_style=1,
            payment_preference=1,
        )
        d = profile.to_dict()
        assert d["user_id"] == "test-456"
        assert d["age"] == 25
        assert len(d) == 23  # 23 fields total


class TestUserState:
    """Test UserState dataclass."""

    def test_default_state(self) -> None:
        """Default state should have expected values."""
        state = UserState()
        assert state.last_active_time == 0
        assert state.last_exit_time == 0
        assert state.session_count == 0
        assert state.current_state == "landing"

    def test_custom_state(self) -> None:
        """Can create state with custom values."""
        state = UserState(
            last_active_time=1000,
            last_exit_time=500,
            session_count=5,
            current_state="pay",
        )
        assert state.last_active_time == 1000
        assert state.session_count == 5
        assert state.current_state == "pay"

    def test_to_dict(self) -> None:
        """State can be converted to dictionary."""
        state = UserState(current_state="browse")
        d = state.to_dict()
        assert d["current_state"] == "browse"
        assert len(d) == 5  # 5 fields: last_active_time, last_exit_time, session_count, current_state, current_page_state


class TestUser:
    """Test User dataclass."""

    def test_create_user(self) -> None:
        """Can create a user with profile and state."""
        profile = UserProfile(
            user_id="user-001",
            age=35,
            gender=1,
            marital_status=1,
            child_count=2,
            child_age_group=3,
            has_house=1,
            has_car=2,
            has_mortgage=1,
            has_car_loan=0,
            has_other_loan=0,
            dependent_parents=1,
            occupation_type=3,
            employment_status=1,
            industry=2,
            work_experience=10,
            education_level=5,
            income_monthly=25000,
            income_stable=3,
            savings_level=4,
            has_investment=1,
            spending_style=2,
            payment_preference=2,
        )
        state = UserState(current_state="cart")
        user = User(profile=profile, state=state)
        assert user.profile.age == 35
        assert user.state.current_state == "cart"

    def test_user_default_state(self) -> None:
        """User can be created with only profile, default state is used."""
        profile = UserProfile(
            user_id="user-002",
            age=28,
            gender=0,
            marital_status=0,
            child_count=0,
            child_age_group=0,
            has_house=0,
            has_car=0,
            has_mortgage=0,
            has_car_loan=0,
            has_other_loan=0,
            dependent_parents=0,
            occupation_type=1,
            employment_status=4,
            industry=1,
            work_experience=0,
            education_level=4,
            income_monthly=3000,
            income_stable=1,
            savings_level=1,
            has_investment=0,
            spending_style=1,
            payment_preference=1,
        )
        user = User(profile=profile)
        assert user.state.current_state == "landing"

    def test_to_dict(self) -> None:
        """User can be converted to dictionary."""
        profile = UserProfile(
            user_id="user-003",
            age=40,
            gender=1,
            marital_status=1,
            child_count=1,
            child_age_group=1,
            has_house=2,
            has_car=2,
            has_mortgage=0,
            has_car_loan=0,
            has_other_loan=0,
            dependent_parents=2,
            occupation_type=2,
            employment_status=1,
            industry=3,
            work_experience=15,
            education_level=5,
            income_monthly=20000,
            income_stable=3,
            savings_level=4,
            has_investment=1,
            spending_style=3,
            payment_preference=1,
        )
        user = User(profile=profile)
        d = user.to_dict()
        assert "profile" in d
        assert "state" in d
        assert d["profile"]["user_id"] == "user-003"
