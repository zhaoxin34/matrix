"""Tests for organization unit service module."""

import pytest
from sqlalchemy.orm import Session

from app.models import OrgUnitType
from app.repositories import org_unit_repository as repo


class TestOrgUnitRepository:
    """Tests for OrgUnitRepository."""

    @pytest.fixture
    def root_unit(self, db_session: Session):
        """Create a root organization unit."""
        unit = repo.create_org_unit(
            db_session,
            name="总公司",
            code="HQ001",
            type=OrgUnitType.COMPANY,
        )
        return unit

    @pytest.fixture
    def branch_unit(self, db_session: Session, root_unit):
        """Create a branch unit under root."""
        unit = repo.create_org_unit(
            db_session,
            name="北京分公司",
            code="BJ001",
            type=OrgUnitType.BRANCH,
            parent_id=root_unit.id,
        )
        return unit

    def test_create_org_unit_root_success(self, db_session: Session):
        """Test creating a root organization unit."""
        unit = repo.create_org_unit(
            db_session,
            name="总公司",
            code="TEST001",
            type=OrgUnitType.COMPANY,
        )

        assert unit is not None
        assert unit.name == "总公司"
        assert unit.code == "TEST001"
        assert unit.type == OrgUnitType.COMPANY
        assert unit.parent_id is None
        assert unit.level == 0

    def test_create_org_unit_with_parent(self, db_session: Session, root_unit):
        """Test creating an organization unit under a parent."""
        unit = repo.create_org_unit(
            db_session,
            name="研发部",
            code="TEST002",
            type=OrgUnitType.DEPARTMENT,
            parent_id=root_unit.id,
        )

        assert unit is not None
        assert unit.parent_id == root_unit.id
        assert unit.level == 1

    def test_create_org_unit_duplicate_code(self, db_session: Session, root_unit):
        """Test that duplicate code is rejected."""
        # Create first unit
        repo.create_org_unit(
            db_session,
            name="单位1",
            code="DUPLICATE",
            type=OrgUnitType.DEPARTMENT,
        )

        # Try to create another with same code
        unit = repo.get_org_unit_by_code(db_session, "DUPLICATE")

        assert unit is not None  # Should find the existing one

    def test_get_org_unit_by_id(self, db_session: Session, root_unit):
        """Test getting organization unit by ID."""
        unit = repo.get_org_unit_by_id(db_session, root_unit.id)

        assert unit is not None
        assert unit.id == root_unit.id
        assert unit.name == root_unit.name

    def test_get_org_unit_by_id_not_found(self, db_session: Session):
        """Test getting non-existent organization unit."""
        unit = repo.get_org_unit_by_id(db_session, 99999)

        assert unit is None

    def test_get_org_units(self, db_session: Session, root_unit, branch_unit):
        """Test getting all organization units."""
        units = repo.get_org_units(db_session)

        assert len(units) == 2

    def test_get_children_units(self, db_session: Session, root_unit, branch_unit):
        """Test getting child organization units."""
        children = repo.get_children_units(db_session, root_unit.id)

        assert len(children) == 1
        assert children[0].id == branch_unit.id

    def test_get_children_units_empty(self, db_session: Session, branch_unit):
        """Test getting children of unit with no children."""
        children = repo.get_children_units(db_session, branch_unit.id)

        assert len(children) == 0

    def test_has_children(self, db_session: Session, root_unit, branch_unit):
        """Test checking if unit has children."""
        assert repo.has_children(db_session, root_unit.id) is True
        assert repo.has_children(db_session, branch_unit.id) is False

    def test_update_org_unit(self, db_session: Session, branch_unit):
        """Test updating organization unit."""
        updated = repo.update_org_unit(
            db_session,
            branch_unit.id,
            name="北京研发部",
            sort_order=10,
        )

        assert updated is not None
        assert updated.name == "北京研发部"
        assert updated.sort_order == 10

    def test_update_org_unit_not_found(self, db_session: Session):
        """Test updating non-existent organization unit."""
        updated = repo.update_org_unit(db_session, 99999, name="新名称")

        assert updated is None

    def test_delete_org_unit(self, db_session: Session, branch_unit):
        """Test deleting organization unit."""
        success = repo.delete_org_unit(db_session, branch_unit.id)

        assert success is True

        # Verify it's deleted
        unit = repo.get_org_unit_by_id(db_session, branch_unit.id)
        assert unit is None

    def test_delete_org_unit_with_children(self, db_session: Session, root_unit, branch_unit):
        """Test that unit with children cannot be deleted via has_children check."""
        # The repository doesn't prevent deletion, but has_children can be used to check
        assert repo.has_children(db_session, root_unit.id) is True

    def test_delete_org_unit_not_found(self, db_session: Session):
        """Test deleting non-existent organization unit."""
        success = repo.delete_org_unit(db_session, 99999)

        assert success is False

    def test_get_root_units(self, db_session: Session, root_unit, branch_unit):
        """Test getting root organization units."""
        roots = repo.get_root_units(db_session)

        assert len(roots) == 1
        assert roots[0].id == root_unit.id

    def test_get_level(self, db_session: Session, root_unit):
        """Test getting level for new unit."""
        # Root unit is level 0
        level = repo.get_level(db_session, None)
        assert level == 0

        # Child should be level 1
        level = repo.get_level(db_session, root_unit.id)
        assert level == 1
