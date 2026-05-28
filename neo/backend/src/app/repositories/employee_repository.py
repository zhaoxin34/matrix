"""Employee repository."""

from typing import List, Optional, Tuple

from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.models import (
    Employee,
    EmployeeSecondaryUnit,
    EmployeeStatus,
    EmployeeTransfer,
    TransferType,
)


def get_employee_by_id(
    db: Session,
    employee_id: int,
    include_deleted: bool = False,
) -> Optional[Employee]:
    """Get employee by ID."""
    query = db.query(Employee).filter(Employee.id == employee_id)
    if not include_deleted:
        query = query.filter(Employee.is_deleted.is_(False))
    return query.first()


def get_employee_by_no(
    db: Session,
    employee_no: str,
    include_deleted: bool = False,
) -> Optional[Employee]:
    """Get employee by employee number."""
    query = db.query(Employee).filter(Employee.employee_no == employee_no)
    if not include_deleted:
        query = query.filter(Employee.is_deleted.is_(False))
    return query.first()


def get_employees(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    unit_id: Optional[int] = None,
    status: Optional[EmployeeStatus] = None,
    search: Optional[str] = None,
    include_deleted: bool = False,
) -> Tuple[List[Employee], int]:
    """Get paginated employee list with filters."""
    query = db.query(Employee)

    if not include_deleted:
        query = query.filter(Employee.is_deleted.is_(False))

    if unit_id:
        query = query.filter(Employee.primary_unit_id == unit_id)

    if status:
        query = query.filter(Employee.status == status)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Employee.name.ilike(search_pattern),
                Employee.employee_no.ilike(search_pattern),
            )
        )

    total = query.count()
    employees = (
        query.options(
            joinedload(Employee.primary_unit),
            joinedload(Employee.secondary_units).joinedload(EmployeeSecondaryUnit.unit),
        )
        .order_by(Employee.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return employees, total


def get_employees_by_unit(
    db: Session,
    unit_ids: List[int],
    status: Optional[EmployeeStatus] = None,
    include_deleted: bool = False,
) -> List[Employee]:
    """Get employees by organization unit IDs."""
    query = db.query(Employee).filter(Employee.primary_unit_id.in_(unit_ids))

    if not include_deleted:
        query = query.filter(Employee.is_deleted.is_(False))

    if status:
        query = query.filter(Employee.status == status)

    return query.all()


def count_employees_by_units(db: Session, unit_ids: List[int]) -> int:
    """Count active employees in the given units (excluding deleted)."""
    if not unit_ids:
        return 0
    count = (
        db.query(Employee)
        .filter(
            Employee.primary_unit_id.in_(unit_ids),
            Employee.is_deleted.is_(False),
        )
        .count()
    )
    return count


def has_active_employees(db: Session, unit_ids: List[int]) -> bool:
    """Check if there are active employees in the given units."""
    active_statuses = [EmployeeStatus.ONBOARDING, EmployeeStatus.ON_JOB, EmployeeStatus.TRANSFERRING]
    count = (
        db.query(Employee)
        .filter(
            Employee.primary_unit_id.in_(unit_ids),
            Employee.is_deleted.is_(False),
            Employee.status.in_(active_statuses),
        )
        .count()
    )
    return count > 0


def create_employee(
    db: Session,
    employee_no: str,
    name: str,
    phone: Optional[str] = None,
    email: Optional[str] = None,
    position: Optional[str] = None,
    primary_unit_id: Optional[int] = None,
    entry_date=None,
    secondary_unit_ids: Optional[List[int]] = None,
) -> Employee:
    """Create a new employee."""
    employee = Employee(
        employee_no=employee_no,
        name=name,
        phone=phone,
        email=email,
        position=position,
        primary_unit_id=primary_unit_id,
        entry_date=entry_date,
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)

    # Add secondary units
    if secondary_unit_ids:
        for unit_id in secondary_unit_ids:
            secondary = EmployeeSecondaryUnit(employee_id=employee.id, unit_id=unit_id)
            db.add(secondary)
        db.commit()
        db.refresh(employee)

    return employee


def update_employee(
    db: Session,
    employee_id: int,
    name: Optional[str] = None,
    phone: Optional[str] = None,
    email: Optional[str] = None,
    position: Optional[str] = None,
    primary_unit_id: Optional[int] = None,
    entry_date=None,
    status: Optional[str] = None,
) -> Optional[Employee]:
    """Update employee profile."""
    employee = get_employee_by_id(db, employee_id)
    if not employee:
        return None

    if name is not None:
        employee.name = name
    if phone is not None:
        employee.phone = phone
    if email is not None:
        employee.email = email
    if position is not None:
        employee.position = position
    if primary_unit_id is not None:
        employee.primary_unit_id = primary_unit_id if primary_unit_id > 0 else None
    if entry_date is not None:
        employee.entry_date = entry_date
    if status is not None:
        employee.status = status

    db.commit()
    db.refresh(employee)
    return employee


def update_secondary_units(
    db: Session,
    employee_id: int,
    unit_ids: List[int],
) -> Optional[Employee]:
    """Update employee's secondary units."""
    employee = get_employee_by_id(db, employee_id)
    if not employee:
        return None

    # Remove existing secondary units
    db.query(EmployeeSecondaryUnit).filter(EmployeeSecondaryUnit.employee_id == employee_id).delete()

    # Add new secondary units
    for unit_id in unit_ids:
        secondary = EmployeeSecondaryUnit(employee_id=employee_id, unit_id=unit_id)
        db.add(secondary)

    db.commit()
    db.refresh(employee)
    return employee


def soft_delete_employee(db: Session, employee_id: int) -> bool:
    """Soft delete an employee (set is_deleted=True)."""
    employee = get_employee_by_id(db, employee_id, include_deleted=False)
    if not employee:
        return False

    employee.is_deleted = True
    db.commit()
    return True


def restore_employee(db: Session, employee_id: int) -> bool:
    """Restore a soft-deleted employee (set is_deleted=False)."""
    employee = get_employee_by_id(db, employee_id, include_deleted=True)
    if not employee or not employee.is_deleted:
        return False

    employee.is_deleted = False
    db.commit()
    return True


def transfer_employee(
    db: Session,
    employee_id: int,
    to_unit_id: int,
    transfer_type: TransferType,
    effective_date,
    reason: Optional[str] = None,
) -> Optional[EmployeeTransfer]:
    """Transfer employee to a new organization unit."""
    employee = get_employee_by_id(db, employee_id)
    if not employee:
        return None

    from_unit_id = employee.primary_unit_id

    # Create transfer record
    transfer = EmployeeTransfer(
        employee_id=employee_id,
        from_unit_id=from_unit_id,
        to_unit_id=to_unit_id,
        transfer_type=transfer_type,
        effective_date=effective_date,
        reason=reason,
    )
    db.add(transfer)

    # Update employee's primary unit
    employee.primary_unit_id = to_unit_id

    db.commit()
    db.refresh(transfer)
    return transfer


def get_transfer_history(
    db: Session,
    employee_id: int,
) -> List[EmployeeTransfer]:
    """Get employee transfer history."""
    return (
        db.query(EmployeeTransfer)
        .filter(EmployeeTransfer.employee_id == employee_id)
        .options(
            joinedload(EmployeeTransfer.from_unit),
            joinedload(EmployeeTransfer.to_unit),
        )
        .order_by(EmployeeTransfer.effective_date.desc())
        .all()
    )


def is_employee_no_exists(db: Session, employee_no: str, exclude_id: Optional[int] = None) -> bool:
    """Check if employee number already exists."""
    query = db.query(Employee).filter(Employee.employee_no == employee_no)
    if exclude_id:
        query = query.filter(Employee.id != exclude_id)
    return query.count() > 0
