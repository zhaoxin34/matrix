"""Tests for UserEmployeeMapping repository."""

from sqlalchemy.orm import Session

from app.models import Employee, EmployeeStatus, User
from app.models.user_employee_mapping import UserEmployeeMapping
from app.repositories.user_employee_mapping_repository import UserEmployeeMappingRepository
from app.services.auth_service import hash_password


class TestUserEmployeeMappingRepository:
    """Test cases for UserEmployeeMappingRepository."""

    def test_create_mapping(self, db_session: Session, test_user, test_org_unit):
        """Test creating a new mapping."""
        # Create employee
        employee = Employee(
            employee_no="EMP001",
            name="Test Employee",
            phone=test_user.phone,
            primary_unit_id=test_org_unit.id,
            status=EmployeeStatus.ONBOARDING,
        )
        db_session.add(employee)
        db_session.commit()
        db_session.refresh(employee)

        # Create mapping
        mapping = UserEmployeeMappingRepository.create(db_session, user_id=test_user.id, employee_id=employee.id)

        assert mapping is not None
        assert mapping.user_id == test_user.id
        assert mapping.employee_id == employee.id

    def test_get_by_user_id(self, db_session: Session, test_user, test_org_unit):
        """Test getting mapping by user ID."""
        # Create employee and mapping
        employee = Employee(
            employee_no="EMP001",
            name="Test Employee",
            phone=test_user.phone,
            primary_unit_id=test_org_unit.id,
            status=EmployeeStatus.ONBOARDING,
        )
        db_session.add(employee)
        db_session.flush()

        mapping = UserEmployeeMapping(
            user_id=test_user.id,
            employee_id=employee.id,
        )
        db_session.add(mapping)
        db_session.commit()

        # Query
        result = UserEmployeeMappingRepository.get_by_user_id(db_session, test_user.id)

        assert result is not None
        assert result.user_id == test_user.id
        assert result.employee_id == employee.id

    def test_get_by_user_id_not_found(self, db_session: Session):
        """Test getting mapping by non-existent user ID."""
        result = UserEmployeeMappingRepository.get_by_user_id(db_session, 99999)
        assert result is None

    def test_get_by_employee_id(self, db_session: Session, test_user, test_org_unit):
        """Test getting mapping by employee ID."""
        # Create employee and mapping
        employee = Employee(
            employee_no="EMP001",
            name="Test Employee",
            phone=test_user.phone,
            primary_unit_id=test_org_unit.id,
            status=EmployeeStatus.ONBOARDING,
        )
        db_session.add(employee)
        db_session.flush()

        mapping = UserEmployeeMapping(
            user_id=test_user.id,
            employee_id=employee.id,
        )
        db_session.add(mapping)
        db_session.commit()

        # Query
        result = UserEmployeeMappingRepository.get_by_employee_id(db_session, employee.id)

        assert result is not None
        assert result.user_id == test_user.id
        assert result.employee_id == employee.id

    def test_get_by_employee_id_not_found(self, db_session: Session):
        """Test getting mapping by non-existent employee ID."""
        result = UserEmployeeMappingRepository.get_by_employee_id(db_session, 99999)
        assert result is None

    def test_is_user_linked_true(self, db_session: Session, test_user, test_org_unit):
        """Test is_user_linked returns True when user is linked."""
        # Create employee and mapping
        employee = Employee(
            employee_no="EMP001",
            name="Test Employee",
            phone=test_user.phone,
            primary_unit_id=test_org_unit.id,
            status=EmployeeStatus.ONBOARDING,
        )
        db_session.add(employee)
        db_session.flush()

        mapping = UserEmployeeMapping(
            user_id=test_user.id,
            employee_id=employee.id,
        )
        db_session.add(mapping)
        db_session.commit()

        result = UserEmployeeMappingRepository.is_user_linked(db_session, test_user.id)
        assert result is True

    def test_is_user_linked_false(self, db_session: Session, test_user):
        """Test is_user_linked returns False when user is not linked."""
        result = UserEmployeeMappingRepository.is_user_linked(db_session, test_user.id)
        assert result is False

    def test_is_employee_linked_true(self, db_session: Session, test_user, test_org_unit):
        """Test is_employee_linked returns True when employee is linked."""
        # Create employee and mapping
        employee = Employee(
            employee_no="EMP001",
            name="Test Employee",
            phone=test_user.phone,
            primary_unit_id=test_org_unit.id,
            status=EmployeeStatus.ONBOARDING,
        )
        db_session.add(employee)
        db_session.flush()

        mapping = UserEmployeeMapping(
            user_id=test_user.id,
            employee_id=employee.id,
        )
        db_session.add(mapping)
        db_session.commit()

        result = UserEmployeeMappingRepository.is_employee_linked(db_session, employee.id)
        assert result is True

    def test_is_employee_linked_false(self, db_session: Session, test_org_unit):
        """Test is_employee_linked returns False when employee is not linked."""
        # Create employee without mapping
        employee = Employee(
            employee_no="EMP001",
            name="Test Employee",
            primary_unit_id=test_org_unit.id,
            status=EmployeeStatus.ONBOARDING,
        )
        db_session.add(employee)
        db_session.commit()

        result = UserEmployeeMappingRepository.is_employee_linked(db_session, employee.id)
        assert result is False

    def test_delete_by_user_id(self, db_session: Session, test_user, test_org_unit):
        """Test deleting mapping by user ID."""
        # Create employee and mapping
        employee = Employee(
            employee_no="EMP001",
            name="Test Employee",
            phone=test_user.phone,
            primary_unit_id=test_org_unit.id,
            status=EmployeeStatus.ONBOARDING,
        )
        db_session.add(employee)
        db_session.flush()

        mapping = UserEmployeeMapping(
            user_id=test_user.id,
            employee_id=employee.id,
        )
        db_session.add(mapping)
        db_session.commit()

        # Delete
        result = UserEmployeeMappingRepository.delete_by_user_id(db_session, test_user.id)
        assert result is True

        # Verify deleted
        mapping_after = UserEmployeeMappingRepository.get_by_user_id(db_session, test_user.id)
        assert mapping_after is None

    def test_delete_by_user_id_not_found(self, db_session: Session):
        """Test deleting mapping by non-existent user ID."""
        result = UserEmployeeMappingRepository.delete_by_user_id(db_session, 99999)
        assert result is False

    def test_delete_by_employee_id(self, db_session: Session, test_user, test_org_unit):
        """Test deleting mapping by employee ID."""
        # Create employee and mapping
        employee = Employee(
            employee_no="EMP001",
            name="Test Employee",
            phone=test_user.phone,
            primary_unit_id=test_org_unit.id,
            status=EmployeeStatus.ONBOARDING,
        )
        db_session.add(employee)
        db_session.flush()

        mapping = UserEmployeeMapping(
            user_id=test_user.id,
            employee_id=employee.id,
        )
        db_session.add(mapping)
        db_session.commit()

        # Delete
        result = UserEmployeeMappingRepository.delete_by_employee_id(db_session, employee.id)
        assert result is True

        # Verify deleted
        mapping_after = UserEmployeeMappingRepository.get_by_employee_id(db_session, employee.id)
        assert mapping_after is None

    def test_delete_by_employee_id_not_found(self, db_session: Session):
        """Test deleting mapping by non-existent employee ID."""
        result = UserEmployeeMappingRepository.delete_by_employee_id(db_session, 99999)
        assert result is False

    def test_get_linked_user_ids(self, db_session: Session, test_user, test_org_unit):
        """Test getting all linked user IDs."""
        # Create multiple employees and mappings
        user2 = User(
            phone="13900139002",
            hashed_password=hash_password("abcd1234"),
            username="user2",
            is_active=True,
        )
        db_session.add(user2)

        employee1 = Employee(
            employee_no="EMP001",
            name="Employee 1",
            phone=test_user.phone,
            primary_unit_id=test_org_unit.id,
            status=EmployeeStatus.ONBOARDING,
        )
        employee2 = Employee(
            employee_no="EMP002",
            name="Employee 2",
            phone=user2.phone,
            primary_unit_id=test_org_unit.id,
            status=EmployeeStatus.ONBOARDING,
        )
        db_session.add_all([employee1, employee2])
        db_session.flush()

        mapping1 = UserEmployeeMapping(user_id=test_user.id, employee_id=employee1.id)
        mapping2 = UserEmployeeMapping(user_id=user2.id, employee_id=employee2.id)
        db_session.add_all([mapping1, mapping2])
        db_session.commit()

        result = UserEmployeeMappingRepository.get_linked_user_ids(db_session)

        assert len(result) == 2
        assert test_user.id in result
        assert user2.id in result

    def test_get_linked_employee_ids(self, db_session: Session, test_user, test_org_unit):
        """Test getting all linked employee IDs."""
        # Create multiple employees and mappings
        user2 = User(
            phone="13900139002",
            hashed_password=hash_password("abcd1234"),
            username="user2",
            is_active=True,
        )
        db_session.add(user2)

        employee1 = Employee(
            employee_no="EMP001",
            name="Employee 1",
            phone=test_user.phone,
            primary_unit_id=test_org_unit.id,
            status=EmployeeStatus.ONBOARDING,
        )
        employee2 = Employee(
            employee_no="EMP002",
            name="Employee 2",
            phone=user2.phone,
            primary_unit_id=test_org_unit.id,
            status=EmployeeStatus.ONBOARDING,
        )
        db_session.add_all([employee1, employee2])
        db_session.flush()

        mapping1 = UserEmployeeMapping(user_id=test_user.id, employee_id=employee1.id)
        mapping2 = UserEmployeeMapping(user_id=user2.id, employee_id=employee2.id)
        db_session.add_all([mapping1, mapping2])
        db_session.commit()

        result = UserEmployeeMappingRepository.get_linked_employee_ids(db_session)

        assert len(result) == 2
        assert employee1.id in result
        assert employee2.id in result
