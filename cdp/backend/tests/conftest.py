"""Test configuration and fixtures."""

import pytest
from unittest.mock import MagicMock, patch, Mock
from datetime import datetime, date

from app.models.user import User
from app.models.employee import Employee, EmployeeStatus
from app.models.org_unit import OrganizationUnit, OrgUnitType, OrgUnitStatus
from app.models.org_unit_closure import OrgUnitClosure
from app.models.skill import Skill, SkillLevel
from app.models.user_employee_mapping import UserEmployeeMapping


@pytest.fixture
def mock_settings():
    """Mock settings object."""
    settings = MagicMock()
    settings.SECRET_KEY = "test-secret-key-for-testing"
    settings.ALGORITHM = "HS256"
    settings.ACCESS_TOKEN_EXPIRE_MINUTES = 30
    return settings


@pytest.fixture
def sample_user():
    """Create a sample user dict-like mock."""
    user = MagicMock(spec=User)
    user.id = 1
    user.username = "testuser"
    user.email = "test@example.com"
    user.phone = "13800138000"
    user.hashed_password = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X.VQaQGzL9kXqYWK2"
    user.is_admin = False
    user.is_active = True
    return user


@pytest.fixture
def sample_admin_user():
    """Create a sample admin user."""
    user = MagicMock(spec=User)
    user.id = 2
    user.username = "admin"
    user.email = "admin@example.com"
    user.phone = "13800138001"
    user.hashed_password = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X.VQaQGzL9kXqYWK2"
    user.is_admin = True
    user.is_active = True
    return user


@pytest.fixture
def sample_org_unit():
    """Create a sample organization unit."""
    unit = MagicMock(spec=OrganizationUnit)
    unit.id = 1
    unit.name = "研发部"
    unit.code = "DEV"
    unit.type = OrgUnitType.department
    unit.parent_id = None
    unit.level = 1
    unit.status = OrgUnitStatus.active
    unit.sort_order = 1
    return unit


@pytest.fixture
def sample_child_org_unit(sample_org_unit):
    """Create a child organization unit."""
    unit = MagicMock(spec=OrganizationUnit)
    unit.id = 2
    unit.name = "前端组"
    unit.code = "FE"
    unit.type = OrgUnitType.sub_department
    unit.parent_id = sample_org_unit.id
    unit.level = 2
    unit.status = OrgUnitStatus.active
    unit.sort_order = 1
    return unit


@pytest.fixture
def sample_employee(sample_org_unit):
    """Create a sample employee."""
    employee = MagicMock(spec=Employee)
    employee.id = 1
    employee.employee_no = "E001"
    employee.name = "张三"
    employee.phone = "13900139000"
    employee.email = "zhangsan@example.com"
    employee.position = "工程师"
    employee.primary_unit_id = sample_org_unit.id
    employee.status = EmployeeStatus.on_job
    employee.entry_date = date.today()
    employee.secondary_units = []
    employee.user_mapping = None
    return employee


@pytest.fixture
def sample_skill():
    """Create a sample skill."""
    skill = MagicMock(spec=Skill)
    skill.id = 1
    skill.code = "python"
    skill.name = "Python"
    skill.level = SkillLevel.Functional
    skill.tags = ["编程", "后端"]
    skill.author = "测试"
    skill.content = "Python 技能描述"
    skill.is_active = True
    skill.deleted_at = None
    return skill


@pytest.fixture
def mock_db():
    """Create a mock database session."""
    return MagicMock()


@pytest.fixture
def mock_skill_repo():
    """Mock SkillRepository."""
    return MagicMock()


@pytest.fixture
def mock_org_unit_repo():
    """Mock OrgUnitRepository."""
    return MagicMock()


@pytest.fixture
def mock_employee_repo():
    """Mock EmployeeRepository."""
    return MagicMock()