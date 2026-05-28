"""Employee API routes."""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.error_codes import (
    ERR_CONFLICT,
    ERR_FORBIDDEN,
    ERR_INVALID_PARAMETER,
    ERR_NOT_FOUND,
    ERR_OK,
    ERR_USER_ALREADY_LINKED,
)
from app.database import get_db
from app.models import EmployeeStatus, TransferType
from app.schemas.org import (
    EmployeeCreate,
    EmployeeTransferRequest,
    EmployeeUpdate,
    OrgUnitSimple,
    UserSimple,
)
from app.services import user_service as us
from app.services.employee_service import EmployeeService

router = APIRouter(prefix="/employees", tags=["employee"])


def _make_error_response(code: int, message: str) -> dict:
    """Helper to create error response."""
    return {
        "code": code,
        "message": message,
        "data": None,
        "traceId": "",
        "timestamp": 0,
    }


def _employee_to_response(db: Session, employee, include_user: bool = True) -> dict:
    """Convert employee model to response dict."""
    primary_unit = None
    if employee.primary_unit:
        primary_unit = OrgUnitSimple(
            id=employee.primary_unit.id,
            name=employee.primary_unit.name,
            code=employee.primary_unit.code,
            type=employee.primary_unit.type,
        ).model_dump()

    secondary_units = []
    if employee.secondary_units:
        secondary_units = [
            OrgUnitSimple(
                id=su.unit.id,
                name=su.unit.name,
                code=su.unit.code,
                type=su.unit.type,
            ).model_dump()
            for su in employee.secondary_units
        ]

    # Get linked user if requested
    user_info = None
    if include_user:
        user_info = us.get_user_with_link_status_by_employee_id(db, employee.id)

    user_data = None
    if user_info:
        user_data = UserSimple(
            id=int(user_info["id"]),
            phone=str(user_info["phone"]),
        ).model_dump()

    return {
        "id": employee.id,
        "employee_no": employee.employee_no,
        "name": employee.name,
        "phone": employee.phone,
        "email": employee.email,
        "position": employee.position,
        "primary_unit": primary_unit,
        "secondary_units": secondary_units,
        "user": user_data,
        "status": employee.status,
        "entry_date": employee.entry_date.isoformat() if employee.entry_date else None,
        "dimission_date": employee.dimission_date.isoformat() if employee.dimission_date else None,
        "is_deleted": employee.is_deleted,
        "created_at": employee.created_at.isoformat() if employee.created_at else None,
        "updated_at": employee.updated_at.isoformat() if employee.updated_at else None,
    }


@router.get("", response_model=dict)
async def list_employees(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    unit_id: Optional[int] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    include_deleted: bool = Query(False, description="是否包含已删除员工"),
    db: Session = Depends(get_db),
) -> dict:
    """Get paginated employee list."""
    status_filter = None
    if status:
        try:
            status_filter = EmployeeStatus(status)
        except ValueError:
            return _make_error_response(ERR_INVALID_PARAMETER, "无效的状态值")

    employees, total = EmployeeService.get_employees(
        db,
        page=page,
        page_size=page_size,
        unit_id=unit_id,
        status=status_filter,
        search=search,
        include_deleted=include_deleted,
    )

    return {
        "code": ERR_OK,
        "message": "ok",
        "data": {
            "total": total,
            "page": page,
            "page_size": page_size,
            "list": [_employee_to_response(db, emp) for emp in employees],
        },
        "traceId": "",
        "timestamp": 0,
    }


@router.get("/{employee_id}", response_model=dict)
async def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
) -> dict:
    """Get employee by ID."""
    employee = EmployeeService.get_employee_by_id(db, employee_id)
    if not employee:
        return _make_error_response(ERR_NOT_FOUND, "员工不存在")

    return {
        "code": ERR_OK,
        "message": "ok",
        "data": _employee_to_response(db, employee),
        "traceId": "",
        "timestamp": 0,
    }


@router.post("", response_model=dict)
async def create_employee(
    request: EmployeeCreate,
    db: Session = Depends(get_db),
) -> dict:
    """Create a new employee.

    Requires user_id to be linked.
    Phone number will be synced from the linked user.
    """
    # Get linked user to validate phone and get user info
    user_info = us.get_user_with_link_status(db, request.user_id)
    if not user_info:
        return _make_error_response(ERR_NOT_FOUND, "用户不存在")

    # Check if user is already linked to another employee
    if user_info.get("linked_employee"):
        return _make_error_response(
            ERR_USER_ALREADY_LINKED,
            "该用户已关联到其他员工",
        )

    # Sync name and phone from linked user
    synced_name = user_info.get("username") or request.name or ""
    synced_phone = user_info.get("phone")

    # Create employee with synced name and phone from user
    employee, error = EmployeeService.create_employee(
        db,
        employee_no=request.employee_no,
        name=synced_name,
        phone=synced_phone,
        email=request.email,
        position=request.position,
        primary_unit_id=request.primary_unit_id,
        entry_date=request.entry_date,
        secondary_unit_ids=request.secondary_unit_ids,
        user_id=request.user_id,
    )

    if error:
        return _make_error_response(ERR_CONFLICT, error)

    return {
        "code": ERR_OK,
        "message": "员工创建成功",
        "data": _employee_to_response(db, employee),
        "traceId": "",
        "timestamp": 0,
    }


