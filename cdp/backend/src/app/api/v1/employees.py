"""员工 API 路由"""

from typing import Optional

from fastapi import APIRouter, Depends, File, Query, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_database
from app.models.employee import EmployeeStatus
from app.models.user import User
from app.schemas.employee import (
    EmployeeBindUser,
    EmployeeCreate,
    EmployeeListResponse,
    EmployeeResponse,
    EmployeeTransferCreate,
    EmployeeTransferResponse,
    EmployeeUpdate,
)
from app.schemas.response import ApiResponse
from app.services.employee_service import EmployeeService
from app.services.org_permission_service import OrgPermissionService

router = APIRouter(prefix="/employees", tags=["员工管理"])


def get_employee_service(
    db: Session = Depends(get_database),
    current_user: User = Depends(get_current_user),
) -> EmployeeService:
    perm_service = OrgPermissionService(db)
    permitted_ids = perm_service.get_permitted_unit_ids(current_user)
    return EmployeeService(db, permitted_ids)


@router.get("", response_model=ApiResponse[EmployeeListResponse])
def list_employees(
    unit_id: Optional[int] = Query(None),
    include_subordinates: bool = Query(False),
    status: Optional[EmployeeStatus] = Query(None),
    keyword: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    service: EmployeeService = Depends(get_employee_service),
):
    """获取员工列表"""
    result = service.list_employees(
        unit_id=unit_id,
        include_subordinates=include_subordinates,
        status=status,
        keyword=keyword,
        page=page,
        page_size=page_size,
    )
    return ApiResponse.success(result)


@router.get("/{employee_id}", response_model=ApiResponse[EmployeeResponse])
def get_employee(
    employee_id: int,
    service: EmployeeService = Depends(get_employee_service),
):
    """获取员工详情"""
    emp = service.get_employee(employee_id)
    secondary_unit_ids = [s.unit_id for s in emp.secondary_units]
    return ApiResponse.success(
        EmployeeResponse(
            id=emp.id,
            employee_no=emp.employee_no,
            name=emp.name,
            phone=emp.phone,
            email=emp.email,
            position=emp.position,
            primary_unit_id=emp.primary_unit_id,
            status=emp.status,
            entry_date=emp.entry_date,
            dimission_date=emp.dimission_date,
            secondary_unit_ids=secondary_unit_ids,
            user_mapping=emp.user_mapping,
            created_at=emp.created_at,
            updated_at=emp.updated_at,
        )
    )


@router.post("", response_model=ApiResponse[EmployeeResponse])
def create_employee(
    data: EmployeeCreate,
    service: EmployeeService = Depends(get_employee_service),
):
    """创建员工"""
    emp = service.create_employee(data)
    secondary_unit_ids = [s.unit_id for s in emp.secondary_units]
    return ApiResponse.success(
        EmployeeResponse(
            id=emp.id,
            employee_no=emp.employee_no,
            name=emp.name,
            phone=emp.phone,
            email=emp.email,
            position=emp.position,
            primary_unit_id=emp.primary_unit_id,
            status=emp.status,
            entry_date=emp.entry_date,
            dimission_date=emp.dimission_date,
            secondary_unit_ids=secondary_unit_ids,
            user_mapping=emp.user_mapping,
            created_at=emp.created_at,
            updated_at=emp.updated_at,
        )
    )


@router.put("/{employee_id}", response_model=ApiResponse[EmployeeResponse])
def update_employee(
    employee_id: int,
    data: EmployeeUpdate,
    service: EmployeeService = Depends(get_employee_service),
):
    """更新员工信息"""
    emp = service.update_employee(employee_id, data)
    secondary_unit_ids = [s.unit_id for s in emp.secondary_units]
    return ApiResponse.success(
        EmployeeResponse(
            id=emp.id,
            employee_no=emp.employee_no,
            name=emp.name,
            phone=emp.phone,
            email=emp.email,
            position=emp.position,
            primary_unit_id=emp.primary_unit_id,
            status=emp.status,
            entry_date=emp.entry_date,
            dimission_date=emp.dimission_date,
            secondary_unit_ids=secondary_unit_ids,
            user_mapping=emp.user_mapping,
            created_at=emp.created_at,
            updated_at=emp.updated_at,
        )
    )


