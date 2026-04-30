"""Tests for generator module."""

from sati.generator import INDUSTRY_WEIGHTS, OCCUPATION_WEIGHTS, UserGenerator
from sati.user import User


class TestUserGenerator:
    """Test UserGenerator class."""

    def test_init_with_seed(self) -> None:
        """Generator can be initialized with a seed."""
        gen = UserGenerator(seed=42)
        assert gen.rng is not None

    def test_init_without_seed(self) -> None:
        """Generator can be initialized without a seed."""
        gen = UserGenerator()
        assert gen.rng is not None

    def test_generate_profile_fields(self) -> None:
        """Generated profile has all required fields."""
        gen = UserGenerator(seed=42)
        profile = gen.generate_profile()

        assert profile.user_id is not None
        assert 18 <= profile.age <= 65
        assert profile.gender in [0, 1]
        assert profile.marital_status in [0, 1, 2, 3]
        assert profile.child_count >= 0
        assert profile.occupation_type in OCCUPATION_WEIGHTS
        assert profile.industry in INDUSTRY_WEIGHTS
        assert profile.income_monthly >= 2000
        assert 1 <= profile.spending_style <= 4
        assert 1 <= profile.payment_preference <= 4

    def test_generate_profile_reproducible(self) -> None:
        """Same seed produces same profile."""
        gen1 = UserGenerator(seed=123)
        gen2 = UserGenerator(seed=123)

        profile1 = gen1.generate_profile()
        profile2 = gen2.generate_profile()

        assert profile1.age == profile2.age
        assert profile1.occupation_type == profile2.occupation_type
        assert profile1.income_monthly == profile2.income_monthly

    def test_generate_user(self) -> None:
        """Can generate a complete user."""
        gen = UserGenerator(seed=42)
        user = gen.generate_user()

        assert user.profile is not None
        assert user.state is not None
        assert user.state.current_state == "landing"
        assert user.state.session_count == 0

    def test_generate_users_batch(self) -> None:
        """Can generate multiple users at once."""
        gen = UserGenerator(seed=42)
        users = gen.generate_users(5)

        assert len(users) == 5
        for user in users:
            assert isinstance(user, User)
            assert user.profile.user_id is not None

    def test_users_have_unique_ids(self) -> None:
        """Generated users have unique IDs."""
        gen = UserGenerator(seed=42)
        users = gen.generate_users(10)

        user_ids = [u.profile.user_id for u in users]
        assert len(set(user_ids)) == 10

    def test_marital_status_correlates_with_age(self) -> None:
        """Marital status correlates with age."""
        gen = UserGenerator(seed=42)
        young_profile = gen.generate_profile()

        # Young users (<25) should always be unmarried
        if young_profile.age < 25:
            assert young_profile.marital_status == 0

    def test_child_count_correlates_with_marital_status(self) -> None:
        """Child count should be 0 for unmarried users."""
        gen = UserGenerator(seed=42)
        profile = gen.generate_profile()

        if profile.marital_status == 0:
            assert profile.child_count == 0

    def test_student_employment_status(self) -> None:
        """Students should have unemployment status."""
        gen = UserGenerator(seed=100)
        profile = gen.generate_profile()

        if profile.occupation_type == 1:  # Student
            assert profile.employment_status == 4

    def test_retired_employment_status(self) -> None:
        """Retired users should have unemployment status."""
        gen = UserGenerator(seed=100)
        profile = gen.generate_profile()

        if profile.occupation_type == 6:  # Retired
            assert profile.employment_status == 4

    def test_work_experience_correlates_with_age(self) -> None:
        """Work experience should correlate with age."""
        gen = UserGenerator(seed=42)
        profile = gen.generate_profile()

        if profile.occupation_type not in [1, 6]:  # Not student or retired
            assert profile.work_experience >= 0
            assert profile.work_experience <= profile.age
