"""API routes for status."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.repositories import workspace_repository
from app.repositories.status_repository import StatusRepository
from app.schemas.response import ApiResponse
from app.schemas.status import (
    StatusCreate,
    StatusListResponse,
    StatusResponse,
    StatusUpdate,
)

router = APIRouter(prefix="/workspaces/{workspace_code}/status", tags=["status"])


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


def _to_status_response(status_record) -> StatusResponse:
    """Convert Status model to StatusResponse, excluding relationships."""
    return StatusResponse(
        id=status_record.id,
        entity_type=status_record.entity_type,
        entity_id=status_record.entity_id,
        attributes=status_record.attributes,
        stat_at=status_record.stat_at,
        source=status_record.source,
        session_id=status_record.session_id,
        workspace_id=status_record.workspace_id,
        created_by=status_record.created_by,
        created_at=status_record.created_at,
        updated_at=status_record.updated_at,
    )


@router.get("", response_model=ApiResponse[StatusListResponse])
def list_status(
    workspace_code: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    entity_type: str | None = Query(None, description="Entity type filter (exact match)"),
    entity_id: str | None = Query(None, description="Entity ID search"),
    stat_start: datetime | None = Query(None, alias="stat_start", description="Start time (ISO 8601)"),
    stat_end: datetime | None = Query(None, alias="stat_end", description="End time (ISO 8601)"),
    source: str | None = Query(None, description="Source filter (exact match)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StatusListResponse:
    """List status records for a workspace with pagination and filtering."""
    workspace_id = _get_workspace_id(workspace_code, db)
    repo = StatusRepository(db)

    statuses, total = repo.list_by_workspace(
        workspace_id=workspace_id,
        page=page,
        page_size=page_size,
        entity_type=entity_type,
        entity_id=entity_id,
        stat_start=stat_start,
        stat_end=stat_end,
        source=source,
    )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    return ApiResponse.success(
        data=StatusListResponse(
            items=[_to_status_response(s) for s in statuses],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        ),
    )


@router.get("/{status_id}", response_model=ApiResponse[StatusResponse])
def get_status(
    workspace_code: str,
    status_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[StatusResponse]:
    """Get a single status record by ID."""
    _get_workspace_id(workspace_code, db)
    repo = StatusRepository(db)

    status_record = repo.get_by_id(status_id)
    if not status_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Status not found",
        )

    return ApiResponse.success(data=_to_status_response(status_record))


@router.post("", response_model=ApiResponse[StatusResponse], status_code=status.HTTP_201_CREATED)
def create_status(
    workspace_code: str,
    data: StatusCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[StatusResponse]:
    """Create a new status record."""
    workspace_id = _get_workspace_id(workspace_code, db)
    repo = StatusRepository(db)

    # Check for duplicate entity_type + entity_id + stat_at combination
    existing = repo.get_by_entity_and_time(data.entity_type, data.entity_id, data.stat_at)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Status with same entity and timestamp already exists",
        )

    try:
        status_record = repo.create(workspace_id=workspace_id, user_id=int(current_user.id), data=data)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Status with same entity and timestamp already exists",
        )

    return ApiResponse.success(data=_to_status_response(status_record))


@router.put("/{status_id}", response_model=ApiResponse[StatusResponse])
def update_status(
    workspace_code: str,
    status_id: int,
    data: StatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[StatusResponse]:
    """Update an existing status record."""
    _get_workspace_id(workspace_code, db)
    repo = StatusRepository(db)

    status_record = repo.get_by_id(status_id)
    if not status_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Status not found",
        )

    # Check for duplicate if entity fields or stat_at is being updated
    if data.entity_type or data.entity_id or data.stat_at:
        check_type = data.entity_type or status_record.entity_type
        check_id = data.entity_id or status_record.entity_id
        check_time = data.stat_at or status_record.stat_at
        existing = repo.get_by_entity_and_time(check_type, check_id, check_time, exclude_id=status_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Status with same entity and timestamp already exists",
            )

    updated_status = repo.update(status_record, data)
    return ApiResponse.success(data=_to_status_response(updated_status))


@router.delete("/{status_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_status(
    workspace_code: str,
    status_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete a status record (hard delete - permanent removal)."""
    _get_workspace_id(workspace_code, db)
    repo = StatusRepository(db)

    status_record = repo.get_by_id(status_id)
    if not status_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Status not found",
        )

    repo.hard_delete(status_record)