@router.delete("/{employee_id}", response_model=ApiResponse[None])
def delete_employee(
    employee_id: int,
    service: EmployeeService = Depends(get_employee_service),
):
    """删除员工（软删除，标记为离职）"""
    service.delete_employee(employee_id)
    return ApiResponse.success(None)


@router.post("/{employee_id}/bind-user", response_model=ApiResponse[EmployeeResponse])
def bind_user(
    employee_id: int,
    data: EmployeeBindUser,
    service: EmployeeService = Depends(get_employee_service),
):
    """绑定账号"""
    emp = service.bind_user(employee_id, data.user_id)
    secondary_unit_ids = [s.unit_id for s in emp.secondary_units]
    return ApiResponse.success(
        EmployeeResponse(
            id=emp.id,
            employee_no=emp.employee_no,
            name=emp.name,
            phone=emp.phone,
            email=emp.email,
            position=emp.position,
            primary_unit_id=emp.primary_unit_id,
            status=emp.status,
            entry_date=emp.entry_date,
            dimission_date=emp.dimission_date,
            secondary_unit_ids=secondary_unit_ids,
            user_mapping=emp.user_mapping,
            created_at=emp.created_at,
            updated_at=emp.updated_at,
        )
    )


@router.delete("/{employee_id}/bind-user", response_model=ApiResponse[None])
def unbind_user(
    employee_id: int,
    service: EmployeeService = Depends(get_employee_service),
):
    """解绑账号"""
    service.unbind_user(employee_id)
    return ApiResponse.success(None)


@router.post("/{employee_id}/transfers", response_model=ApiResponse[EmployeeTransferResponse])
def initiate_transfer(
    employee_id: int,
    data: EmployeeTransferCreate,
    service: EmployeeService = Depends(get_employee_service),
):
    """发起调动"""
    transfer = service.initiate_transfer(employee_id, data)
    return ApiResponse.success(EmployeeTransferResponse.model_validate(transfer))


@router.post("/{employee_id}/transfers/{transfer_id}/approve", response_model=ApiResponse[EmployeeResponse])
def approve_transfer(
    employee_id: int,
    transfer_id: int,
    service: EmployeeService = Depends(get_employee_service),
):
    """执行/审批调动"""
    emp = service.approve_transfer(employee_id, transfer_id)
    secondary_unit_ids = [s.unit_id for s in emp.secondary_units]
    return ApiResponse.success(
        EmployeeResponse(
            id=emp.id,
            employee_no=emp.employee_no,
            name=emp.name,
            phone=emp.phone,
            email=emp.email,
            position=emp.position,
            primary_unit_id=emp.primary_unit_id,
            status=emp.status,
            entry_date=emp.entry_date,
            dimission_date=emp.dimission_date,
            secondary_unit_ids=secondary_unit_ids,
            user_mapping=emp.user_mapping,
            created_at=emp.created_at,
            updated_at=emp.updated_at,
        )
    )


@router.get("/{employee_id}/transfers", response_model=ApiResponse[list[EmployeeTransferResponse]])
def get_transfer_history(
    employee_id: int,
    service: EmployeeService = Depends(get_employee_service),
):
    """查看调动历史"""
    transfers = service.get_transfer_history(employee_id)
    return ApiResponse.success([EmployeeTransferResponse.model_validate(t) for t in transfers])


@router.post("/import", response_model=ApiResponse[dict])
async def import_employees(
    file: UploadFile = File(...),
    service: EmployeeService = Depends(get_employee_service),
):
    """批量导入员工（Excel）"""
    result = await service.import_employees_from_excel(file)
    return ApiResponse.success(result)


@router.get("/export", response_class=StreamingResponse)
def export_employees(
    unit_id: Optional[int] = Query(None),
    include_subordinates: bool = Query(False),
    status: Optional[EmployeeStatus] = Query(None),
    service: EmployeeService = Depends(get_employee_service),
):
    """导出员工列表（Excel）"""
    return service.export_employees_to_excel(
        unit_id=unit_id,
        include_subordinates=include_subordinates,
        status=status,
    )
