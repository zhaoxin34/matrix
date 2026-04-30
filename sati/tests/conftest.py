"""Shared test fixtures."""

import pytest

from sati.generator import UserGenerator
from sati.user import User


@pytest.fixture
def user_generator() -> UserGenerator:
    """Create a user generator with fixed seed for reproducibility."""
    return UserGenerator(seed=42)


@pytest.fixture
def sample_user(user_generator: UserGenerator) -> User:
    """Create a sample user for testing."""
    return user_generator.generate_user()


@pytest.fixture
def user_with_state(user_generator: UserGenerator) -> User:
    """Create a user with non-zero state for testing."""
    user = user_generator.generate_user()
    user.state.last_active_time = 1000
    user.state.last_exit_time = 500
    user.state.session_count = 2
    user.state.current_state = "browse"
    return user
