"""API routes for status."""

from datetime import datetime
from typing import Optional

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
        entity_name=status_record.entity_name,
        attributes=status_record.attributes,
        captured_at=status_record.captured_at,
        source=status_record.source,
        session_id=status_record.session_id,
        workspace_id=status_record.workspace_id,
        embedded_site_id=status_record.embedded_site_id,
        created_by=status_record.created_by,
        created_at=status_record.created_at,
        updated_at=status_record.updated_at,
    )


@router.get("", response_model=ApiResponse[StatusListResponse])
def list_status(
    workspace_code: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    entity_name: Optional[str] = Query(None, description="Entity name (exact match)"),
    captured_start: Optional[datetime] = Query(None, alias="captured_start", description="Start time (ISO 8601)"),
    captured_end: Optional[datetime] = Query(None, alias="captured_end", description="End time (ISO 8601)"),
    source: Optional[str] = Query(None, description="Source filter (exact match)"),
    embedded_site_id: Optional[int] = Query(None, description="Filter by embedded site ID"),
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
        entity_name=entity_name,
        captured_start=captured_start,
        captured_end=captured_end,
        source=source,
        embedded_site_id=embedded_site_id,
    )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    return ApiResponse.success(
        data=StatusListResponse(
            items=[_to_status_response(s) for s in statuses],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
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

    # Check for duplicate entity_name + captured_at combination
    existing = repo.get_by_entity_and_time(data.entity_name, data.captured_at)
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

    # Check for duplicate if entity_name or captured_at is being updated
    if data.entity_name or data.captured_at:
        check_entity = data.entity_name or status_record.entity_name
        check_time = data.captured_at or status_record.captured_at
        existing = repo.get_by_entity_and_time(check_entity, check_time, exclude_id=status_id)
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
