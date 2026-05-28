"""Tests for total_member_count in org unit tree."""

import pytest
from sqlalchemy.orm import Session

from app.models import OrgUnitType
from app.repositories import employee_repository as emp_repo
from app.repositories import org_unit_repository as repo
from app.services.org_unit_service import OrgUnitService


class TestTotalMemberCount:
    """Tests for total_member_count feature."""

    @pytest.fixture
    def root_unit(self, db_session: Session):
        """Create a root organization unit (总公司)."""
        unit = repo.create_org_unit(
            db_session,
            name="总公司",
            code="HQ001",
            type=OrgUnitType.COMPANY,
        )
        return unit

    @pytest.fixture
    def branch_unit(self, db_session: Session, root_unit):
        """Create a branch unit (北京分公司)."""
        unit = repo.create_org_unit(
            db_session,
            name="北京分公司",
            code="BJ001",
            type=OrgUnitType.BRANCH,
            parent_id=root_unit.id,
        )
        return unit

    @pytest.fixture
    def dept_unit(self, db_session: Session, branch_unit):
        """Create a department unit (研发部)."""
        unit = repo.create_org_unit(
            db_session,
            name="研发部",
            code="RD001",
            type=OrgUnitType.DEPARTMENT,
            parent_id=branch_unit.id,
        )
        return unit

    def test_tree_total_member_count_includes_employees(self, db_session: Session, root_unit, branch_unit, dept_unit):
        """Test that total_member_count includes employees in the unit."""
        # Create employees
        emp_repo.create_employee(
            db_session,
            employee_no="EMP001",
            name="员工1",
            phone="13800000001",
            primary_unit_id=root_unit.id,
        )
        emp_repo.create_employee(
            db_session,
            employee_no="EMP002",
            name="员工2",
            phone="13800000002",
            primary_unit_id=branch_unit.id,
        )
        emp_repo.create_employee(
            db_session,
            employee_no="EMP003",
            name="员工3",
            phone="13800000003",
            primary_unit_id=dept_unit.id,
        )

        # Get tree
        tree = OrgUnitService.get_org_unit_tree(db_session)

        root_in_tree = next((u for u in tree if u["id"] == root_unit.id), None)
        assert root_in_tree is not None

        # Root should include all 3 employees (itself + descendants)
        assert root_in_tree["total_member_count"] == 3

    def test_tree_total_member_count_includes_descendants(self, db_session: Session, root_unit, branch_unit, dept_unit):
        """Test that total_member_count includes employees in descendant units."""
        # Only add employee to department
        emp_repo.create_employee(
            db_session,
            employee_no="EMP001",
            name="员工1",
            phone="13800000001",
            primary_unit_id=dept_unit.id,
        )

        tree = OrgUnitService.get_org_unit_tree(db_session)

        root_in_tree = next((u for u in tree if u["id"] == root_unit.id), None)
        assert root_in_tree is not None
        # Root should include 1 (descendant count)
        assert root_in_tree["total_member_count"] == 1

        branch_in_tree = next((u for u in tree[0]["children"] if u["id"] == branch_unit.id), None)
        assert branch_in_tree is not None
        # Branch should include 1 (descendant count)
        assert branch_in_tree["total_member_count"] == 1

        children = branch_in_tree["children"]
        dept_in_tree = next((u for u in children if u["id"] == dept_unit.id), None)
        assert dept_in_tree is not None
        # Dept should include 1 (itself)
        assert dept_in_tree["total_member_count"] == 1

    def test_tree_total_member_count_empty_unit(self, db_session: Session, root_unit):
        """Test that total_member_count is 0 for empty unit."""
        tree = OrgUnitService.get_org_unit_tree(db_session)

        root_in_tree = next((u for u in tree if u["id"] == root_unit.id), None)
        assert root_in_tree is not None
        assert root_in_tree["total_member_count"] == 0

    def test_tree_total_member_count_zero_when_all_deleted(self, db_session: Session, root_unit):
        """Test that deleted employees are not counted."""
        # Create and then soft delete employee
        emp = emp_repo.create_employee(
            db_session,
            employee_no="EMP001",
            name="员工1",
            phone="13800000001",
            primary_unit_id=root_unit.id,
        )
        emp_repo.soft_delete_employee(db_session, int(emp.id))

        tree = OrgUnitService.get_org_unit_tree(db_session)

        root_in_tree = next((u for u in tree if u["id"] == root_unit.id), None)
        # Should be 0 because employee is deleted
        assert root_in_tree is not None
        assert root_in_tree["total_member_count"] == 0
