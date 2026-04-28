"""Skills API router."""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_database
from app.models.skill import SkillLevel, SkillStatus
from app.models.user import User
from app.schemas.response import ApiResponse
from app.schemas.skill import (
    PublishRequest,
    RollbackRequest,
    SkillCreate,
    SkillListResponse,
    SkillResponse,
    SkillUpdate,
    SkillVersionResponse,
)
from app.services.skill_service import SkillService

router = APIRouter(prefix="/skills", tags=["技能库"])


def get_skill_service(db: Session = Depends(get_database)) -> SkillService:
    """Get skill service dependency."""
    return SkillService(db)


@router.post("", response_model=ApiResponse[SkillResponse], status_code=201)
def create_skill(
    data: SkillCreate,
    service: SkillService = Depends(get_skill_service),
    current_user: User = Depends(get_current_user),
):
    """创建技能（默认状态为 draft）"""
    skill = service.create_skill(data)
    return ApiResponse.success(SkillResponse.model_validate(skill))


@router.get("", response_model=ApiResponse[SkillListResponse])
def list_skills(
    level: Optional[SkillLevel] = Query(None, description="技能级别筛选"),
    tags: Optional[str] = Query(None, description="标签筛选，逗号分隔"),
    status: Optional[SkillStatus] = Query(None, description="状态筛选"),
    status_list: Optional[str] = Query(None, description="状态筛选（多个，逗号分隔）"),
    include_deleted: bool = Query(False, description="包含已删除"),
    keyword: Optional[str] = Query(None, description="关键词搜索(code或name)"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    service: SkillService = Depends(get_skill_service),
):
    """获取技能列表（默认只返回 active 状态）"""
    tag_list = tags.split(",") if tags else None
    status_list_enum = [SkillStatus(s.strip()) for s in status_list.split(",")] if status_list else None
    result = service.list_skills(
        level=level,
        tags=tag_list,
        status=status,
        status_list=status_list_enum,
        include_deleted=include_deleted,
        keyword=keyword,
        page=page,
        page_size=page_size,
    )
    return ApiResponse.success(result)


@router.get("/{code}", response_model=ApiResponse[SkillResponse])
def get_skill(
    code: str,
    service: SkillService = Depends(get_skill_service),
):
    """获取技能详情"""
    skill = service.get_skill(code)
    return ApiResponse.success(SkillResponse.model_validate(skill))


@router.put("/{code}", response_model=ApiResponse[SkillResponse])
def update_skill(
    code: str,
    data: SkillUpdate,
    service: SkillService = Depends(get_skill_service),
    current_user: User = Depends(get_current_user),
):
    """更新技能"""
    skill = service.update_skill(code, data)
    return ApiResponse.success(SkillResponse.model_validate(skill))


@router.delete("/{code}", status_code=204)
def delete_skill(
    code: str,
    service: SkillService = Depends(get_skill_service),
    current_user: User = Depends(get_current_user),
):
    """软删除技能"""
    service.delete_skill(code)
    return None


@router.patch("/{code}/activate", response_model=ApiResponse[SkillResponse])
def activate_skill(
    code: str,
    service: SkillService = Depends(get_skill_service),
    current_user: User = Depends(get_current_user),
):
    """启用技能"""
    skill = service.activate_skill(code)
    return ApiResponse.success(SkillResponse.model_validate(skill))


@router.patch("/{code}/deactivate", response_model=ApiResponse[SkillResponse])
def deactivate_skill(
    code: str,
    service: SkillService = Depends(get_skill_service),
    current_user: User = Depends(get_current_user),
):
    """禁用技能"""
    skill = service.deactivate_skill(code)
    return ApiResponse.success(SkillResponse.model_validate(skill))


@router.post("/{code}/publish", response_model=ApiResponse[SkillResponse])
def publish_skill(
    code: str,
    data: PublishRequest,
    service: SkillService = Depends(get_skill_service),
    current_user: User = Depends(get_current_user),
):
    """发布技能：保存内容到版本历史并设为启用状态"""
    skill = service.publish_skill(code, data.version, data.comment)
    return ApiResponse.success(SkillResponse.model_validate(skill))


@router.get("/{code}/versions", response_model=ApiResponse[list[SkillVersionResponse]])
def list_skill_versions(
    code: str,
    service: SkillService = Depends(get_skill_service),
):
    """获取技能版本历史"""
    versions = service.get_skill_versions(code)
    return ApiResponse.success([SkillVersionResponse.model_validate(v) for v in versions])


@router.post("/{code}/rollback", response_model=ApiResponse[SkillResponse])
def rollback_skill(
    code: str,
    data: RollbackRequest,
    service: SkillService = Depends(get_skill_service),
    current_user: User = Depends(get_current_user),
):
    """回滚技能到指定版本"""
    skill = service.rollback_skill(code, data.version)
    return ApiResponse.success(SkillResponse.model_validate(skill))
