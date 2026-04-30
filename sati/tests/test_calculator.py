"""Tests for calculator module."""

import pytest

from sati.calculator import WeightCalculator
from sati.user import User, UserProfile, UserState


@pytest.fixture
def calculator() -> WeightCalculator:
    """Create a weight calculator for testing."""
    return WeightCalculator()


@pytest.fixture
def sample_user() -> User:
    """Create a sample user for testing."""
    profile = UserProfile(
        user_id="calc-test-user",
        age=30,
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
        industry=1,
        work_experience=8,
        education_level=4,
        income_monthly=20000,
        income_stable=2,
        savings_level=3,
        has_investment=1,
        spending_style=2,
        payment_preference=1,
    )
    state = UserState()
    return User(profile=profile, state=state)


class TestWeightCalculator:
    """Test WeightCalculator class."""

    def test_calc_login_weight(self, calculator: WeightCalculator, sample_user: User) -> None:
        """Login weight formula: 0.3 + 0.2 * income_stable - 0.1 * has_other_loan."""
        weight = calculator.calc_login_weight(sample_user)
        # income_stable=2, has_other_loan=0
        expected = 0.3 + 0.2 * 2 - 0.1 * 0
        assert abs(weight - expected) < 0.001
        assert weight >= 0.1  # Minimum bound

    def test_calc_login_weight_min_bound(self, calculator: WeightCalculator) -> None:
        """Login weight has minimum bound of 0.1."""
        profile = UserProfile(
            user_id="min-test",
            age=30,
            gender=1,
            marital_status=1,
            child_count=0,
            child_age_group=0,
            has_house=0,
            has_car=0,
            has_mortgage=0,
            has_car_loan=0,
            has_other_loan=10,  # High debt
            dependent_parents=0,
            occupation_type=3,
            employment_status=1,
            industry=1,
            work_experience=8,
            education_level=4,
            income_monthly=5000,
            income_stable=1,
            savings_level=1,
            has_investment=0,
            spending_style=2,
            payment_preference=1,
        )
        weight = calculator.calc_login_weight(User(profile=profile))
        assert weight >= 0.1

    def test_calc_browse_weight(self, calculator: WeightCalculator, sample_user: User) -> None:
        """Browse weight formula: 0.5 + 0.1*(work_exp/10) + 0.1*education."""
        weight = calculator.calc_browse_weight(sample_user)
        # work_experience=8, education_level=4
        expected = 0.5 + 0.1 * (8 / 10) + 0.1 * 4
        assert abs(weight - expected) < 0.001

    def test_calc_cart_weight(self, calculator: WeightCalculator, sample_user: User) -> None:
        """Cart weight formula: 0.4 * (income/10000) * (1 + 0.2*child_count)."""
        weight = calculator.calc_cart_weight(sample_user)
        # income_monthly=20000, child_count=2
        expected = 0.4 * (20000 / 10000) * (1 + 0.2 * 2)
        assert abs(weight - expected) < 0.001

    def test_calc_pay_weight(self, calculator: WeightCalculator, sample_user: User) -> None:
        """Pay weight formula: 0.6 * (savings/5) * (1/spending_style)."""
        weight = calculator.calc_pay_weight(sample_user)
        # savings_level=3, spending_style=2
        expected = 0.6 * (3 / 5) * (1 / 2)
        assert abs(weight - expected) < 0.001

    def test_calc_return_weight(self, calculator: WeightCalculator, sample_user: User) -> None:
        """Return weight formula: 0.3 + 0.1*(income_stable-1) + 0.05*(education-1)."""
        weight = calculator.calc_return_weight(sample_user)
        # income_stable=2, education_level=4
        expected = 0.3 + 0.1 * (2 - 1) + 0.05 * (4 - 1)
        assert abs(weight - expected) < 0.001

    def test_get_weight_landing_to_login(self, calculator: WeightCalculator, sample_user: User) -> None:
        """Weight for landing to login is calc_login_weight."""
        weight = calculator.get_weight(sample_user, "landing", "login")
        expected = calculator.calc_login_weight(sample_user)
        assert abs(weight - expected) < 0.001

    def test_get_weight_browse_to_cart(self, calculator: WeightCalculator, sample_user: User) -> None:
        """Weight for browse to cart is calc_cart_weight."""
        weight = calculator.get_weight(sample_user, "browse", "cart")
        expected = calculator.calc_cart_weight(sample_user)
        assert abs(weight - expected) < 0.001

    def test_get_weight_cart_to_pay(self, calculator: WeightCalculator, sample_user: User) -> None:
        """Weight for cart to pay is calc_pay_weight."""
        weight = calculator.get_weight(sample_user, "cart", "pay")
        expected = calculator.calc_pay_weight(sample_user)
        assert abs(weight - expected) < 0.001

    def test_get_weight_browse_to_landing(self, calculator: WeightCalculator, sample_user: User) -> None:
        """Weight for browse to landing is fixed 0.5."""
        weight = calculator.get_weight(sample_user, "browse", "landing")
        assert weight == 0.5

    def test_get_weight_to_exit(self, calculator: WeightCalculator, sample_user: User) -> None:
        """Weight to exit is fixed 1.0."""
        weight = calculator.get_weight(sample_user, "browse", "exit")
        assert weight == 1.0

    def test_get_weight_pay_to_landing(self, calculator: WeightCalculator, sample_user: User) -> None:
        """Weight for pay to landing is calc_return_weight."""
        weight = calculator.get_weight(sample_user, "pay", "landing")
        expected = calculator.calc_return_weight(sample_user)
        assert abs(weight - expected) < 0.001

    def test_get_weight_invalid(self, calculator: WeightCalculator, sample_user: User) -> None:
        """Invalid transition returns 0."""
        weight = calculator.get_weight(sample_user, "landing", "pay")
        assert weight == 0.0

    def test_all_weights_minimum_bound(self, calculator: WeightCalculator) -> None:
        """All calculated weights should have minimum bound of 0.1."""
        profile = UserProfile(
            user_id="min-bound-test",
            age=20,
            gender=0,
            marital_status=0,
            child_count=0,
            child_age_group=0,
            has_house=0,
            has_car=0,
            has_mortgage=0,
            has_car_loan=0,
            has_other_loan=100,  # Very high debt
            dependent_parents=0,
            occupation_type=1,
            employment_status=4,
            industry=1,
            work_experience=0,
            education_level=1,  # Low education
            income_monthly=2000,  # Low income
            income_stable=1,
            savings_level=1,
            has_investment=0,
            spending_style=4,  # High spending style (bad for pay)
            payment_preference=1,
        )
        user = User(profile=profile)

        assert calculator.calc_login_weight(user) >= 0.1
        assert calculator.calc_browse_weight(user) >= 0.1
        assert calculator.calc_cart_weight(user) >= 0.1
        assert calculator.calc_pay_weight(user) >= 0.1
        assert calculator.calc_return_weight(user) >= 0.1
