"""Pytest configuration."""

import os
import sys
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

# Create SQLite file-based engine for testing (in-memory doesn't support autoincrement with BigInteger)
TEST_DATABASE_URL = "sqlite:///./test.db"

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


@pytest.fixture
def test_admin_user(db_session: Session) -> User:
    """Create a test admin user."""
    from app.services.auth_service import hash_password

    user = User(
        phone="13800138004",
        hashed_password=hash_password("abcd1234"),
        username="admin_user",
        is_admin=True,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_org_unit(db_session: Session):
    """Create a test organization unit."""
    from app.models import OrganizationUnit, OrgUnitType

    org = OrganizationUnit(
        name="测试公司",
        code="test_company",
        type=OrgUnitType.COMPANY,
        level=0,
    )
    db_session.add(org)
    db_session.commit()
    db_session.refresh(org)
    return org


@pytest.fixture
def test_workspace(db_session: Session, test_user, test_org_unit):
    """Create a test workspace with owner as member."""
    from app.models import MemberRole, Workspace, WorkspaceMember, WorkspaceStatus

    workspace = Workspace(
        name="测试工作空间",
        code="test_workspace",
        description="测试用工作空间",
        status=WorkspaceStatus.ACTIVE,
        org_id=test_org_unit.id,
        owner_id=test_user.id,
    )
    db_session.add(workspace)
    db_session.flush()

    # Create owner member record
    owner_member = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=test_user.id,
        role=MemberRole.OWNER,
    )
    db_session.add(owner_member)
    db_session.commit()
    db_session.refresh(workspace)
    return workspace


@pytest.fixture
def test_workspace_member(db_session: Session, test_user, test_workspace):
    """Get the owner member of the test workspace."""
    from app.models import WorkspaceMember

    member = (
        db_session.query(WorkspaceMember)
        .filter(
            WorkspaceMember.workspace_id == test_workspace.id,
            WorkspaceMember.user_id == test_user.id,
        )
        .first()
    )
    return member
