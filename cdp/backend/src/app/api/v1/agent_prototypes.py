"""Agent Prototype API routes."""

from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.schemas.agent_prototype import (
    AgentPrototypeListResponse,
    AgentPrototypeResponse,
    CreateAgentPrototype,
    PublishRequest,
    RollbackRequest,
    UpdateAgentPrototype,
    VersionResponse,
)
from app.services.agent_prototype_service import AgentPrototypeService

router = APIRouter(prefix="/agent-prototypes", tags=["agent-prototypes"])


@router.get("/", response_model=AgentPrototypeListResponse)
def list_prototypes(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> AgentPrototypeListResponse:
    """List all agent prototypes with pagination and filters."""
    service = AgentPrototypeService(db)
    return service.list_prototypes(page=page, page_size=page_size, status=status, keyword=keyword)


@router.post("/", response_model=AgentPrototypeResponse, status_code=status.HTTP_201_CREATED)
def create_prototype(
    data: CreateAgentPrototype,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> AgentPrototypeResponse:
    """Create a new agent prototype."""
    service = AgentPrototypeService(db)
    return service.create_prototype(data, user_id=current_user.id)


@router.get("/{prototype_id}", response_model=AgentPrototypeResponse)
def get_prototype(
    prototype_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> AgentPrototypeResponse:
    """Get an agent prototype by ID."""
    service = AgentPrototypeService(db)
    return service.get_prototype(prototype_id)


@router.put("/{prototype_id}", response_model=AgentPrototypeResponse)
def update_prototype(
    prototype_id: int,
    data: UpdateAgentPrototype,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> AgentPrototypeResponse:
    """Update an agent prototype."""
    service = AgentPrototypeService(db)
    return service.update_prototype(prototype_id, data)


@router.delete("/{prototype_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_prototype(
    prototype_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> None:
    """Delete an agent prototype (only draft status)."""
    service = AgentPrototypeService(db)
    service.delete_prototype(prototype_id)


@router.post("/{prototype_id}/publish", response_model=AgentPrototypeResponse)
def publish_prototype(
    prototype_id: int,
    data: PublishRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> AgentPrototypeResponse:
    """Publish a prototype and create a new version snapshot."""
    service = AgentPrototypeService(db)
    return service.publish_prototype(prototype_id, data, user_id=current_user.id)


@router.get("/{prototype_id}/versions", response_model=list[VersionResponse])
def list_versions(
    prototype_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> list[VersionResponse]:
    """List all versions for a prototype."""
    service = AgentPrototypeService(db)
    return service.list_versions(prototype_id)


@router.post("/{prototype_id}/rollback", response_model=AgentPrototypeResponse)
def rollback_prototype(
    prototype_id: int,
    data: RollbackRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> AgentPrototypeResponse:
    """Rollback prototype to a specific version."""
    service = AgentPrototypeService(db)
    return service.rollback_prototype(prototype_id, data, user_id=current_user.id)


@router.post("/{prototype_id}/toggle-status", response_model=AgentPrototypeResponse)
def toggle_status(
    prototype_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
) -> AgentPrototypeResponse:
    """Toggle prototype status between enabled and disabled."""
    service = AgentPrototypeService(db)
    return service.toggle_status(prototype_id, user_id=current_user.id)
