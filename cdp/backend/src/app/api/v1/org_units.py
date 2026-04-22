"""组织单元 API 路由"""


from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_database
from app.models.user import User
from app.schemas.org_unit import (
    OrgUnitCreate,
    OrgUnitMove,
    OrgUnitResponse,
    OrgUnitTreeNode,
    OrgUnitUpdate,
)
from app.schemas.response import ApiResponse
from app.services.org_permission_service import OrgPermissionService
from app.services.org_unit_service import OrgUnitService

router = APIRouter(prefix="/org-units", tags=["组织单元"])


def get_org_unit_service(
    db: Session = Depends(get_database),
    current_user: User = Depends(get_current_user),
) -> OrgUnitService:
    perm_service = OrgPermissionService(db)
    permitted_ids = perm_service.get_permitted_unit_ids(current_user)
    return OrgUnitService(db, permitted_ids)


@router.get("/tree", response_model=ApiResponse[list[OrgUnitTreeNode]])
def get_org_tree(
    service: OrgUnitService = Depends(get_org_unit_service),
):
    """获取组织树"""
    tree = service.get_tree()
    return ApiResponse.success(tree)


@router.get("/{unit_id}", response_model=ApiResponse[OrgUnitResponse])
def get_org_unit(
    unit_id: int,
    service: OrgUnitService = Depends(get_org_unit_service),
):
    """获取单个组织单元"""
    unit = service.get_unit(unit_id)
    return ApiResponse.success(OrgUnitResponse.model_validate(unit))


@router.post("", response_model=ApiResponse[OrgUnitResponse])
def create_org_unit(
    data: OrgUnitCreate,
    service: OrgUnitService = Depends(get_org_unit_service),
):
    """创建组织单元"""
    unit = service.create_unit(data)
    return ApiResponse.success(OrgUnitResponse.model_validate(unit))


@router.put("/{unit_id}", response_model=ApiResponse[OrgUnitResponse])
def update_org_unit(
    unit_id: int,
    data: OrgUnitUpdate,
    service: OrgUnitService = Depends(get_org_unit_service),
):
    """更新组织单元"""
    unit = service.update_unit(unit_id, data)
    return ApiResponse.success(OrgUnitResponse.model_validate(unit))


@router.delete("/{unit_id}", response_model=ApiResponse[None])
def delete_org_unit(
    unit_id: int,
    service: OrgUnitService = Depends(get_org_unit_service),
):
    """删除组织单元"""
    service.delete_unit(unit_id)
    return ApiResponse.success(None)


@router.post("/{unit_id}/move", response_model=ApiResponse[OrgUnitResponse])
def move_org_unit(
    unit_id: int,
    data: OrgUnitMove,
    service: OrgUnitService = Depends(get_org_unit_service),
):
    """移动组织单元"""
    unit = service.move_unit(unit_id, data)
    return ApiResponse.success(OrgUnitResponse.model_validate(unit))


@router.post("/{unit_id}/toggle-status", response_model=ApiResponse[OrgUnitResponse])
def toggle_org_unit_status(
    unit_id: int,
    service: OrgUnitService = Depends(get_org_unit_service),
):
    """启用/禁用组织单元"""
    unit = service.toggle_status(unit_id)
    return ApiResponse.success(OrgUnitResponse.model_validate(unit))
