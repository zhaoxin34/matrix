"""组织架构仪表盘 API 路由"""

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_database
from app.models.employee import Employee, EmployeeStatus
from app.models.org_unit import OrganizationUnit
from app.models.user import User
from app.schemas.response import ApiResponse
from app.services.org_permission_service import OrgPermissionService

router = APIRouter(prefix="/org", tags=["组织架构仪表盘"])


@router.get("/dashboard", response_model=ApiResponse[dict])
def get_org_dashboard(
    db: Session = Depends(get_database),
    current_user: User = Depends(get_current_user),
):
    """组织架构仪表盘统计数据"""
    perm_service = OrgPermissionService(db)
    permitted_ids = perm_service.get_permitted_unit_ids(current_user)

    # 组织单元统计
    unit_q = db.query(func.count(OrganizationUnit.id))
    if permitted_ids is not None:
        unit_q = unit_q.filter(OrganizationUnit.id.in_(permitted_ids))
    org_count = unit_q.scalar() or 0

    # 员工统计
    emp_q = db.query(Employee)
    if permitted_ids is not None:
        emp_q = emp_q.filter(Employee.primary_unit_id.in_(permitted_ids))

    total_employees = emp_q.count()
    on_job = emp_q.filter(Employee.status == EmployeeStatus.on_job).count()
    onboarding = emp_q.filter(Employee.status == EmployeeStatus.onboarding).count()

    return ApiResponse.success({
        "org_count": org_count,
        "total_employees": total_employees,
        "on_job": on_job,
        "onboarding": onboarding,
    })
