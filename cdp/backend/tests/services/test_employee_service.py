"""Tests for EmployeeService."""

import pytest
from unittest.mock import MagicMock, patch
from fastapi import HTTPException
from datetime import date

from app.services.employee_service import EmployeeService
from app.models.employee import Employee, EmployeeStatus
from app.schemas.employee import EmployeeCreate, EmployeeUpdate


class TestEmployeeService:
    """Test EmployeeService class."""

    def test_get_employee_found(self, mock_db, sample_employee):
        """Test getting existing employee."""
        service = EmployeeService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_id.return_value = sample_employee

        employee = service.get_employee(sample_employee.id)

        assert employee is not None
        assert employee.id == sample_employee.id
        assert employee.name == "张三"

    def test_get_employee_not_found(self, mock_db):
        """Test getting non-existent employee raises error."""
        service = EmployeeService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_id.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            service.get_employee(9999)

        assert exc_info.value.status_code == 404
        assert "员工不存在" in exc_info.value.detail

    def test_list_employees_pagination(self, mock_db, sample_employee):
        """Test listing employees with pagination."""
        service = EmployeeService(mock_db)
        service.repo = MagicMock()
        sample_employee.dimission_date = None
        service.repo.find_by_unit_ids.return_value = ([sample_employee], 1)

        result = service.list_employees(page=1, page_size=10)

        assert result is not None
        assert result.page == 1
        assert result.page_size == 10
        assert result.total == 1

    def test_list_employees_filter_by_unit(self, mock_db, sample_employee, sample_org_unit):
        """Test listing employees filtered by unit."""
        service = EmployeeService(mock_db)
        service.repo = MagicMock()
        service.unit_repo = MagicMock()
        service.unit_repo.get_descendant_ids.return_value = [sample_org_unit.id]
        sample_employee.dimission_date = None
        service.repo.find_by_unit_ids.return_value = ([sample_employee], 1)

        result = service.list_employees(unit_id=sample_org_unit.id)

        assert result is not None

    def test_list_employees_filter_by_status(self, mock_db, sample_employee):
        """Test listing employees filtered by status."""
        service = EmployeeService(mock_db)
        service.repo = MagicMock()
        sample_employee.dimission_date = None
        service.repo.find_by_unit_ids.return_value = ([sample_employee], 1)

        result = service.list_employees(status=EmployeeStatus.on_job)

        assert result is not None

    def test_list_employees_filter_by_keyword(self, mock_db, sample_employee):
        """Test listing employees filtered by keyword."""
        service = EmployeeService(mock_db)
        service.repo = MagicMock()
        sample_employee.dimission_date = None
        service.repo.find_by_unit_ids.return_value = ([sample_employee], 1)

        result = service.list_employees(keyword="张三")

        assert result is not None

    def test_create_employee(self, mock_db, sample_org_unit):
        """Test creating a new employee."""
        service = EmployeeService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_employee_no.return_value = None
        service.repo.find_mapping_by_user_id.return_value = None
        service.repo.create.return_value = MagicMock(
            id=1, employee_no="E002", name="李四", status=EmployeeStatus.onboarding
        )
        service.repo.commit = MagicMock()
        service.repo.find_by_id.return_value = MagicMock(
            id=1, employee_no="E002", name="李四", status=EmployeeStatus.onboarding,
            secondary_units=[]
        )

        data = EmployeeCreate(
            employee_no="E002",
            name="李四",
            phone="13900139001",
            email="lisi@example.com",
            position="产品经理",
            primary_unit_id=sample_org_unit.id,
            entry_date=date.today(),
        )

        employee = service.create_employee(data)

        assert employee is not None

    def test_create_employee_duplicate_employee_no(self, mock_db, sample_employee):
        """Test creating employee with duplicate employee number raises error."""
        service = EmployeeService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_employee_no.return_value = sample_employee

        data = EmployeeCreate(
            employee_no="E001",  # Same as sample_employee
            name="王五",
            phone="13900139002",
            email="wangwu@example.com",
            position="设计师",
            primary_unit_id=None,
        )

        with pytest.raises(HTTPException) as exc_info:
            service.create_employee(data)

        assert exc_info.value.status_code == 400
        assert "已存在" in exc_info.value.detail

    def test_update_employee(self, mock_db, sample_employee):
        """Test updating an employee."""
        service = EmployeeService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_id.return_value = sample_employee
        service.repo.update.return_value = sample_employee
        service.repo.commit = MagicMock()
        service.repo.find_by_id.side_effect = [sample_employee, sample_employee]

        data = EmployeeUpdate(name="张三更新", position="高级工程师")

        employee = service.update_employee(sample_employee.id, data)

        assert employee is not None

    def test_delete_employee_soft_delete(self, mock_db, sample_employee):
        """Test soft deleting an employee."""
        service = EmployeeService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_id.return_value = sample_employee
        service.repo.soft_delete = MagicMock()
        service.repo.commit = MagicMock()
        service.repo.find_by_id.side_effect = [sample_employee, sample_employee]
        sample_employee.status = EmployeeStatus.offboarding

        service.delete_employee(sample_employee.id)

        service.repo.soft_delete.assert_called_once()

    def test_bind_user(self, mock_db, sample_employee, sample_user):
        """Test binding user to employee."""
        service = EmployeeService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_id.side_effect = [sample_employee, sample_employee]
        service.repo.find_mapping_by_employee_id.return_value = None
        service.repo.find_mapping_by_user_id.return_value = None
        service.repo.bind_user = MagicMock()
        service.repo.commit = MagicMock()

        employee = service.bind_user(sample_employee.id, sample_user.id)

        assert employee is not None
        service.repo.bind_user.assert_called_with(sample_employee.id, sample_user.id)

    def test_bind_user_already_bound(self, mock_db, sample_employee, sample_user):
        """Test binding already bound employee raises error."""
        service = EmployeeService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_id.side_effect = [sample_employee, sample_employee]
        service.repo.find_mapping_by_employee_id.return_value = MagicMock()

        with pytest.raises(HTTPException) as exc_info:
            service.bind_user(sample_employee.id, sample_user.id)

        assert exc_info.value.status_code == 400
        assert "已绑定账号" in exc_info.value.detail

    def test_unbind_user(self, mock_db, sample_employee):
        """Test unbinding user from employee."""
        service = EmployeeService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_id.side_effect = [sample_employee, sample_employee]
        service.repo.unbind_user = MagicMock()
        service.repo.commit = MagicMock()

        employee = service.unbind_user(sample_employee.id)

        assert employee is not None
        service.repo.unbind_user.assert_called_with(sample_employee)

    def test_confirm_onboarding(self, mock_db, sample_employee):
        """Test confirming employee onboarding."""
        service = EmployeeService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_id.side_effect = [sample_employee, sample_employee]
        sample_employee.status = EmployeeStatus.onboarding
        service.repo.update = MagicMock()
        service.repo.commit = MagicMock()

        employee = service.confirm_onboarding(sample_employee.id)

        assert employee.status == EmployeeStatus.on_job

    def test_confirm_onboarding_wrong_status(self, mock_db, sample_employee):
        """Test confirming onboarding with wrong status raises error."""
        service = EmployeeService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_id.return_value = sample_employee
        sample_employee.status = EmployeeStatus.on_job

        with pytest.raises(HTTPException) as exc_info:
            service.confirm_onboarding(sample_employee.id)

        assert exc_info.value.status_code == 400
        assert "只有入职中的员工可以确认入职" in exc_info.value.detail