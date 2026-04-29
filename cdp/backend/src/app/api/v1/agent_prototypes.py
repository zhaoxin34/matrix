"""Agent Prototype API routes."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_database
from app.models.agent_prototype import AgentPrototypeStatus
from app.models.user import User
from app.schemas.agent_prototype import (
    AgentPrototypeListResponse,
    AgentPrototypeResponse,
    AgentPrototypeVersionResponse,
    CreateAgentPrototype,
    PaginatedAgentPrototypeResponse,
    PublishRequest,
    RollbackRequest,
    UpdateAgentPrototype,
)
from app.schemas.response import ApiResponse
from app.services.agent_prototype_service import AgentPrototypeService

router = APIRouter(prefix="/agent-prototypes", tags=["agent-prototypes"])


def get_agent_prototype_service(db: Session = Depends(get_database)) -> AgentPrototypeService:
    """Get agent prototype service."""
    return AgentPrototypeService(db)


@router.get("", response_model=ApiResponse)
async def list_agent_prototypes(
    status: AgentPrototypeStatus | None = Query(None, description="Filter by status"),
    keyword: str | None = Query(None, description="Search by name"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    service: AgentPrototypeService = Depends(get_agent_prototype_service),
):
    """List agent prototypes with pagination."""
    result = service.list_prototypes(
        page=page, page_size=page_size, status=status, keyword=keyword
    )
    return ApiResponse.success(result)


@router.post("", response_model=ApiResponse, status_code=status.HTTP_201_CREATED)
async def create_agent_prototype(
    data: CreateAgentPrototype,
    service: AgentPrototypeService = Depends(get_agent_prototype_service),
    current_user: User = Depends(get_current_user),
):
    """Create a new agent prototype."""
    prototype = service.create_prototype(data, current_user.id)
    return ApiResponse.success(AgentPrototypeResponse.model_validate(prototype))


@router.get("/{prototype_id}", response_model=ApiResponse)
async def get_agent_prototype(
    prototype_id: int,
    service: AgentPrototypeService = Depends(get_agent_prototype_service),
):
    """Get agent prototype by ID."""
    prototype = service.get_prototype(prototype_id)
    if not prototype:
        return ApiResponse.error(404, "Prototype not found")
    return ApiResponse.success(AgentPrototypeResponse.model_validate(prototype))


@router.put("/{prototype_id}", response_model=ApiResponse)
async def update_agent_prototype(
    prototype_id: int,
    data: UpdateAgentPrototype,
    service: AgentPrototypeService = Depends(get_agent_prototype_service),
    current_user: User = Depends(get_current_user),
):
    """Update an agent prototype."""
    prototype = service.update_prototype(prototype_id, data, current_user.id)
    if not prototype:
        return ApiResponse.error(404, "Prototype not found")
    return ApiResponse.success(AgentPrototypeResponse.model_validate(prototype))


@router.delete("/{prototype_id}", response_model=ApiResponse)
async def delete_agent_prototype(
    prototype_id: int,
    service: AgentPrototypeService = Depends(get_agent_prototype_service),
):
    """Delete an agent prototype (only draft status)."""
    try:
        success = service.delete_prototype(prototype_id)
        if not success:
            return ApiResponse.error(404, "Prototype not found")
        return ApiResponse.success({"message": "Deleted successfully"})
    except ValueError as e:
        return ApiResponse.error(400, str(e))


@router.post("/{prototype_id}/publish", response_model=ApiResponse)
async def publish_agent_prototype(
    prototype_id: int,
    data: PublishRequest,
    service: AgentPrototypeService = Depends(get_agent_prototype_service),
    current_user: User = Depends(get_current_user),
):
    """Publish a prototype (create new version snapshot)."""
    try:
        prototype = service.publish_prototype(prototype_id, data, current_user.id)
        return ApiResponse.success(AgentPrototypeResponse.model_validate(prototype))
    except ValueError as e:
        return ApiResponse.error(400, str(e))


@router.get("/{prototype_id}/versions", response_model=ApiResponse)
async def list_agent_prototype_versions(
    prototype_id: int,
    service: AgentPrototypeService = Depends(get_agent_prototype_service),
):
    """List all versions for a prototype."""
    versions = service.list_versions(prototype_id)
    return ApiResponse.success(
        [AgentPrototypeVersionResponse.model_validate(v) for v in versions]
    )


@router.post("/{prototype_id}/rollback", response_model=ApiResponse)
async def rollback_agent_prototype(
    prototype_id: int,
    data: RollbackRequest,
    service: AgentPrototypeService = Depends(get_agent_prototype_service),
    current_user: User = Depends(get_current_user),
):
    """Rollback prototype to a specific version."""
    try:
        prototype = service.rollback_prototype(prototype_id, data, current_user.id)
        return ApiResponse.success(AgentPrototypeResponse.model_validate(prototype))
    except ValueError as e:
        return ApiResponse.error(400, str(e))


@router.post("/{prototype_id}/toggle-status", response_model=ApiResponse)
async def toggle_agent_prototype_status(
    prototype_id: int,
    service: AgentPrototypeService = Depends(get_agent_prototype_service),
    current_user: User = Depends(get_current_user),
):
    """Toggle prototype status (enabled <-> disabled)."""
    try:
        prototype = service.toggle_status(prototype_id, current_user.id)
        return ApiResponse.success(AgentPrototypeResponse.model_validate(prototype))
    except ValueError as e:
        return ApiResponse.error(400, str(e))