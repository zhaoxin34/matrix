"""Tests for engine module."""

import math

import pytest

from sati.engine import ActivityEngine
from sati.user import User, UserProfile, UserState


@pytest.fixture
def engine() -> ActivityEngine:
    """Create an activity engine for testing."""
    return ActivityEngine(decay_lambda=0.01)


@pytest.fixture
def user_inactive() -> User:
    """Create a user that has been inactive for a while."""
    profile = UserProfile(
        user_id="inactive-user",
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
        occupation_type=3,  # 企业职工
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
    state = UserState(last_exit_time=1000)
    return User(profile=profile, state=state)


@pytest.fixture
def user_fresh() -> User:
    """Create a user that's freshly active."""
    profile = UserProfile(
        user_id="fresh-user",
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
        occupation_type=1,  # 学生
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
    state = UserState(last_exit_time=0)  # Never exited, fresh
    return User(profile=profile, state=state)


class TestActivityEngine:
    """Test ActivityEngine class."""

    def test_init_default_decay(self) -> None:
        """Default decay lambda is set."""
        engine = ActivityEngine()
        assert engine.decay_lambda == 0.01

    def test_init_custom_decay(self) -> None:
        """Can set custom decay lambda."""
        engine = ActivityEngine(decay_lambda=0.05)
        assert engine.decay_lambda == 0.05

    def test_calc_decay_zero_time(self) -> None:
        """Zero time delta returns decay of 1."""
        decay = self._engine.calc_decay(0)
        assert decay == 1.0

    def test_calc_decay_positive_time(self) -> None:
        """Positive time delta returns exponential decay."""
        decay = self._engine.calc_decay(100)
        expected = math.exp(-0.01 * 100)
        assert abs(decay - expected) < 1e-6

    def test_calc_decay_negative_time(self) -> None:
        """Negative time delta returns decay of 1 (no decay for future)."""
        decay = self._engine.calc_decay(-50)
        assert decay == 1.0

    def test_calc_base_prob_known_occupation(self) -> None:
        """Can get base prob for known occupation."""
        prob = self._engine.calc_base_prob(3)  # 企业职工
        assert prob == 0.75

    def test_calc_base_prob_unknown_occupation(self) -> None:
        """Unknown occupation returns default 0.5."""
        prob = self._engine.calc_base_prob(99)
        assert prob == 0.5

    def test_get_time_multiplier_high_active(self) -> None:
        """Within active hours returns high multiplier."""
        # 企业职工 active 12-13
        mult = self._engine.get_time_multiplier(12, 3)
        assert mult == 1.2

    def test_get_time_multiplier_normal(self) -> None:
        """Normal hours return normal multiplier."""
        # 企业职工 active 12-13, so 14 should be normal
        mult = self._engine.get_time_multiplier(14, 3)
        assert mult == 1.0

    def test_get_time_multiplier_low_late_night(self) -> None:
        """Late night returns low multiplier."""
        # Before 6am is low
        mult = self._engine.get_time_multiplier(3, 3)
        assert mult == 0.3

    def test_get_time_multiplier_low_very_late(self) -> None:
        """Very late night returns low multiplier."""
        mult = self._engine.get_time_multiplier(23, 3)
        assert mult == 0.3

    def test_calc_activity_probability_fresh_user(self, engine: ActivityEngine, user_fresh: User) -> None:
        """Fresh user (no exit time) has no decay."""
        # Fresh user with no last_exit_time
        prob = engine.calc_activity_probability(user_fresh, current_time=10000)
        # Should be base_prob * time_mult, no decay
        assert prob > 0

    def test_calc_activity_probability_inactive_user(self, engine: ActivityEngine, user_inactive: User) -> None:
        """Inactive user has reduced probability due to decay."""
        current_time = 1000 + 1000 * 60  # 1000 minutes after exit
        prob = engine.calc_activity_probability(user_inactive, current_time=current_time)

        # Decay should significantly reduce probability
        base = engine.calc_base_prob(user_inactive.profile.occupation_type)
        assert prob < base

    def test_calc_activity_probability_bounded(self, engine: ActivityEngine, user_fresh: User) -> None:
        """Activity probability is bounded between 0 and 1."""
        prob = engine.calc_activity_probability(user_fresh, current_time=1000)
        assert 0 <= prob <= 1

    def test_is_active(self, engine: ActivityEngine, user_fresh: User) -> None:
        """is_active returns a boolean."""
        result = engine.is_active(user_fresh, current_time=1000)
        assert isinstance(result, bool)

    def test_high_active_hours_defined(self, engine: ActivityEngine) -> None:
        """All occupations have defined active hours."""
        for occ_type in range(1, 7):
            assert occ_type in engine.HIGH_ACTIVE_HOURS

    @property
    def _engine(self) -> ActivityEngine:
        """Get engine for class-level tests."""
        return ActivityEngine(decay_lambda=0.01)
