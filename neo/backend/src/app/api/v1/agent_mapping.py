"""API routes for agent type-to-instance mappings scoped to a workspace."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.repositories import workspace_repository
from app.schemas.knlg_agent_mapping import (
    AgentMappingCreate,
    AgentMappingListResponse,
    AgentMappingResponse,
    AgentMappingUpdate,
)
from app.schemas.response import ApiResponse
from app.services.knlg_agent_mapping_service import KnlgAgentMappingService

router = APIRouter(
    prefix="/workspaces/{workspace_code}/agent-mappings",
    tags=["agent-mapping"],
)


def _get_workspace_id(workspace_code: str, db: Session) -> int:
    """Resolve a workspace_code to its primary key, or raise 404."""
    workspace = workspace_repository.get_workspace_by_code(db, workspace_code)
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found",
        )
    # TODO: Check workspace membership
    return int(workspace.id)


def _get_service(db: Session = Depends(get_db)) -> KnlgAgentMappingService:
    return KnlgAgentMappingService(db)


# ============ List ============


@router.get("", response_model=ApiResponse[AgentMappingListResponse])
def list_agent_mappings(
    workspace_code: str,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    service: KnlgAgentMappingService = Depends(_get_service),
    _current_user: User = Depends(get_current_user),
) -> ApiResponse[AgentMappingListResponse]:
    """List all (type -> agent_id) mappings for a workspace."""
    workspace_id = _get_workspace_id(workspace_code, db)

    items, total = service.list_mappings(
        workspace_id=workspace_id,
        page=page,
        page_size=page_size,
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    return ApiResponse.success(
        AgentMappingListResponse(
            items=[AgentMappingResponse.model_validate(m) for m in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        ),
    )


# ============ Create ============


@router.post(
    "",
    response_model=ApiResponse[AgentMappingResponse],
    status_code=status.HTTP_201_CREATED,
)
def create_agent_mapping(
    workspace_code: str,
    data: AgentMappingCreate,
    db: Session = Depends(get_db),
    service: KnlgAgentMappingService = Depends(_get_service),
    _current_user: User = Depends(get_current_user),
) -> ApiResponse[AgentMappingResponse]:
    """Create a new (type -> agent_id) mapping in the workspace."""
    workspace_id = _get_workspace_id(workspace_code, db)

    mapping = service.create_mapping(
        workspace_id=workspace_id,
        type=data.type,
        agent_id=data.agent_id,
    )
    return ApiResponse.success(AgentMappingResponse.model_validate(mapping))


# ============ Get by type ============


@router.get(
    "/{mapping_type}",
    response_model=ApiResponse[AgentMappingResponse],
)
def get_agent_mapping(
    workspace_code: str,
    mapping_type: str,
    db: Session = Depends(get_db),
    service: KnlgAgentMappingService = Depends(_get_service),
    _current_user: User = Depends(get_current_user),
) -> ApiResponse[AgentMappingResponse]:
    """Get a single mapping by its `type` within the workspace."""
    workspace_id = _get_workspace_id(workspace_code, db)
    mapping = service.get_mapping(workspace_id, mapping_type)
    return ApiResponse.success(AgentMappingResponse.model_validate(mapping))


# ============ Update ============


@router.put(
    "/{mapping_type}",
    response_model=ApiResponse[AgentMappingResponse],
)
def update_agent_mapping(
    workspace_code: str,
    mapping_type: str,
    data: AgentMappingUpdate,
    db: Session = Depends(get_db),
    service: KnlgAgentMappingService = Depends(_get_service),
    _current_user: User = Depends(get_current_user),
) -> ApiResponse[AgentMappingResponse]:
    """Update the `agent_id` of an existing mapping (type is immutable)."""
    workspace_id = _get_workspace_id(workspace_code, db)

    updated = service.update_mapping_agent(
        workspace_id=workspace_id,
        type=mapping_type,
        new_agent_id=data.agent_id,
    )
    return ApiResponse.success(AgentMappingResponse.model_validate(updated))


# ============ Delete ============


@router.delete(
    "/{mapping_type}",
    status_code=status.HTTP_200_OK,
)
def delete_agent_mapping(
    workspace_code: str,
    mapping_type: str,
    db: Session = Depends(get_db),
    service: KnlgAgentMappingService = Depends(_get_service),
    _current_user: User = Depends(get_current_user),
) -> ApiResponse[None]:
    """Delete a mapping by its `type`. Returns 404 if not found."""
    workspace_id = _get_workspace_id(workspace_code, db)
    service.delete_mapping(workspace_id, mapping_type)
    return ApiResponse.success(None, message="deleted")
