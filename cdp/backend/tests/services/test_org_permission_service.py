"""Tests for OrgPermissionService."""

from unittest.mock import MagicMock

from app.services.org_permission_service import OrgPermissionService


class TestOrgPermissionService:
    """Test OrgPermissionService class."""

    def test_get_permitted_unit_ids_admin(self, mock_db, sample_admin_user):
        """Test admin user gets None (no restrictions)."""
        service = OrgPermissionService(mock_db)

        result = service.get_permitted_unit_ids(sample_admin_user)

        assert result is None

    def test_get_permitted_unit_ids_no_employee_mapping(self, mock_db, sample_user):
        """Test user without employee mapping returns empty list."""
        service = OrgPermissionService(mock_db)

        # Mock query to return None for UserEmployeeMapping query
        mock_db.query.return_value.filter.return_value.first.return_value = None

        result = service.get_permitted_unit_ids(sample_user)

        assert result == []

    def test_get_permitted_unit_ids_with_children(self, mock_db, sample_user, sample_employee):
        """Test user gets permitted unit IDs including children."""

        mock_mapping = MagicMock()
        mock_mapping.user_id = sample_user.id
        mock_mapping.employee_id = sample_employee.id

        mock_db.query.return_value.filter.return_value.first.side_effect = [
            mock_mapping,  # mapping query
            sample_employee,  # employee query
        ]

        mock_db.query.return_value.filter.return_value.all.return_value = [
            (1,),
            (2,),
        ]

        service = OrgPermissionService(mock_db)
        result = service.get_permitted_unit_ids(sample_user)

        assert result is not None
        assert len(result) == 2

    def test_can_manage_unit_admin(self, mock_db, sample_admin_user):
        """Test admin can manage any unit."""
        service = OrgPermissionService(mock_db)
        service.get_permitted_unit_ids = MagicMock(return_value=None)

        result = service.can_manage_unit(sample_admin_user, unit_id=999)

        assert result is True

    def test_can_manage_unit_has_permission(self, mock_db, sample_user):
        """Test user with permission can manage unit."""
        service = OrgPermissionService(mock_db)
        service.get_permitted_unit_ids = MagicMock(return_value=[1, 2, 3])

        result = service.can_manage_unit(sample_user, unit_id=1)

        assert result is True

    def test_can_manage_unit_no_permission(self, mock_db, sample_user):
        """Test user without permission cannot manage unit."""
        service = OrgPermissionService(mock_db)
        service.get_permitted_unit_ids = MagicMock(return_value=[1, 2, 3])

        result = service.can_manage_unit(sample_user, unit_id=9999)

        assert result is False

    def test_get_permitted_unit_ids_no_primary_unit(self, mock_db, sample_user):
        """Test user with employee but no primary unit returns empty list."""

        mock_mapping = MagicMock()
        mock_mapping.user_id = sample_user.id
        mock_mapping.employee_id = 1

        mock_employee = MagicMock()
        mock_employee.id = 1
        mock_employee.primary_unit_id = None

        mock_db.query.return_value.filter.return_value.first.side_effect = [
            mock_mapping,  # mapping query
            mock_employee,  # employee with no primary unit
        ]

        service = OrgPermissionService(mock_db)
        result = service.get_permitted_unit_ids(sample_user)

        assert result == []