@router.put("/{employee_id}", response_model=dict)
async def update_employee(
    employee_id: int,
    request: EmployeeUpdate,
    db: Session = Depends(get_db),
) -> dict:
    """Update employee profile."""
    employee, error = EmployeeService.update_employee(
        db,
        employee_id=employee_id,
        name=request.name,
        phone=request.phone,
        email=request.email,
        position=request.position,
        primary_unit_id=request.primary_unit_id,
        entry_date=request.entry_date,
        status=request.status.value if request.status else None,
    )

    if error:
        return _make_error_response(ERR_NOT_FOUND, error)

    return {
        "code": ERR_OK,
        "message": "员工信息已更新",
        "data": _employee_to_response(db, employee),
        "traceId": "",
        "timestamp": 0,
    }


@router.delete("/{employee_id}", response_model=dict)
async def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
) -> dict:
    """Soft delete an employee."""
    success, error = EmployeeService.soft_delete_employee(db, employee_id)

    if error:
        return _make_error_response(ERR_FORBIDDEN, error)

    return {
        "code": ERR_OK,
        "message": "员工已删除",
        "data": None,
        "traceId": "",
        "timestamp": 0,
    }


@router.post("/{employee_id}/restore", response_model=dict)
async def restore_employee(
    employee_id: int,
    db: Session = Depends(get_db),
) -> dict:
    """ "Restore a soft-deleted employee."""
    success, error = EmployeeService.restore_employee(db, employee_id)
    if error:
        return _make_error_response(ERR_NOT_FOUND, error)
    return {
        "code": ERR_OK,
        "message": "员工已恢复",
        "data": None,
        "traceId": "",
        "timestamp": 0,
    }


def _transfer_to_response(transfer) -> dict:
    """Convert transfer model to response dict with type assertions."""
    from_unit_data = None
    from_unit = transfer.from_unit
    if from_unit is not None:
        from_unit_data = OrgUnitSimple(
            id=from_unit.id,
            name=from_unit.name,
            code=from_unit.code,
            type=from_unit.type,
        ).model_dump()

    to_unit = transfer.to_unit
    to_unit_data = OrgUnitSimple(
        id=to_unit.id,
        name=to_unit.name,
        code=to_unit.code,
        type=to_unit.type,
    ).model_dump()

    effective_date = transfer.effective_date
    created_at = transfer.created_at

    return {
        "id": transfer.id,
        "employee_id": transfer.employee_id,
        "from_unit": from_unit_data,
        "to_unit": to_unit_data,
        "transfer_type": transfer.transfer_type,
        "effective_date": effective_date.isoformat() if effective_date else None,
        "reason": transfer.reason,
        "created_at": created_at.isoformat() if created_at else None,
    }


@router.post("/{employee_id}/transfer", response_model=dict)
async def transfer_employee(
    employee_id: int,
    request: EmployeeTransferRequest,
    db: Session = Depends(get_db),
) -> dict:
    """Transfer employee to a new organization unit."""
    try:
        transfer_type = TransferType(request.transfer_type.value)
    except ValueError:
        return _make_error_response(ERR_INVALID_PARAMETER, "无效的调动类型")

    transfer, error = EmployeeService.transfer_employee(
        db,
        employee_id=employee_id,
        to_unit_id=request.to_unit_id,
        transfer_type=transfer_type,
        effective_date=request.effective_date,
        reason=request.reason,
    )

    if error:
        return _make_error_response(ERR_FORBIDDEN, error)

    return {
        "code": ERR_OK,
        "message": "员工调动成功",
        "data": _transfer_to_response(transfer),
        "traceId": "",
        "timestamp": 0,
    }


@router.get("/{employee_id}/transfers", response_model=dict)
async def get_transfer_history(
    employee_id: int,
    db: Session = Depends(get_db),
) -> dict:
    """Get employee transfer history."""
    transfers, error = EmployeeService.get_transfer_history(db, employee_id)

    if error:
        return _make_error_response(ERR_NOT_FOUND, error)

    transfer_list = [_transfer_to_response(t) for t in transfers]

    return {
        "code": ERR_OK,
        "message": "ok",
        "data": transfer_list,
        "traceId": "",
        "timestamp": 0,
    }
