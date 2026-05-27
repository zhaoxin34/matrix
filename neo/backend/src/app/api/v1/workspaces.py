"""Workspace API endpoints."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import MemberRole, User, WorkspaceStatus
from app.repositories import workspace_repository as repo
from app.schemas.response import ApiResponse
from app.schemas.workspace import (
    MemberAdd,
    MemberListResponse,
    MemberResponse,
    MemberUpdate,
    TransferOwnerRequest,
    WorkspaceCreate,
    WorkspaceListResponse,
    WorkspaceResponse,
    WorkspaceUpdate,
)
from app.services import workspace_service

router = APIRouter(prefix="/workspaces", tags=["workspace"])


# ==================== Workspace CRUD ====================


@router.post("", response_model=ApiResponse[WorkspaceResponse])
async def create_workspace(
    request: Request,
    data: WorkspaceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[WorkspaceResponse]:
    """Create a new workspace.

    Only admin users can create workspaces.
    The creator becomes the owner automatically.
    """
    # Check admin permission
    if not current_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Only admin users can create workspaces",
        )

    # Check if name conflicts within the organization
    if repo.is_name_exists(db, data.name, data.org_id):
        raise HTTPException(
            status_code=409,
            detail="Workspace name already exists in this organization",
        )

    workspace, code = workspace_service.create_workspace(
        db=db,
        data=data,
        owner_id=current_user.id,
    )

    return ApiResponse.success(data=workspace)


@router.get("", response_model=ApiResponse[WorkspaceListResponse])
async def list_workspaces(
    request: Request,
    org_id: Optional[int] = Query(None, description="Filter by organization ID"),
    status: Optional[WorkspaceStatus] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search by workspace name"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[WorkspaceListResponse]:
    """List workspaces.

    Admin users can see all workspaces.
    Regular users can only see workspaces they are members of.
    """
    if current_user.is_admin:
        # Admin can see all workspaces
        result = workspace_service.get_workspaces(
            db=db,
            org_id=org_id,
            status=status,
            search=search,
            page=page,
            page_size=page_size,
        )
    else:
        # Regular users only see their own workspaces
        result = workspace_service.get_user_workspaces(
            db=db,
            user_id=current_user.id,
            status=status,
            search=search,
            page=page,
            page_size=page_size,
        )

    return ApiResponse.success(data=result)


@router.get("/my", response_model=ApiResponse[WorkspaceListResponse])
async def list_my_workspaces(
    request: Request,
    status: Optional[WorkspaceStatus] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search by workspace name"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[WorkspaceListResponse]:
    """List workspaces accessible by current user.

    Returns all workspaces the user is a member of.
    """
    result = workspace_service.get_user_workspaces(
        db=db,
        user_id=current_user.id,
        status=status,
        search=search,
        page=page,
        page_size=page_size,
    )

    return ApiResponse.success(data=result)


@router.get("/code/{code}", response_model=ApiResponse[WorkspaceResponse])
async def get_workspace_by_code(
    request: Request,
    code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[WorkspaceResponse]:
    """Get workspace by code.

    Only workspace members can view workspace details.
    """
    workspace = workspace_service.get_workspace_by_code(db, code)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Check if user has access
    if not current_user.is_admin and not workspace_service.is_member(db, workspace.id, current_user.id):
        raise HTTPException(
            status_code=403,
            detail="You don't have access to this workspace",
        )

    return ApiResponse.success(data=workspace)


@router.get("/{workspace_id}", response_model=ApiResponse[WorkspaceResponse])
async def get_workspace(
    request: Request,
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[WorkspaceResponse]:
    """Get workspace by ID.

    Only workspace members can view workspace details.
    """
    workspace = workspace_service.get_workspace(db, workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Check if user has access
    if not current_user.is_admin and not workspace_service.is_member(db, workspace_id, current_user.id):
        raise HTTPException(
            status_code=403,
            detail="You don't have access to this workspace",
        )

    return ApiResponse.success(data=workspace)


@router.patch("/{workspace_id}", response_model=ApiResponse[WorkspaceResponse])
async def update_workspace(
    request: Request,
    workspace_id: int,
    data: WorkspaceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[WorkspaceResponse]:
    """Update workspace information.

    Only workspace owner can update workspace.
    """
    # Check if workspace exists
    workspace = repo.get_workspace_by_id(db, workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Check if user is owner
    if not workspace_service.is_owner(db, workspace_id, current_user.id):
        raise HTTPException(
            status_code=403,
            detail="Only workspace owner can update workspace",
        )

    # Check if name conflicts
    if data.name and data.name != workspace.name:
        if repo.is_name_exists(db, data.name, workspace.org_id, workspace_id):
            raise HTTPException(
                status_code=409,
                detail="Workspace name already exists in this organization",
            )

    updated = workspace_service.update_workspace(db, workspace_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Workspace not found")

    return ApiResponse.success(data=updated)


@router.post("/{workspace_id}/disable", response_model=ApiResponse[WorkspaceResponse])
async def disable_workspace(
    request: Request,
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[WorkspaceResponse]:
    """Disable a workspace.

    Only workspace owner can disable workspace.
    """
    # Check if workspace exists
    workspace = repo.get_workspace_by_id(db, workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Check if user is owner
    if not workspace_service.is_owner(db, workspace_id, current_user.id):
        raise HTTPException(
            status_code=403,
            detail="Only workspace owner can disable workspace",
        )

    updated = workspace_service.disable_workspace(db, workspace_id, current_user.id)
    if not updated:
        raise HTTPException(status_code=404, detail="Workspace not found")

    return ApiResponse.success(data=updated)


@router.post("/{workspace_id}/enable", response_model=ApiResponse[WorkspaceResponse])
async def enable_workspace(
    request: Request,
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[WorkspaceResponse]:
    """Enable a workspace.

    Only workspace owner can enable workspace.
    """
    # Check if workspace exists
    workspace = repo.get_workspace_by_id(db, workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Check if user is owner
    if not workspace_service.is_owner(db, workspace_id, current_user.id):
        raise HTTPException(
            status_code=403,
            detail="Only workspace owner can enable workspace",
        )

    updated = workspace_service.enable_workspace(db, workspace_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Workspace not found")

    return ApiResponse.success(data=updated)


@router.post("/{workspace_id}/transfer-owner", response_model=ApiResponse[WorkspaceResponse])
async def transfer_ownership(
    request: Request,
    workspace_id: int,
    data: TransferOwnerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[WorkspaceResponse]:
    """Transfer workspace ownership to another user.

    Only workspace owner can transfer ownership.
    The original owner will become an admin.
    """
    # Check if workspace exists
    workspace = repo.get_workspace_by_id(db, workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Check if user is owner
    if not workspace_service.is_owner(db, workspace_id, current_user.id):
        raise HTTPException(
            status_code=403,
            detail="Only workspace owner can transfer ownership",
        )

    # Cannot transfer to self
    if data.new_owner_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot transfer ownership to yourself",
        )

    # Check if new owner exists
    if not repo.is_user_exists(db, data.new_owner_id):
        raise HTTPException(status_code=404, detail="User not found")

    updated = workspace_service.transfer_ownership(db, workspace_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Failed to transfer ownership")

    return ApiResponse.success(data=updated)


# ==================== Workspace Members ====================


@router.get("/{workspace_id}/members", response_model=ApiResponse[MemberListResponse])
async def list_members(
    request: Request,
    workspace_id: int,
    role: Optional[MemberRole] = Query(None, description="Filter by role"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[MemberListResponse]:
    """List workspace members.

    Only workspace members can view member list.
    """
    # Check if workspace exists
    if not repo.get_workspace_by_id(db, workspace_id):
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Check if user has access
    if not current_user.is_admin and not workspace_service.is_member(db, workspace_id, current_user.id):
        raise HTTPException(
            status_code=403,
            detail="You don't have access to this workspace",
        )

    result = workspace_service.get_members(
        db=db,
        workspace_id=workspace_id,
        role=role,
        page=page,
        page_size=page_size,
    )

    return ApiResponse.success(data=result)


@router.post("/{workspace_id}/members", response_model=ApiResponse[MemberResponse])
async def add_member(
    request: Request,
    workspace_id: int,
    data: MemberAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[MemberResponse]:
    """Add a member to workspace.

    Only workspace owner and admin can add members.
    """
    # Check if workspace exists
    if not repo.get_workspace_by_id(db, workspace_id):
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Check if user is owner or admin
    member_role = workspace_service.get_member_role(db, workspace_id, current_user.id)
    if not current_user.is_admin and member_role not in [
        MemberRole.OWNER,
        MemberRole.ADMIN,
    ]:
        raise HTTPException(
            status_code=403,
            detail="Only workspace owner or admin can add members",
        )

    # Cannot add self
    if data.user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot add yourself as a member",
        )

    member = workspace_service.add_member(db, workspace_id, data)
    if not member:
        raise HTTPException(
            status_code=409,
            detail="User not found or already a member",
        )

    return ApiResponse.success(data=member)


@router.patch("/{workspace_id}/members/{member_id}", response_model=ApiResponse[MemberResponse])
async def update_member(
    request: Request,
    workspace_id: int,
    member_id: int,
    data: MemberUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[MemberResponse]:
    """Update member role.

    Only workspace owner and admin can update roles.
    Cannot change owner's role.
    """
    # Check if workspace exists
    if not repo.get_workspace_by_id(db, workspace_id):
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Check if user is owner or admin
    member_role = workspace_service.get_member_role(db, workspace_id, current_user.id)
    if not current_user.is_admin and member_role not in [
        MemberRole.OWNER,
        MemberRole.ADMIN,
    ]:
        raise HTTPException(
            status_code=403,
            detail="Only workspace owner or admin can update member roles",
        )

    # Verify member belongs to this workspace
    member = repo.get_member_by_id(db, member_id)
    if not member or member.workspace_id != workspace_id:
        raise HTTPException(status_code=404, detail="Member not found")

    # Cannot change owner's role
    if member.role == MemberRole.OWNER:
        raise HTTPException(
            status_code=400,
            detail="Cannot change owner's role",
        )

    updated = workspace_service.update_member_role(db, workspace_id, member_id, data)
    if not updated:
        raise HTTPException(
            status_code=400,
            detail="Failed to update member role",
        )

    return ApiResponse.success(data=updated)


@router.delete("/{workspace_id}/members/{member_id}")
async def remove_member(
    request: Request,
    workspace_id: int,
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse:
    """Remove a member from workspace.

    Only workspace owner and admin can remove members.
    Cannot remove owner.
    """
    # Check if workspace exists
    if not repo.get_workspace_by_id(db, workspace_id):
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Check if user is owner or admin
    member_role = workspace_service.get_member_role(db, workspace_id, current_user.id)
    if not current_user.is_admin and member_role not in [
        MemberRole.OWNER,
        MemberRole.ADMIN,
    ]:
        raise HTTPException(
            status_code=403,
            detail="Only workspace owner or admin can remove members",
        )

    # Verify member belongs to this workspace
    member = repo.get_member_by_id(db, member_id)
    if not member or member.workspace_id != workspace_id:
        raise HTTPException(status_code=404, detail="Member not found")

    # Cannot remove owner
    if member.role == MemberRole.OWNER:
        raise HTTPException(
            status_code=400,
            detail="Cannot remove workspace owner",
        )

    removed = workspace_service.remove_member(db, workspace_id, member_id)
    if not removed:
        raise HTTPException(
            status_code=400,
            detail="Failed to remove member",
        )

    return ApiResponse.success(data=None)


# ==================== Check Access ====================


@router.get("/{workspace_id}/check-access")
async def check_workspace_access(
    request: Request,
    workspace_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse:
    """Check if current user has access to workspace.

    Returns access info including user's role.
    """
    # Check if workspace exists
    if not repo.get_workspace_by_id(db, workspace_id):
        raise HTTPException(status_code=404, detail="Workspace not found")

    role = workspace_service.get_member_role(db, workspace_id, current_user.id)
    is_member = role is not None
    is_owner = role == MemberRole.OWNER if role else False

    return ApiResponse.success(
        data={
            "workspace_id": workspace_id,
            "user_id": current_user.id,
            "is_member": is_member,
            "is_owner": is_owner,
            "role": role.value if role else None,
        }
    )
