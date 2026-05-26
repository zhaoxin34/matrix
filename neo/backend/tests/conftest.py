"""Pytest configuration."""

import os
import sys
from datetime import timedelta
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

# Set test environment before importing app modules
os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-testing"
os.environ["DEBUG"] = "true"

from app.database import Base
from app.models.user import User


# Create SQLite in-memory engine for testing
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)

TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_session() -> Session:
    """Create test database session with fresh tables for each test."""
    # Create all tables
    Base.metadata.create_all(bind=test_engine)
    
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.close()
        # Drop all tables after test
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def test_user(db_session: Session) -> User:
    """Create a test user."""
    from app.services.auth_service import hash_password
    
    user = User(
        phone="13800138002",
        hashed_password=hash_password("abcd1234"),
        username="testuser",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_user_inactive(db_session: Session) -> User:
    """Create an inactive test user."""
    from app.services.auth_service import hash_password
    
    user = User(
        phone="13800138003",
        hashed_password=hash_password("abcd1234"),
        username="inactive_user",
        is_active=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user
