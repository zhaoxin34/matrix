"""Recording API endpoints."""

import json
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User, Workspace
from app.models.recording import RecordingStatus
from app.models.workspace_member import WorkspaceMember
from app.repositories import workspace_repository as workspace_repo
from app.schemas.recording import (
    BatchDeleteRequest,
    BatchTagsRequest,
    DownloadUrlResponse,
    PresignedUrlRequest,
    PresignedUrlResponse,
    RecordingCreate,
    RecordingDetailResponse,
    RecordingResponse,
    RecordingUpdate,
    SegmentCreate,
    SegmentCreateResponse,
    SegmentDetailResponse,
    SegmentResponse,
)
from app.schemas.response import ApiResponse
from app.services import recording_service
from app.storage.service import RustFSService

router = APIRouter(prefix="/workspaces/{workspace_code}/recordings", tags=["recording"])


def get_recording_service(
    request: Request,
    db: Session = Depends(get_db),
) -> recording_service.RecordingService:
    """Get recording service."""
    storage = RustFSService()
    return recording_service.RecordingService(db, storage)


async def get_workspace_and_check_permission(
    request: Request,
    workspace_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Workspace:
    """Get workspace and check member permission."""
    workspace = workspace_repo.get_workspace_by_code(db, workspace_code)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Check if user is a member
    member = (
        db.query(WorkspaceMember)
        .filter(
            WorkspaceMember.workspace_id == workspace.id,
            WorkspaceMember.user_id == current_user.id,
        )
        .first()
    )
    if not member:
        raise HTTPException(status_code=403, detail="Not a workspace member")

    return workspace


def format_recording_response(recording) -> RecordingResponse:
    """Format recording for response."""
    tags = json.loads(recording.tags) if recording.tags else []
    return RecordingResponse(
        uid=recording.uid,
        name=recording.name,
        tags=tags,
        status=recording.status,
        enter_url=recording.enter_url,
        exit_url=recording.exit_url,
        total_duration=recording.total_duration,
        total_size=recording.total_size,
        source=recording.source,
        segment_count=len(recording.segments) if hasattr(recording, "segments") else 0,
        created_at=recording.created_at,
    )


def format_segment_response(segment) -> SegmentResponse:
    """Format segment for response."""
    page_urls = json.loads(segment.page_urls) if segment.page_urls else []
    return SegmentResponse(
        uid=segment.uid,
        sequence=segment.sequence,
        start_time=segment.start_time,
        end_time=segment.end_time,
        page_urls=page_urls,
        size=segment.size,
    )


def format_segment_detail_response(segment) -> SegmentDetailResponse:
    """Format segment detail for response."""
    page_urls = json.loads(segment.page_urls) if segment.page_urls else []
    return SegmentDetailResponse(
        uid=segment.uid,
        sequence=segment.sequence,
        start_time=segment.start_time,
        end_time=segment.end_time,
        page_urls=page_urls,
        size=segment.size,
        storage_key=segment.storage_key,
    )


# ==================== Recording CRUD ====================


@router.post("", response_model=ApiResponse[RecordingResponse])
async def create_recording(
    request: Request,
    workspace_code: str,
    data: RecordingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[RecordingResponse]:
    """Create a new recording.

    Creates a new recording entity. Segments are added separately via the segments API.
    """
    workspace = await get_workspace_and_check_permission(request, workspace_code, db, current_user)

    service = get_recording_service(request, db)
    recording = service.create_recording(
        workspace_id=workspace.id,
        data=data,
        user_id=current_user.id,
    )

    return ApiResponse.success(data=format_recording_response(recording))


@router.get("", response_model=ApiResponse[dict])
async def list_recordings(
    request: Request,
    workspace_code: str,
    search: Optional[str] = Query(None, description="Search by name"),
    tags: Optional[str] = Query(None, description="Filter by tags (comma-separated)"),
    status: Optional[RecordingStatus] = Query(None, description="Filter by status"),
    from_date: Optional[datetime] = Query(None, description="Filter from date"),
    to_date: Optional[datetime] = Query(None, description="Filter to date"),
    sort: str = Query("created_at", description="Sort field"),
    order: str = Query("desc", description="Sort order (asc/desc)"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[dict]:
    """List recordings in a workspace.

    Supports filtering by search, tags, status, and date range.
    """
    workspace = await get_workspace_and_check_permission(request, workspace_code, db, current_user)

    tag_list = [t.strip() for t in tags.split(",")] if tags else None

    service = get_recording_service(request, db)
    recordings, total = service.list_recordings(
        workspace_id=workspace.id,
        search=search,
        tags=tag_list,
        status=status,
        from_date=from_date,
        to_date=to_date,
        sort=sort,
        order=order,
        page=page,
        page_size=page_size,
    )

    return ApiResponse.success(
        data={
            "items": [format_recording_response(r) for r in recordings],
            "total": total,
            "page": page,
            "page_size": page_size,
        }
    )


@router.get("/{uid}", response_model=ApiResponse[RecordingDetailResponse])
async def get_recording(
    request: Request,
    workspace_code: str,
    uid: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[RecordingDetailResponse]:
    """Get a recording by UID."""
    workspace = await get_workspace_and_check_permission(request, workspace_code, db, current_user)

    service = get_recording_service(request, db)
    recording = service.get_recording(uid)
    if not recording or recording.workspace_id != workspace.id:
        raise HTTPException(status_code=404, detail="Recording not found")

    segments = service.get_segments(uid) or []

    response = format_recording_response(recording)
    detail = RecordingDetailResponse(
        **response.model_dump(),
        segments=[format_segment_response(s) for s in segments],
    )

    return ApiResponse.success(data=detail)


@router.put("/{uid}", response_model=ApiResponse[RecordingResponse])
async def update_recording(
    request: Request,
    workspace_code: str,
    uid: str,
    data: RecordingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[RecordingResponse]:
    """Update a recording."""
    workspace = await get_workspace_and_check_permission(request, workspace_code, db, current_user)

    service = get_recording_service(request, db)
    recording = service.get_recording(uid)
    if not recording or recording.workspace_id != workspace.id:
        raise HTTPException(status_code=404, detail="Recording not found")

    updated = service.update_recording(uid, data)
    return ApiResponse.success(data=format_recording_response(updated))


@router.delete("/{uid}", response_model=ApiResponse[dict])
async def delete_recording(
    request: Request,
    workspace_code: str,
    uid: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[dict]:
    """Delete a recording and all its segments."""
    workspace = await get_workspace_and_check_permission(request, workspace_code, db, current_user)

    service = get_recording_service(request, db)
    recording = service.get_recording(uid)
    if not recording or recording.workspace_id != workspace.id:
        raise HTTPException(status_code=404, detail="Recording not found")

    service.delete_recording(uid)
    return ApiResponse.success(data={"deleted": True})


# ==================== Batch Operations ====================


@router.post("/batch/tags", response_model=ApiResponse[dict])
async def batch_update_tags(
    request: Request,
    workspace_code: str,
    data: BatchTagsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[dict]:
    """Batch update tags for recordings."""
    # Check permission
    await get_workspace_and_check_permission(request, workspace_code, db, current_user)

    service = get_recording_service(request, db)
    count = service.batch_update_tags(data)
    return ApiResponse.success(data={"updated": count})


@router.delete("/batch", response_model=ApiResponse[dict])
async def batch_delete_recordings(
    request: Request,
    workspace_code: str,
    data: BatchDeleteRequest = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[dict]:
    """Batch delete recordings.

    Uses a JSON body to carry the UID list (matches design.md §4.3.10).
    DELETE with body is allowed here to avoid query-string length limits
    when deleting a large number of recordings.
    """
    # Check permission
    await get_workspace_and_check_permission(request, workspace_code, db, current_user)

    service = get_recording_service(request, db)
    count = service.batch_delete(data.uids)
    return ApiResponse.success(data={"deleted": count})


# ==================== Segment Management ====================


@router.post("/{uid}/segments", response_model=ApiResponse[SegmentCreateResponse])
async def add_segment(
    request: Request,
    workspace_code: str,
    uid: str,
    data: SegmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[SegmentCreateResponse]:
    """Add a segment to a recording."""
    workspace = await get_workspace_and_check_permission(request, workspace_code, db, current_user)

    service = get_recording_service(request, db)
    recording = service.get_recording(uid)
    if not recording or recording.workspace_id != workspace.id:
        raise HTTPException(status_code=404, detail="Recording not found")

    result = service.add_segment(uid, data)
    if not result:
        raise HTTPException(status_code=400, detail="Failed to add segment")

    return ApiResponse.success(data=result)


@router.get("/{uid}/segments", response_model=ApiResponse[list[SegmentResponse]])
async def list_segments(
    request: Request,
    workspace_code: str,
    uid: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[list[SegmentResponse]]:
    """List all segments for a recording."""
    workspace = await get_workspace_and_check_permission(request, workspace_code, db, current_user)

    service = get_recording_service(request, db)
    recording = service.get_recording(uid)
    if not recording or recording.workspace_id != workspace.id:
        raise HTTPException(status_code=404, detail="Recording not found")

    segments = service.get_segments(uid) or []
    return ApiResponse.success(data=[format_segment_response(s) for s in segments])


@router.get("/{uid}/segments/{segment_uid}", response_model=ApiResponse[SegmentDetailResponse])
async def get_segment(
    request: Request,
    workspace_code: str,
    uid: str,
    segment_uid: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[SegmentDetailResponse]:
    """Get segment details including storage key."""
    workspace = await get_workspace_and_check_permission(request, workspace_code, db, current_user)

    service = get_recording_service(request, db)
    recording = service.get_recording(uid)
    if not recording or recording.workspace_id != workspace.id:
        raise HTTPException(status_code=404, detail="Recording not found")

    segments = service.get_segments(uid) or []
    segment = next((s for s in segments if s.uid == segment_uid), None)
    if not segment:
        raise HTTPException(status_code=404, detail="Segment not found")

    return ApiResponse.success(data=format_segment_detail_response(segment))


@router.post("/{uid}/segments/{segment_uid}/download-url", response_model=ApiResponse[DownloadUrlResponse])
async def get_segment_download_url(
    request: Request,
    workspace_code: str,
    uid: str,
    segment_uid: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[DownloadUrlResponse]:
    """Get presigned URL for downloading a segment."""
    workspace = await get_workspace_and_check_permission(request, workspace_code, db, current_user)

    service = get_recording_service(request, db)
    recording = service.get_recording(uid)
    if not recording or recording.workspace_id != workspace.id:
        raise HTTPException(status_code=404, detail="Recording not found")

    result = service.generate_download_url(segment_uid)
    if not result:
        raise HTTPException(status_code=404, detail="Segment not found")

    return ApiResponse.success(data=result)


# ==================== Presigned URLs ====================


@router.post("/{uid}/segments/presigned", response_model=ApiResponse[PresignedUrlResponse])
async def get_segment_upload_url(
    request: Request,
    workspace_code: str,
    uid: str,
    data: PresignedUrlRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[PresignedUrlResponse]:
    """Generate presigned URL for uploading a segment file.

    This endpoint generates a presigned URL for direct S3 upload.
    After upload, call POST /{recording_uid}/segments to register the segment.

    Endpoint path follows design.md §4.1: the presigned URL is generated
    under a specific recording so the S3 storage key can include the
    recording UID (required by the S3 directory convention).
    """
    workspace = await get_workspace_and_check_permission(request, workspace_code, db, current_user)

    service = get_recording_service(request, db)
    recording = service.get_recording(uid)
    if not recording or recording.workspace_id != workspace.id:
        raise HTTPException(status_code=404, detail="Recording not found")

    import uuid

    segment_uid = str(uuid.uuid4())
    result = service.generate_upload_url(
        workspace_code=workspace_code,
        recording_uid=uid,
        segment_uid=segment_uid,
        data=data,
    )

    return ApiResponse.success(data=result)


# ==================== Recording Completion ====================


@router.post("/{uid}/complete", response_model=ApiResponse[RecordingResponse])
async def complete_recording(
    request: Request,
    workspace_code: str,
    uid: str,
    exit_url: Optional[str] = Query(None, description="Exit URL"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApiResponse[RecordingResponse]:
    """Mark a recording as completed.

    Calculates total duration and size from all segments.
    """
    workspace = await get_workspace_and_check_permission(request, workspace_code, db, current_user)

    service = get_recording_service(request, db)
    recording = service.get_recording(uid)
    if not recording or recording.workspace_id != workspace.id:
        raise HTTPException(status_code=404, detail="Recording not found")

    completed = service.complete_recording(uid, exit_url or "")
    return ApiResponse.success(data=format_recording_response(completed))
