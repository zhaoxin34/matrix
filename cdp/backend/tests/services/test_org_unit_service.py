"""Tests for OrgUnitService."""

import pytest
from unittest.mock import MagicMock, patch
from fastapi import HTTPException

from app.services.org_unit_service import OrgUnitService
from app.models.org_unit import OrganizationUnit, OrgUnitType, OrgUnitStatus
from app.schemas.org_unit import OrgUnitCreate, OrgUnitUpdate, OrgUnitMove


class TestOrgUnitService:
    """Test OrgUnitService class."""

    def test_get_unit_found(self, mock_db, sample_org_unit):
        """Test getting existing organization unit."""
        service = OrgUnitService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_id.return_value = sample_org_unit

        unit = service.get_unit(sample_org_unit.id)

        assert unit is not None
        assert unit.id == sample_org_unit.id
        assert unit.name == "研发部"

    def test_get_unit_not_found(self, mock_db):
        """Test getting non-existent organization unit raises error."""
        service = OrgUnitService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_id.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            service.get_unit(9999)

        assert exc_info.value.status_code == 404
        assert "组织单元不存在" in exc_info.value.detail

    def test_get_tree(self, mock_db, sample_org_unit, sample_child_org_unit):
        """Test getting organization tree."""
        service = OrgUnitService(mock_db)
        service.repo = MagicMock()
        service.repo.find_all.return_value = [sample_org_unit, sample_child_org_unit]
        service.repo.count_direct_employees.return_value = 1
        service.repo.count_total_employees.return_value = 1

        tree = service.get_tree()

        assert tree is not None
        assert len(tree) >= 1

    def test_create_unit(self, mock_db):
        """Test creating a new organization unit."""
        service = OrgUnitService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_code.return_value = None

        created_unit = MagicMock()
        created_unit.name = "测试部门"
        created_unit.code = "TEST"
        created_unit.level = 1
        service.repo.create.return_value = created_unit

        data = OrgUnitCreate(
            name="测试部门",
            code="TEST",
            type=OrgUnitType.department,
            parent_id=None,
            sort_order=1,
        )

        unit = service.create_unit(data)

        assert unit is not None
        assert unit.name == "测试部门"
        service.repo.create.assert_called_once()

    def test_create_unit_with_parent(self, mock_db, sample_org_unit):
        """Test creating organization unit with parent."""
        service = OrgUnitService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_code.return_value = None
        service.repo.find_by_id.return_value = sample_org_unit
        service.repo.create.return_value = MagicMock(
            name="子部门", code="SUB", parent_id=sample_org_unit.id, level=2
        )

        data = OrgUnitCreate(
            name="子部门",
            code="SUB",
            type=OrgUnitType.sub_department,
            parent_id=sample_org_unit.id,
            sort_order=1,
        )

        unit = service.create_unit(data)

        assert unit is not None
        assert unit.parent_id == sample_org_unit.id

    def test_create_unit_duplicate_code(self, mock_db, sample_org_unit):
        """Test creating unit with duplicate code raises error."""
        service = OrgUnitService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_code.return_value = sample_org_unit

        data = OrgUnitCreate(
            name="重复部门",
            code="DEV",  # Same as sample_org_unit
            type=OrgUnitType.department,
            parent_id=None,
            sort_order=1,
        )

        with pytest.raises(HTTPException) as exc_info:
            service.create_unit(data)

        assert exc_info.value.status_code == 400

    def test_update_unit(self, mock_db, sample_org_unit):
        """Test updating an organization unit."""
        service = OrgUnitService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_id.return_value = sample_org_unit
        service.repo.update.return_value = sample_org_unit

        data = OrgUnitUpdate(name="研发部更新", sort_order=2)

        unit = service.update_unit(sample_org_unit.id, data)

        assert unit is not None
        assert sample_org_unit.name == "研发部更新"

    def test_update_unit_change_code(self, mock_db, sample_org_unit):
        """Test updating unit code."""
        service = OrgUnitService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_id.return_value = sample_org_unit
        service.repo.find_by_code.return_value = None
        service.repo.update.return_value = sample_org_unit

        data = OrgUnitUpdate(code="DEV_NEW")

        unit = service.update_unit(sample_org_unit.id, data)

        assert unit is not None

    def test_delete_unit_no_children(self, mock_db, sample_child_org_unit):
        """Test deleting unit with no children."""
        service = OrgUnitService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_id.return_value = sample_child_org_unit
        service.repo.find_children.return_value = []
        service.repo.count_direct_employees.return_value = 0
        service.repo.delete = MagicMock()

        service.delete_unit(sample_child_org_unit.id)

        service.repo.delete.assert_called_once()

    def test_delete_unit_has_children(self, mock_db, sample_org_unit, sample_child_org_unit):
        """Test deleting unit with children raises error."""
        service = OrgUnitService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_id.return_value = sample_org_unit
        service.repo.find_children.return_value = [sample_child_org_unit]

        with pytest.raises(HTTPException) as exc_info:
            service.delete_unit(sample_org_unit.id)

        assert exc_info.value.status_code == 400
        assert "请先删除所有子节点" in exc_info.value.detail

    def test_delete_unit_has_employees(self, mock_db, sample_org_unit):
        """Test deleting unit with employees raises error."""
        service = OrgUnitService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_id.return_value = sample_org_unit
        service.repo.find_children.return_value = []
        service.repo.count_direct_employees.return_value = 5

        with pytest.raises(HTTPException) as exc_info:
            service.delete_unit(sample_org_unit.id)

        assert exc_info.value.status_code == 400
        assert "该部门下还有员工" in exc_info.value.detail

    def test_move_unit(self, mock_db, sample_org_unit, sample_child_org_unit):
        """Test moving organization unit."""
        service = OrgUnitService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_id.return_value = sample_child_org_unit
        service.repo.is_descendant.return_value = False
        service.repo.find_by_id.side_effect = [sample_child_org_unit, None]
        service.repo.move_unit.return_value = sample_child_org_unit

        data = OrgUnitMove(new_parent_id=None)
        unit = service.move_unit(sample_child_org_unit.id, data)

        assert unit is not None

    def test_move_unit_to_own_descendant(self, mock_db, sample_org_unit, sample_child_org_unit):
        """Test moving unit to its own descendant raises error."""
        service = OrgUnitService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_id.return_value = sample_org_unit
        service.repo.is_descendant.return_value = True

        data = OrgUnitMove(new_parent_id=sample_child_org_unit.id)

        with pytest.raises(HTTPException) as exc_info:
            service.move_unit(sample_org_unit.id, data)

        assert exc_info.value.status_code == 400
        assert "循环引用" in exc_info.value.detail

    def test_move_unit_to_self(self, mock_db, sample_org_unit):
        """Test moving unit to itself raises error."""
        service = OrgUnitService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_id.return_value = sample_org_unit

        data = OrgUnitMove(new_parent_id=sample_org_unit.id)

        with pytest.raises(HTTPException) as exc_info:
            service.move_unit(sample_org_unit.id, data)

        assert exc_info.value.status_code == 400
        assert "不能将节点移动到自身" in exc_info.value.detail

    def test_toggle_status(self, mock_db, sample_org_unit):
        """Test toggling organization unit status."""
        service = OrgUnitService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_id.return_value = sample_org_unit
        service.repo.update.return_value = sample_org_unit

        sample_org_unit.status = OrgUnitStatus.active

        unit = service.toggle_status(sample_org_unit.id)

        assert sample_org_unit.status == OrgUnitStatus.inactive