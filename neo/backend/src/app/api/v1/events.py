"""API routes for events."""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.repositories import workspace_repository
from app.repositories.event_repository import EventRepository
from app.schemas.event import (
    EventCreate,
    EventListResponse,
    EventResponse,
    EventUpdate,
)
from app.schemas.response import ApiResponse

router = APIRouter(prefix="/workspaces/{workspace_code}/events", tags=["events"])


def _get_workspace_id(
    workspace_code: str,
    db: Session,
) -> int:
    """Get workspace ID by code, raise 404 if not found."""
    workspace = workspace_repository.get_workspace_by_code(db, workspace_code)

    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found",
        )

    # TODO: Check workspace membership
    return int(workspace.id)


def _to_event_response(event) -> EventResponse:
    """Convert Event model to EventResponse, excluding relationships."""
    return EventResponse(
        id=event.id,
        name=event.name,
        entity_name=event.entity_name,
        target_entity_name=event.target_entity_name,
        actor=event.actor,
        timestamp=event.timestamp,
        page_url=event.page_url,
        session_id=event.session_id,
        metadata=event.event_metadata,
        workspace_id=event.workspace_id,
        embedded_site_id=event.embedded_site_id,
        created_by=event.created_by,
        created_at=event.created_at,
        updated_at=event.updated_at,
    )


@router.get("", response_model=ApiResponse[EventListResponse])
def list_events(
    workspace_code: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    name: Optional[str] = Query(None, description="Event name search (partial match)"),
    entity_name: Optional[str] = Query(None, description="Entity name (exact match)"),
    actor: Optional[str] = Query(None, description="Actor search (partial match)"),
    timestamp_start: Optional[datetime] = Query(None, description="Start time (ISO 8601)"),
    timestamp_end: Optional[datetime] = Query(None, description="End time (ISO 8601)"),
    embedded_site_id: Optional[int] = Query(None, description="Filter by embedded site ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> EventListResponse:
    """List events for a workspace with pagination and filtering."""
    workspace_id = _get_workspace_id(workspace_code, db)
    repo = EventRepository(db)

    events, total = repo.list_by_workspace(
        workspace_id=workspace_id,
        page=page,
        page_size=page_size,
        name=name,
        entity_name=entity_name,
        actor=actor,
        timestamp_start=timestamp_start,
        timestamp_end=timestamp_end,
        embedded_site_id=embedded_site_id,
    )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    return ApiResponse.success(
        data=EventListResponse(
            items=[_to_event_response(e) for e in events],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
    )


@router.get("/{event_id}", response_model=ApiResponse[EventResponse])
def get_event(
    workspace_code: str,
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[EventResponse]:
    """Get a single event by ID."""
    _get_workspace_id(workspace_code, db)
    repo = EventRepository(db)

    event = repo.get_by_id(event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    return ApiResponse.success(data=_to_event_response(event))


@router.post("", response_model=ApiResponse[EventResponse], status_code=status.HTTP_201_CREATED)
def create_event(
    workspace_code: str,
    data: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[EventResponse]:
    """Create a new event."""
    workspace_id = _get_workspace_id(workspace_code, db)
    repo = EventRepository(db)

    event = repo.create(workspace_id=workspace_id, user_id=int(current_user.id), data=data)
    return ApiResponse.success(data=_to_event_response(event))


@router.put("/{event_id}", response_model=ApiResponse[EventResponse])
def update_event(
    workspace_code: str,
    event_id: int,
    data: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[EventResponse]:
    """Update an existing event."""
    _get_workspace_id(workspace_code, db)
    repo = EventRepository(db)

    event = repo.get_by_id(event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    updated_event = repo.update(event, data)
    return ApiResponse.success(data=_to_event_response(updated_event))


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    workspace_code: str,
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete an event (hard delete - permanent removal)."""
    _get_workspace_id(workspace_code, db)
    repo = EventRepository(db)

    event = repo.get_by_id(event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    repo.hard_delete(event)
