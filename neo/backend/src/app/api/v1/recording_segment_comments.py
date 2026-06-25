"""Recording Segment Comment API endpoints.

Routes are organized so that:
- `/batch` is declared BEFORE the `/{comment_uid}` dynamic routes to avoid
  FastAPI treating "batch" as a UID.
- All write endpoints translate service-layer exceptions into HTTP errors.
"""

from fastapi import APIRouter, Body, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.api.v1.recording import get_workspace_and_check_permission
from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.schemas.recording_segment_comment import (
    BatchDeleteRequest,
    BatchDeleteResponse,
    CreatorBrief,
    RecordingSegmentCommentCreate,
    RecordingSegmentCommentListResponse,
    RecordingSegmentCommentResponse,
    RecordingSegmentCommentUpdate,
)
from app.schemas.response import ApiResponse
from app.services.recording_segment_comment_service import (
    CommentNotFoundError,
    InvalidTimeRangeError,
    PermissionDeniedError,
    RecordingSegmentCommentService,
    SegmentNotFoundError,
)

router = APIRouter(
    prefix="/workspaces/{workspace_code}/recordings",
    tags=["recording-segment-comment"],
)


def get_comment_service(db: Session = Depends(get_db)) -> RecordingSegmentCommentService:
    """Get a comment service bound to the request's DB session."""
    return RecordingSegmentCommentService(db)


def _format_comment_response(comment) -> RecordingSegmentCommentResponse:
    """Format a comment ORM instance for API response."""
    return RecordingSegmentCommentResponse(
        uid=comment.uid,
        recording_uid=comment.recording.uid,
        segment_uid=comment.segment.uid,
        show_time=float(comment.show_time),
        hide_time=float(comment.hide_time),
        abstract=comment.abstract,
        content=comment.content,
        creator=CreatorBrief(id=comment.creator.id, name=comment.creator.username),
        created_at=comment.created_at,
        updated_at=comment.updated_at,
    )


# ==================== Batch first (avoid `/batch` being matched as `{comment_uid}`) ====================


@router.delete(
    "/{recording_uid}/segment-comments/batch",
    response_model=ApiResponse[BatchDeleteResponse],
)
async def batch_delete_comments(
    request: Request,
    workspace_code: str,
    recording_uid: str,
    data: BatchDeleteRequest = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: RecordingSegmentCommentService = Depends(get_comment_service),
):
    await get_workspace_and_check_permission(request, workspace_code, db, current_user)
    try:
        deleted, skipped = svc.batch_delete_comments(recording_uid, data.comment_uids, current_user.id)
    except SegmentNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return ApiResponse.success(data=BatchDeleteResponse(deleted_count=deleted, skipped=skipped))


# ==================== CRUD ====================


@router.post(
    "/{recording_uid}/segment-comments",
    response_model=ApiResponse[RecordingSegmentCommentResponse],
)
async def create_comment(
    request: Request,
    workspace_code: str,
    recording_uid: str,
    data: RecordingSegmentCommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: RecordingSegmentCommentService = Depends(get_comment_service),
):
    """Create a comment on a segment. Admin/Owner only."""
    await get_workspace_and_check_permission(request, workspace_code, db, current_user)
    try:
        comment = svc.create_comment(recording_uid, data, current_user.id)
    except SegmentNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except InvalidTimeRangeError as e:
        raise HTTPException(status_code=400, detail={"code": 2011, "message": str(e)})
    # Eagerly load relationships for response formatting
    return ApiResponse.success(data=_format_comment_response(comment))


@router.get(
    "/{recording_uid}/segment-comments",
    response_model=ApiResponse[RecordingSegmentCommentListResponse],
)
async def list_comments_by_recording(
    request: Request,
    workspace_code: str,
    recording_uid: str,
    segment_uid: str | None = Query(None, description="Filter by segment uid"),
    creator_id: int | None = Query(None, description="Filter by creator user id"),
    sort: str = Query("show_time", description="Sort field: show_time|created_at"),
    order: str = Query("asc", description="asc|desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: RecordingSegmentCommentService = Depends(get_comment_service),
):
    """List comments of a recording."""
    await get_workspace_and_check_permission(request, workspace_code, db, current_user)
    items, total = svc.list_by_recording(
        recording_uid,
        segment_uid=segment_uid,
        creator_id=creator_id,
        sort=sort,
        order=order,
        page=page,
        page_size=page_size,
    )
    return ApiResponse.success(
        data={
            "items": [_format_comment_response(c) for c in items],
            "pagination": {
                "page": page,
                "size": page_size,
                "total": total,
                "total_pages": (total + page_size - 1) // page_size if total else 0,
            },
        },
    )


@router.get(
    "/{recording_uid}/segments/{segment_uid}/comments",
    response_model=ApiResponse[list[RecordingSegmentCommentResponse]],
)
async def list_comments_by_segment(
    request: Request,
    workspace_code: str,
    recording_uid: str,
    segment_uid: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: RecordingSegmentCommentService = Depends(get_comment_service),
):
    """List all comments of a single segment."""
    await get_workspace_and_check_permission(request, workspace_code, db, current_user)
    items = svc.list_by_segment(segment_uid)
    return ApiResponse.success(data=[_format_comment_response(c) for c in items])


@router.put(
    "/{recording_uid}/segment-comments/{comment_uid}",
    response_model=ApiResponse[RecordingSegmentCommentResponse],
)
async def update_comment(
    request: Request,
    workspace_code: str,
    recording_uid: str,
    comment_uid: str,
    data: RecordingSegmentCommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: RecordingSegmentCommentService = Depends(get_comment_service),
):
    """Update a comment. Creator or workspace Owner only."""
    await get_workspace_and_check_permission(request, workspace_code, db, current_user)
    try:
        comment = svc.update_comment(comment_uid, data, current_user.id)
    except CommentNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except InvalidTimeRangeError as e:
        raise HTTPException(status_code=400, detail={"code": 2011, "message": str(e)})
    return ApiResponse.success(data=_format_comment_response(comment))


@router.delete(
    "/{recording_uid}/segment-comments/{comment_uid}",
    response_model=ApiResponse[None],
)
async def delete_comment(
    request: Request,
    workspace_code: str,
    recording_uid: str,
    comment_uid: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: RecordingSegmentCommentService = Depends(get_comment_service),
):
    """Delete a single comment. Creator or workspace Owner only."""
    await get_workspace_and_check_permission(request, workspace_code, db, current_user)
    try:
        svc.delete_comment(comment_uid, current_user.id)
    except CommentNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionDeniedError as e:
        raise HTTPException(status_code=403, detail=str(e))
    return ApiResponse.success(data=None)
