"""Employee service."""

from datetime import date
from typing import List, Optional, Tuple

from app.models import Employee, EmployeeStatus, EmployeeTransfer, TransferType
from app.repositories import employee_repository as repo


class EmployeeService:
    """Service for employee operations."""

    @staticmethod
    def get_employee_by_id(
        db,
        employee_id: int,
        include_deleted: bool = False,
    ) -> Optional[Employee]:
        """Get employee by ID."""
        return repo.get_employee_by_id(db, employee_id, include_deleted)

    @staticmethod
    def get_employee_by_no(
        db,
        employee_no: str,
        include_deleted: bool = False,
    ) -> Optional[Employee]:
        """Get employee by employee number."""
        return repo.get_employee_by_no(db, employee_no, include_deleted)

    @staticmethod
    def get_employees(
        db,
        page: int = 1,
        page_size: int = 20,
        unit_id: Optional[int] = None,
        status: Optional[EmployeeStatus] = None,
        search: Optional[str] = None,
        include_deleted: bool = False,
    ) -> Tuple[List[Employee], int]:
        """Get paginated employee list."""
        return repo.get_employees(
            db,
            page=page,
            page_size=page_size,
            unit_id=unit_id,
            status=status,
            search=search,
            include_deleted=include_deleted,
        )

    @staticmethod
    def create_employee(
        db,
        employee_no: str,
        name: str,
        phone: Optional[str] = None,
        email: Optional[str] = None,
        position: Optional[str] = None,
        primary_unit_id: Optional[int] = None,
        entry_date: Optional[date] = None,
        secondary_unit_ids: Optional[List[int]] = None,
        user_id: Optional[int] = None,
    ) -> Tuple[Optional[Employee], Optional[str]]:
        """Create a new employee.
        Args:
            user_id: Optional user ID to link with this employee.

        Returns:
            Tuple of (employee, error_message)
        """
        # Check if employee number already exists
        if repo.is_employee_no_exists(db, employee_no):
            return None, "工号已存在"
        # Validate primary unit if provided
        if primary_unit_id:
            from app.repositories import org_unit_repository as org_repo

            unit = org_repo.get_org_unit_by_id(db, primary_unit_id)
            if not unit:
                return None, "主属部门不存在"
        # Validate secondary units if provided
        if secondary_unit_ids:
            from app.repositories import org_unit_repository as org_repo

            for unit_id in secondary_unit_ids:
                unit = org_repo.get_org_unit_by_id(db, unit_id)
                if not unit:
                    return None, f"辅助部门({unit_id})不存在"
        employee = repo.create_employee(
            db,
            employee_no=employee_no,
            name=name,
            phone=phone,
            email=email,
            position=position,
            primary_unit_id=primary_unit_id,
            entry_date=entry_date,
            secondary_unit_ids=secondary_unit_ids,
        )

        # Link to user if user_id is provided
        if user_id and employee:
            from app.repositories.user_employee_mapping_repository import (
                UserEmployeeMappingRepository,
            )

            UserEmployeeMappingRepository.create(db, user_id=user_id, employee_id=employee.id)
        return employee, None

    @staticmethod
    def update_employee(
        db,
        employee_id: int,
        name: Optional[str] = None,
        phone: Optional[str] = None,
        email: Optional[str] = None,
        position: Optional[str] = None,
        primary_unit_id: Optional[int] = None,
        entry_date: Optional[date] = None,
        status: Optional[str] = None,
    ) -> Tuple[Optional[Employee], Optional[str]]:
        """Update employee profile.

        Returns:
            Tuple of (employee, error_message)
        """
        employee = repo.get_employee_by_id(db, employee_id)
        if not employee:
            return None, "员工不存在"

        # Validate primary unit if provided
        if primary_unit_id is not None and primary_unit_id > 0:
            from app.repositories import org_unit_repository as org_repo

            unit = org_repo.get_org_unit_by_id(db, primary_unit_id)
            if not unit:
                return None, "主属部门不存在"

        # Validate status if provided
        if status is not None:
            from app.models import EmployeeStatus

            try:
                EmployeeStatus(status)
            except ValueError:
                return None, "无效的状态值"

        updated = repo.update_employee(
            db,
            employee_id,
            name=name,
            phone=phone,
            email=email,
            position=position,
            primary_unit_id=primary_unit_id,
            entry_date=entry_date,
            status=status,
        )
        return updated, None

    @staticmethod
    def update_secondary_units(
        db,
        employee_id: int,
        unit_ids: List[int],
    ) -> Tuple[Optional[Employee], Optional[str]]:
        """Update employee's secondary units.

        Returns:
            Tuple of (employee, error_message)
        """
        employee = repo.get_employee_by_id(db, employee_id)
        if not employee:
            return None, "员工不存在"

        # Validate all units
        from app.repositories import org_unit_repository as org_repo

        for unit_id in unit_ids:
            unit = org_repo.get_org_unit_by_id(db, unit_id)
            if not unit:
                return None, f"辅助部门({unit_id})不存在"

        # Cannot be the same as primary unit
        from app.repositories import org_unit_repository as org_repo

        all_unit_ids = [employee.primary_unit_id] if employee.primary_unit_id else []
        all_unit_ids.extend(unit_ids)
        if len(all_unit_ids) != len(set(all_unit_ids)):
            return None, "辅助部门不能包含主属部门"

        updated = repo.update_secondary_units(db, employee_id, unit_ids)
        return updated, None

    @staticmethod
    def soft_delete_employee(db, employee_id: int) -> Tuple[bool, Optional[str]]:
        """Soft delete an employee.

        Returns:
            Tuple of (success, error_message)
        """
        employee = repo.get_employee_by_id(db, employee_id)
        if not employee:
            return False, "员工不存在"

        success = repo.soft_delete_employee(db, employee_id)
        return success, None

    @staticmethod
    def restore_employee(db, employee_id: int) -> Tuple[bool, Optional[str]]:
        """Restore a soft-deleted employee.

        Returns:
            Tuple of (success, error_message)
        """
        employee = repo.get_employee_by_id(db, employee_id, include_deleted=True)
        if not employee:
            return False, "员工不存在"

        if not employee.is_deleted:
            return False, "员工未被删除"

        success = repo.restore_employee(db, employee_id)
        return success, None

    @staticmethod
    def transfer_employee(
        db,
        employee_id: int,
        to_unit_id: int,
        transfer_type: TransferType,
        effective_date: date,
        reason: Optional[str] = None,
    ) -> Tuple[Optional[EmployeeTransfer], Optional[str]]:
        """Transfer employee to a new organization unit.

        Returns:
            Tuple of (transfer_record, error_message)
        """
        employee = repo.get_employee_by_id(db, employee_id)
        if not employee:
            return None, "员工不存在"

        # Validate target unit
        from app.repositories import org_unit_repository as org_repo

        target_unit = org_repo.get_org_unit_by_id(db, to_unit_id)
        if not target_unit:
            return None, "目标部门不存在"

        # Cannot transfer to the same unit
        if employee.primary_unit_id == to_unit_id:
            return None, "不能调转到当前所在部门"

        # Update employee status to transferring
        employee.status = EmployeeStatus.TRANSFERRING
        db.commit()

        transfer = repo.transfer_employee(
            db,
            employee_id=employee_id,
            to_unit_id=to_unit_id,
            transfer_type=transfer_type,
            effective_date=effective_date,
            reason=reason,
        )

        # Update employee status back to on_job (direct transfer)
        employee.status = EmployeeStatus.ON_JOB
        db.commit()

        return transfer, None

    @staticmethod
    def get_transfer_history(
        db,
        employee_id: int,
    ) -> Tuple[List[EmployeeTransfer], Optional[str]]:
        """Get employee transfer history.

        Returns:
            Tuple of (transfer_records, error_message)
        """
        employee = repo.get_employee_by_id(db, employee_id)
        if not employee:
            return [], "员工不存在"

        transfers = repo.get_transfer_history(db, employee_id)
        return transfers, None


employee_service = EmployeeService()
