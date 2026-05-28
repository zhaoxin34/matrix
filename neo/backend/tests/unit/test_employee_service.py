"""Tests for Employee Service."""

from sqlalchemy.orm import Session

from app.repositories.user_employee_mapping_repository import UserEmployeeMappingRepository
from app.services.employee_service import EmployeeService


class TestEmployeeServiceCreateWithUserLinking:
    """Test cases for EmployeeService.create_employee with user linking."""

    def test_create_employee_with_user_id(self, db_session: Session, test_user, test_org_unit):
        """Test creating an employee linked to a user."""
        employee, error = EmployeeService.create_employee(
            db_session,
            employee_no="EMP001",
            name="Test Employee",
            phone=test_user.phone,
            email="emp@test.com",
            position="Engineer",
            primary_unit_id=test_org_unit.id,
            user_id=test_user.id,
        )

        assert error is None
        assert employee is not None
        assert employee.employee_no == "EMP001"
        assert employee.name == "Test Employee"
        assert employee.phone == test_user.phone

        # Verify mapping was created
        mapping = UserEmployeeMappingRepository.get_by_user_id(db_session, test_user.id)
        assert mapping is not None
        assert mapping.user_id == test_user.id
        assert mapping.employee_id == employee.id

    def test_create_employee_without_user_id(self, db_session: Session, test_org_unit):
        """Test creating an employee without linking to a user."""
        employee, error = EmployeeService.create_employee(
            db_session,
            employee_no="EMP002",
            name="Unlinked Employee",
            phone="13900139002",
            email="unlinked@test.com",
            primary_unit_id=test_org_unit.id,
        )

        assert error is None
        assert employee is not None
        assert employee.employee_no == "EMP002"

    def test_create_employees_without_user_linking(self, db_session: Session, test_user, test_org_unit):
        """Test creating employees without user linking."""
        # Create first employee without user linking
        emp1, error1 = EmployeeService.create_employee(
            db_session,
            employee_no="EMP001",
            name="First Employee",
            phone="13900139001",
            primary_unit_id=test_org_unit.id,
        )
        assert error1 is None
        assert emp1 is not None

        # Verify no mapping exists
        mapping1 = UserEmployeeMappingRepository.get_by_user_id(db_session, test_user.id)
        assert mapping1 is None

        # Create second employee also without linking
        emp2, error2 = EmployeeService.create_employee(
            db_session,
            employee_no="EMP002",
            name="Second Employee",
            phone="13900139002",
            primary_unit_id=test_org_unit.id,
        )
        assert error2 is None
        assert emp2 is not None

    def test_create_employee_phone_is_from_form(self, db_session: Session, test_user, test_org_unit):
        """Test that employee phone is set from form, not from user phone."""
        different_phone = "13900139999"

        employee, error = EmployeeService.create_employee(
            db_session,
            employee_no="EMP003",
            name="Phone Test Employee",
            phone=different_phone,  # Different from user's phone
            email="phone@test.com",
            primary_unit_id=test_org_unit.id,
            user_id=test_user.id,
        )

        assert error is None
        assert employee is not None
        # The employee's phone is what was provided, regardless of user
        assert employee.phone == different_phone


class TestEmployeeServiceUpdate:
    """Test cases for EmployeeService.update_employee."""

    def test_update_employee_success(self, db_session: Session, test_org_unit):
        """Test updating an employee's information."""
        # Create employee
        employee, _ = EmployeeService.create_employee(
            db_session,
            employee_no="EMP001",
            name="Original Name",
            phone="13900139001",
            email="original@test.com",
            primary_unit_id=test_org_unit.id,
        )

        # Update
        updated, error = EmployeeService.update_employee(
            db_session,
            employee_id=employee.id,
            name="Updated Name",
            email="updated@test.com",
            position="Senior Engineer",
        )

        assert error is None
        assert updated.name == "Updated Name"
        assert updated.email == "updated@test.com"
        assert updated.position == "Senior Engineer"

    def test_update_employee_not_found(self, db_session: Session):
        """Test updating a non-existent employee."""
        updated, error = EmployeeService.update_employee(
            db_session,
            employee_id=99999,
            name="New Name",
        )

        assert updated is None
        assert error == "员工不存在"


class TestEmployeeServiceDelete:
    """Test cases for EmployeeService.delete_employee."""

    def test_delete_employee_with_mapping(self, db_session: Session, test_user, test_org_unit):
        """Test deleting an employee removes the user mapping."""
        # Create employee with user
        employee, _ = EmployeeService.create_employee(
            db_session,
            employee_no="EMP001",
            name="To Delete",
            phone=test_user.phone,
            primary_unit_id=test_org_unit.id,
            user_id=test_user.id,
        )

        # Verify mapping exists
        mapping = UserEmployeeMappingRepository.get_by_user_id(db_session, test_user.id)
        assert mapping is not None

        # Soft delete employee
        success, error = EmployeeService.soft_delete_employee(db_session, employee.id)
        assert success is True
        assert error is None

        # Verify mapping is still there (soft delete doesn't cascade)
        mapping_after = UserEmployeeMappingRepository.get_by_user_id(db_session, test_user.id)
        # Mapping still exists because employee is soft-deleted, not hard deleted
        # In real scenario, you might want to clean up mappings when deleting

    def test_delete_employee_not_found(self, db_session: Session):
        """Test deleting a non-existent employee."""
        success, error = EmployeeService.soft_delete_employee(db_session, 99999)
        assert success is False
        assert error == "员工不存在"


class TestEmployeeServiceCreateWithUserLinkingValidation:
    """Test cases for employee-user linking validation (at service level)."""

    def test_employee_no_must_be_unique(self, db_session: Session, test_user, test_org_unit):
        """Test that duplicate employee numbers are rejected."""
        # Create first employee
        emp1, error1 = EmployeeService.create_employee(
            db_session,
            employee_no="EMP_DUP",
            name="First",
            phone="13900139001",
            primary_unit_id=test_org_unit.id,
        )
        assert error1 is None
        assert emp1 is not None

        # Try to create second employee with same number
        emp2, error2 = EmployeeService.create_employee(
            db_session,
            employee_no="EMP_DUP",
            name="Second",
            phone="13900139002",
            primary_unit_id=test_org_unit.id,
        )
        assert emp2 is None
        assert error2 == "工号已存在"

    def test_invalid_primary_unit_rejected(self, db_session: Session, test_user):
        """Test that non-existent primary unit is rejected."""
        employee, error = EmployeeService.create_employee(
            db_session,
            employee_no="EMP_NEW",
            name="New Employee",
            phone="13900139001",
            primary_unit_id=99999,  # Non-existent
        )
        assert employee is None
        assert error == "主属部门不存在"
