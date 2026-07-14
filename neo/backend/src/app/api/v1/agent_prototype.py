"""Agent Prototype API routes."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.agent_prototype import (
    AgentPrototypeCreate,
    AgentPrototypeListResponse,
    AgentPrototypePublish,
    AgentPrototypeResponse,
    AgentPrototypeRollback,
    AgentPrototypeStatusUpdate,
    AgentPrototypeUpdate,
    AgentPrototypeVersionListResponse,
    NextVersionResponse,
)
from app.schemas.response import ApiResponse
from app.services.agent_prototype_service import AgentPrototypeService

router = APIRouter(prefix="/agent_prototype", tags=["Agent Prototype"])


def get_service(db: Session = Depends(get_db)) -> AgentPrototypeService:
    """Get Agent Prototype service."""
    return AgentPrototypeService(db)


@router.get("", response_model=ApiResponse[AgentPrototypeListResponse])
def list_prototypes(
    service: AgentPrototypeService = Depends(get_service),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    status: str | None = Query(None, description="Filter by status: draft/enabled/disabled"),
    type: str | None = Query(None, description="Filter by type: site_operation/expert_interview"),
    search: str | None = Query(None, max_length=100, description="Search by name"),
    _current_user: User = Depends(get_current_user),
) -> ApiResponse[AgentPrototypeListResponse]:
    """List all Agent Prototypes with pagination and filters."""
    # Convert status string to enum
    from app.schemas.agent_prototype import AgentPrototypeStatus

    status_enum = None
    if status:
        try:
            status_enum = AgentPrototypeStatus(status)
        except ValueError:
            pass

    prototypes, total = service.list_prototypes(
        status=status_enum,
        agent_type=type,  # type is the API param, maps to agent_type in repo
        search=search,
        page=page,
        page_size=page_size,
    )

    return ApiResponse.success(
        AgentPrototypeListResponse(
            items=[AgentPrototypeResponse.model_validate(p) for p in prototypes],
            total=total,
            page=page,
            page_size=page_size,
        ),
    )


@router.post("", response_model=ApiResponse[AgentPrototypeResponse])
def create_prototype(
    data: AgentPrototypeCreate,
    service: AgentPrototypeService = Depends(get_service),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[AgentPrototypeResponse]:
    """Create a new Agent Prototype."""
    prototype = service.create_prototype(data, user_id=int(current_user.id))
    return ApiResponse.success(AgentPrototypeResponse.model_validate(prototype))


@router.get("/next-version/{prototype_id}", response_model=ApiResponse[NextVersionResponse])
def get_next_version(
    prototype_id: int,
    service: AgentPrototypeService = Depends(get_service),
    _current_user: dict = Depends(get_current_user),
) -> ApiResponse[NextVersionResponse]:
    """Get the next version number for a prototype."""
    next_version = service.get_next_version(prototype_id)
    return ApiResponse.success(NextVersionResponse(next_version=next_version))


@router.get("/{prototype_id}", response_model=ApiResponse[AgentPrototypeResponse])
def get_prototype(
    prototype_id: int,
    service: AgentPrototypeService = Depends(get_service),
    _current_user: dict = Depends(get_current_user),
) -> ApiResponse[AgentPrototypeResponse]:
    """Get an Agent Prototype by ID."""
    prototype = service.get_prototype(prototype_id)
    return ApiResponse.success(AgentPrototypeResponse.model_validate(prototype))


@router.put("/{prototype_id}", response_model=ApiResponse[AgentPrototypeResponse])
def update_prototype(
    prototype_id: int,
    data: AgentPrototypeUpdate,
    service: AgentPrototypeService = Depends(get_service),
    _current_user: dict = Depends(get_current_user),
) -> ApiResponse[AgentPrototypeResponse]:
    """Update an Agent Prototype."""
    prototype = service.update_prototype(prototype_id, data)
    return ApiResponse.success(AgentPrototypeResponse.model_validate(prototype))


@router.delete("/{prototype_id}", response_model=ApiResponse[dict])
def delete_prototype(
    prototype_id: int,
    service: AgentPrototypeService = Depends(get_service),
    _current_user: dict = Depends(get_current_user),
) -> ApiResponse[dict]:
    """Delete an Agent Prototype (only draft status)."""
    service.delete_prototype(prototype_id)
    return ApiResponse.success({"message": "Prototype deleted successfully"})


@router.put("/{prototype_id}/status", response_model=ApiResponse[AgentPrototypeResponse])
def update_status(
    prototype_id: int,
    data: AgentPrototypeStatusUpdate,
    service: AgentPrototypeService = Depends(get_service),
    _current_user: dict = Depends(get_current_user),
) -> ApiResponse[AgentPrototypeResponse]:
    """Update Agent Prototype status (enable/disable)."""
    prototype = service.update_status(prototype_id, data)
    return ApiResponse.success(AgentPrototypeResponse.model_validate(prototype))


@router.post("/{prototype_id}/publish", response_model=ApiResponse[AgentPrototypeResponse])
def publish_prototype(
    prototype_id: int,
    data: AgentPrototypePublish,
    service: AgentPrototypeService = Depends(get_service),
    current_user: dict = Depends(get_current_user),
) -> ApiResponse[AgentPrototypeResponse]:
    """Publish a new version of the Agent Prototype."""
    prototype = service.publish_prototype(prototype_id, data, user_id=current_user.id)
    return ApiResponse.success(AgentPrototypeResponse.model_validate(prototype))


@router.get("/{prototype_id}/versions", response_model=ApiResponse[AgentPrototypeVersionListResponse])
def get_version_history(
    prototype_id: int,
    service: AgentPrototypeService = Depends(get_service),
    _current_user: dict = Depends(get_current_user),
) -> ApiResponse[AgentPrototypeVersionListResponse]:
    """Get version history for a prototype."""
    from app.schemas.agent_prototype import AgentPrototypeVersionResponse

    versions = service.get_version_history(prototype_id)
    return ApiResponse.success(
        AgentPrototypeVersionListResponse(
            items=[AgentPrototypeVersionResponse.model_validate(v) for v in versions],
            total=len(versions),
        ),
    )


@router.post("/{prototype_id}/rollback", response_model=ApiResponse[AgentPrototypeResponse])
def rollback_prototype(
    prototype_id: int,
    data: AgentPrototypeRollback,
    service: AgentPrototypeService = Depends(get_service),
    current_user: dict = Depends(get_current_user),
) -> ApiResponse[AgentPrototypeResponse]:
    """Rollback Agent Prototype to a specific version."""
    prototype = service.rollback_prototype(prototype_id, data, user_id=current_user.id)
    return ApiResponse.success(AgentPrototypeResponse.model_validate(prototype))
