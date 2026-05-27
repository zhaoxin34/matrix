"""Organization Unit API routes."""

from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.error_codes import (
    ERR_CONFLICT,
    ERR_FORBIDDEN,
    ERR_INVALID_PARAMETER,
    ERR_NOT_FOUND,
    ERR_OK,
)
from app.database import get_db
from app.schemas.org import (
    OrgUnitCreate,
    OrgUnitResponse,
    OrgUnitStatusUpdate,
    OrgUnitUpdate,
)
from app.services.org_unit_service import OrgUnitService

router = APIRouter(prefix="/org-units", tags=["organization"])


def _make_error_response(code: int, message: str) -> dict:
    """Helper to create error response."""
    return {
        "code": code,
        "message": message,
        "data": None,
        "traceId": "",
        "timestamp": 0,
    }


@router.get("", response_model=dict)
async def list_org_units(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
) -> dict:
    """Get organization units list."""
    from app.models import OrgUnitStatus

    status_filter = None
    if status:
        try:
            status_filter = OrgUnitStatus(status)
        except ValueError:
            return _make_error_response(ERR_INVALID_PARAMETER, "无效的状态值")

    units = OrgUnitService.get_org_units(db, status_filter)

    return {
        "code": ERR_OK,
        "message": "ok",
        "data": [OrgUnitResponse.model_validate(unit) for unit in units],
        "traceId": "",
        "timestamp": 0,
    }


@router.get("/tree", response_model=dict)
async def get_org_unit_tree(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
) -> dict:
    """Get organization units as tree structure."""
    from app.models import OrgUnitStatus

    status_filter = None
    if status:
        try:
            status_filter = OrgUnitStatus(status)
        except ValueError:
            return _make_error_response(ERR_INVALID_PARAMETER, "无效的状态值")

    tree = OrgUnitService.get_org_unit_tree(db, status_filter)

    return {
        "code": ERR_OK,
        "message": "ok",
        "data": tree,
        "traceId": "",
        "timestamp": 0,
    }


@router.get("/{unit_id}", response_model=dict)
async def get_org_unit(
    unit_id: int,
    db: Session = Depends(get_db),
) -> dict:
    """Get organization unit by ID."""
    unit = OrgUnitService.get_org_unit_by_id(unit_id, db)
    if not unit:
        return _make_error_response(ERR_NOT_FOUND, "组织不存在")

    return {
        "code": ERR_OK,
        "message": "ok",
        "data": OrgUnitResponse.model_validate(unit),
        "traceId": "",
        "timestamp": 0,
    }


@router.post("", response_model=dict)
async def create_org_unit(
    request: OrgUnitCreate,
    db: Session = Depends(get_db),
) -> dict:
    """Create a new organization unit."""
    from app.models import OrgUnitType

    # Convert string type to enum
    try:
        unit_type = OrgUnitType(request.type.value)
    except ValueError:
        return _make_error_response(ERR_INVALID_PARAMETER, "无效的组织类型")

    unit, error = OrgUnitService.create_org_unit(
        db,
        name=request.name,
        code=request.code,
        type=unit_type,
        parent_id=request.parent_id,
        sort_order=request.sort_order,
        leader_id=request.leader_id,
    )

    if error:
        return _make_error_response(ERR_CONFLICT, error)

    return {
        "code": ERR_OK,
        "message": "组织创建成功",
        "data": OrgUnitResponse.model_validate(unit),
        "traceId": "",
        "timestamp": 0,
    }


@router.put("/{unit_id}", response_model=dict)
async def update_org_unit(
    unit_id: int,
    request: OrgUnitUpdate,
    db: Session = Depends(get_db),
) -> dict:
    """Update organization unit."""
    unit, error = OrgUnitService.update_org_unit(
        db,
        unit_id=unit_id,
        name=request.name,
        sort_order=request.sort_order,
        leader_id=request.leader_id,
    )

    if error:
        return _make_error_response(ERR_NOT_FOUND, error)

    return {
        "code": ERR_OK,
        "message": "组织信息已更新",
        "data": OrgUnitResponse.model_validate(unit),
        "traceId": "",
        "timestamp": 0,
    }


@router.patch("/{unit_id}/status", response_model=dict)
async def update_org_unit_status(
    unit_id: int,
    request: OrgUnitStatusUpdate,
    db: Session = Depends(get_db),
) -> dict:
    """Update organization unit status."""
    from app.models import OrgUnitStatus

    try:
        status = OrgUnitStatus(request.status.value)
    except ValueError:
        return _make_error_response(ERR_INVALID_PARAMETER, "无效的状态值")

    unit, error = OrgUnitService.update_org_unit_status(db, unit_id, status)

    if error:
        return _make_error_response(ERR_FORBIDDEN, error)

    return {
        "code": ERR_OK,
        "message": "状态已更新",
        "data": OrgUnitResponse.model_validate(unit),
        "traceId": "",
        "timestamp": 0,
    }


@router.delete("/{unit_id}", response_model=dict)
async def delete_org_unit(
    unit_id: int,
    db: Session = Depends(get_db),
) -> dict:
    """Delete organization unit."""
    success, error = OrgUnitService.delete_org_unit(db, unit_id)

    if error:
        return _make_error_response(ERR_FORBIDDEN, error)

    return {
        "code": ERR_OK,
        "message": "组织已删除",
        "data": None,
        "traceId": "",
        "timestamp": 0,
    }


@router.get("/{unit_id}/children", response_model=dict)
async def get_children_units(
    unit_id: int,
    db: Session = Depends(get_db),
) -> dict:
    """Get child organization units."""
    # Check if parent exists
    parent = OrgUnitService.get_org_unit_by_id(unit_id, db)
    if not parent:
        return _make_error_response(ERR_NOT_FOUND, "组织不存在")

    children = OrgUnitService.get_children_units(db, unit_id)

    return {
        "code": ERR_OK,
        "message": "ok",
        "data": [OrgUnitResponse.model_validate(child) for child in children],
        "traceId": "",
        "timestamp": 0,
    }
