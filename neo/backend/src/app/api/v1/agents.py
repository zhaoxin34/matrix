"""Agent API routes."""

from typing import Optional

from fastapi import APIRouter, Body, Depends, Path, Query
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.agent import (
    AgentCreate,
    AgentListResponse,
    AgentResponse,
    AgentStatusResponse,
    AgentUpdate,
)
from app.schemas.response import ApiResponse
from app.services.agent_service import AgentService

router = APIRouter(prefix="/agents", tags=["Agent"])


def get_service(db: Session = Depends(get_db)) -> AgentService:
    """Get Agent service."""
    return AgentService(db)


@router.get("", response_model=ApiResponse[AgentListResponse])
def list_agents(
    workspace_code: str = Path(..., description="Workspace code"),
    service: AgentService = Depends(get_service),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status: enabled/disabled"),
    prototype_id: Optional[int] = Query(None, description="Filter by prototype ID"),
    search: Optional[str] = Query(None, max_length=100, description="Search in name/description"),
    _current_user: dict = Depends(get_current_user),
) -> ApiResponse[AgentListResponse]:
    """List all Agents in a workspace with pagination and filters."""
    agents, total = service.list_agents(
        workspace_code=workspace_code,
        status=status,
        prototype_id=prototype_id,
        search=search,
        page=page,
        page_size=page_size,
    )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    return ApiResponse.success(
        AgentListResponse(
            items=[AgentResponse.model_validate(a) for a in agents],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
    )


@router.post("", response_model=ApiResponse[AgentResponse])
def create_agent(
    workspace_code: str = Path(..., description="Workspace code"),
    data: AgentCreate = Body(...),
    service: AgentService = Depends(get_service),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[AgentResponse]:
    """Create a new Agent."""
    agent = service.create_agent(
        workspace_code=workspace_code,
        data=data.model_dump(),
        user_id=current_user.id,
    )
    return ApiResponse.success(AgentResponse.model_validate(agent))


@router.get("/{agent_id}", response_model=ApiResponse[AgentResponse])
def get_agent(
    workspace_code: str = Path(..., description="Workspace code"),
    agent_id: int = Path(..., description="Agent ID"),
    service: AgentService = Depends(get_service),
    _current_user: dict = Depends(get_current_user),
) -> ApiResponse[AgentResponse]:
    """Get an Agent by ID."""
    agent = service.get_agent(workspace_code=workspace_code, agent_id=agent_id)
    return ApiResponse.success(AgentResponse.model_validate(agent))


@router.put("/{agent_id}", response_model=ApiResponse[AgentResponse])
def update_agent(
    workspace_code: str = Path(..., description="Workspace code"),
    agent_id: int = Path(..., description="Agent ID"),
    data: AgentUpdate = Body(...),
    service: AgentService = Depends(get_service),
    _current_user: dict = Depends(get_current_user),
) -> ApiResponse[AgentResponse]:
    """Update an Agent."""
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    agent = service.update_agent(workspace_code=workspace_code, agent_id=agent_id, data=update_data)
    return ApiResponse.success(AgentResponse.model_validate(agent))


@router.delete("/{agent_id}", response_model=ApiResponse[dict])
def delete_agent(
    workspace_code: str = Path(..., description="Workspace code"),
    agent_id: int = Path(..., description="Agent ID"),
    service: AgentService = Depends(get_service),
    _current_user: dict = Depends(get_current_user),
) -> ApiResponse[dict]:
    """Delete an Agent (soft delete)."""
    service.delete_agent(workspace_code=workspace_code, agent_id=agent_id)
    return ApiResponse.success({"message": "Agent deleted successfully"})


@router.patch("/{agent_id}/enable", response_model=ApiResponse[AgentStatusResponse])
def enable_agent(
    workspace_code: str = Path(..., description="Workspace code"),
    agent_id: int = Path(..., description="Agent ID"),
    service: AgentService = Depends(get_service),
    _current_user: dict = Depends(get_current_user),
) -> ApiResponse[AgentStatusResponse]:
    """Enable an Agent."""
    agent = service.enable_agent(workspace_code=workspace_code, agent_id=agent_id)
    return ApiResponse.success(AgentStatusResponse.model_validate(agent))


@router.patch("/{agent_id}/disable", response_model=ApiResponse[AgentStatusResponse])
def disable_agent(
    workspace_code: str = Path(..., description="Workspace code"),
    agent_id: int = Path(..., description="Agent ID"),
    service: AgentService = Depends(get_service),
    _current_user: dict = Depends(get_current_user),
) -> ApiResponse[AgentStatusResponse]:
    """Disable an Agent."""
    agent = service.disable_agent(workspace_code=workspace_code, agent_id=agent_id)
    return ApiResponse.success(AgentStatusResponse.model_validate(agent))
