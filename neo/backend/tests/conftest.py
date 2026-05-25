"""Pytest configuration."""

import sys
from pathlib import Path

import pytest

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))


@pytest.fixture
def test_db():
    """Create test database session."""
    # TODO: Add test database setup
    pass


@pytest.fixture
def client():
    """Create test client."""
    # TODO: Add test client setup
    pass
