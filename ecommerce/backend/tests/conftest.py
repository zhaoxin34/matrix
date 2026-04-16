"""Test configuration and fixtures."""

import os
import sys
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

import pytest

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

# Set test environment before importing app modules
os.environ["SECRET_KEY"] = "test-secret-key-for-testing-only"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "30"
os.environ["REFRESH_TOKEN_EXPIRE_DAYS"] = "7"


@pytest.fixture
def mock_db():
    """Create a mock database session."""
    db = MagicMock()
    return db


@pytest.fixture
def sample_user():
    """Create a sample user mock with hashed password."""
    user = MagicMock()
    user.id = 1
    user.username = "testuser"
    user.phone = "13800138000"
    user.email = "test@example.com"
    user.hashed_password = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.F1mVrS1I/FgP8K"  # "Test1234"
    user.failed_login_attempts = 0
    user.locked_until = None
    user.sms_code = None
    user.sms_code_expires_at = None
    user.password_history = None
    return user
