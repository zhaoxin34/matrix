"""Project API routes."""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_database
from app.models.user import User
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectListResponse,
    ProjectMemberCreate,
    ProjectMemberUpdate,
    ProjectMemberResponse,
    ProjectMemberListResponse,
    OrgProjectCreate,
    OrgProjectResponse,
    OrgProjectListResponse,
    UserProjectResponse,
    UserProjectListResponse,
)
from app.schemas.response import ApiResponse
from app.services.project_service import ProjectService, ProjectMemberService, OrgProjectService
from app.services.user_service import UserService

router = APIRouter(prefix="/projects", tags=["项目管理"])


def get_project_service(db: Session = Depends(get_database)) -> ProjectService:
    return ProjectService(db)


def get_project_member_service(db: Session = Depends(get_database)) -> ProjectMemberService:
    return ProjectMemberService(db)


def get_org_project_service(db: Session = Depends(get_database)) -> OrgProjectService:
    return OrgProjectService(db)


# =============================================================================
# Project CRUD
# =============================================================================

@router.post("", response_model=ApiResponse[ProjectResponse])
def create_project(
    data: ProjectCreate,
    service: ProjectService = Depends(get_project_service),
    current_user: User = Depends(get_current_user),
):
    """创建新项目"""
    project = service.create_project(data, current_user.id)
    return ApiResponse.success(ProjectResponse.model_validate(project))


@router.get("", response_model=ApiResponse[ProjectListResponse])
def list_projects(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    service: ProjectService = Depends(get_project_service),
):
    """获取项目列表"""
    from app.models.project import ProjectStatus
    status_enum = ProjectStatus(status) if status else None
    items, total = service.list_projects(page=page, page_size=page_size, status=status_enum)
    return ApiResponse.success(ProjectListResponse(
        items=[ProjectResponse.model_validate(p) for p in items],
        total=total,
        page=page,
        page_size=page_size,
    ))


@router.get("/{project_id}", response_model=ApiResponse[ProjectResponse])
def get_project(
    project_id: int,
    service: ProjectService = Depends(get_project_service),
):
    """获取项目详情"""
    project = service.get_project(project_id)
    return ApiResponse.success(ProjectResponse.model_validate(project))


@router.put("/{project_id}", response_model=ApiResponse[ProjectResponse])
def update_project(
    project_id: int,
    data: ProjectUpdate,
    service: ProjectService = Depends(get_project_service),
):
    """更新项目"""
    project = service.update_project(project_id, data)
    return ApiResponse.success(ProjectResponse.model_validate(project))


@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    service: ProjectService = Depends(get_project_service),
):
    """删除项目"""
    service.delete_project(project_id)
    return ApiResponse.success({"message": "项目已删除"})


# =============================================================================
# Project Members
# =============================================================================

@router.post("/{project_id}/members", response_model=ApiResponse[ProjectMemberResponse])
def add_member(
    project_id: int,
    data: ProjectMemberCreate,
    service: ProjectMemberService = Depends(get_project_member_service),
):
    """添加项目成员"""
    member = service.add_member(project_id, data)
    return ApiResponse.success(ProjectMemberResponse.model_validate(member))


@router.get("/{project_id}/members", response_model=ApiResponse[ProjectMemberListResponse])
def list_members(
    project_id: int,
    service: ProjectMemberService = Depends(get_project_member_service),
):
    """获取项目成员列表"""
    members = service.list_members(project_id)
    return ApiResponse.success(ProjectMemberListResponse(
        items=[ProjectMemberResponse.model_validate(m) for m in members],
        total=len(members),
    ))


@router.put("/{project_id}/members/{user_id}", response_model=ApiResponse[ProjectMemberResponse])
def update_member_role(
    project_id: int,
    user_id: int,
    data: ProjectMemberUpdate,
    service: ProjectMemberService = Depends(get_project_member_service),
):
    """更新成员角色"""
    member = service.update_member_role(project_id, user_id, data)
    return ApiResponse.success(ProjectMemberResponse.model_validate(member))


@router.delete("/{project_id}/members/{user_id}")
def remove_member(
    project_id: int,
    user_id: int,
    service: ProjectMemberService = Depends(get_project_member_service),
):
    """移除项目成员"""
    service.remove_member(project_id, user_id)
    return ApiResponse.success({"message": "成员已移除"})


# =============================================================================
# Organization Associations
# =============================================================================

@router.post("/{project_id}/organizations", response_model=ApiResponse[OrgProjectResponse])
def associate_org(
    project_id: int,
    data: OrgProjectCreate,
    service: OrgProjectService = Depends(get_org_project_service),
):
    """关联组织到项目"""
    assoc = service.associate_org(project_id, data)
    return ApiResponse.success(OrgProjectResponse.model_validate(assoc))


@router.get("/{project_id}/organizations", response_model=ApiResponse[OrgProjectListResponse])
def list_project_orgs(
    project_id: int,
    service: OrgProjectService = Depends(get_org_project_service),
):
    """获取项目关联的组织列表"""
    orgs = service.list_project_orgs(project_id)
    return ApiResponse.success(OrgProjectListResponse(
        items=[OrgProjectResponse.model_validate(o) for o in orgs],
        total=len(orgs),
    ))


@router.delete("/{project_id}/organizations/{org_id}")
def disassociate_org(
    project_id: int,
    org_id: int,
    service: OrgProjectService = Depends(get_org_project_service),
):
    """取消组织关联"""
    service.disassociate_org(project_id, org_id)
    return ApiResponse.success({"message": "关联已取消"})


# =============================================================================
# User Projects (current user's projects)
# =============================================================================

@router.get("/users/me/projects", response_model=ApiResponse[UserProjectListResponse])
def get_current_user_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database),
):
    """获取当前用户所属的项目列表"""
    from app.models.project import ProjectMemberRole
    from app.repositories.project_repo import ProjectMemberRepository

    member_repo = ProjectMemberRepository(db)
    members = member_repo.find_by_user_id(current_user.id)

    items = []
    for m in members:
        items.append(UserProjectResponse(
            id=m.project.id,
            name=m.project.name,
            code=m.project.code,
            status=m.project.status,
            role=m.role,
            created_at=m.created_at,
        ))

    return ApiResponse.success(UserProjectListResponse(items=items, total=len(items)))