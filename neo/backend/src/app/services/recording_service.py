"""Recording service."""

import json
import uuid
from datetime import UTC, datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.models.recording import Recording, RecordingStatus
from app.models.segment import Segment
from app.repositories import recording_repository as repo
from app.schemas.recording import (
    BatchTagsRequest,
    DownloadUrlResponse,
    PresignedUrlRequest,
    PresignedUrlResponse,
    RecordingCreate,
    RecordingUpdate,
    SegmentCreate,
    SegmentCreateResponse,
)
from app.storage.service import RustFSService


class RecordingService:
    """Service for Recording operations."""

    def __init__(self, db: Session, storage: RustFSService):
        """Initialize service."""
        self.db = db
        self.storage = storage
        self.repo = repo.RecordingRepository(db)
        self.segment_repo = repo.SegmentRepository(db)

    def get_recording(self, uid: str) -> Optional[Recording]:
        """Get recording by UID."""
        return self.repo.get_by_uid(uid)

    def list_recordings(
        self,
        workspace_id: int,
        search: Optional[str] = None,
        tags: Optional[list[str]] = None,
        status: Optional[RecordingStatus] = None,
        from_date: Optional[datetime] = None,
        to_date: Optional[datetime] = None,
        sort: str = "created_at",
        order: str = "desc",
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Recording], int]:
        """List recordings with filters and pagination."""
        return self.repo.get_by_workspace(
            workspace_id=workspace_id,
            search=search,
            tags=tags,
            status=status,
            from_date=from_date,
            to_date=to_date,
            sort=sort,
            order=order,
            page=page,
            page_size=page_size,
        )

    def create_recording(
        self,
        workspace_id: int,
        data: RecordingCreate,
        user_id: int,
    ) -> Recording:
        """Create a new recording."""
        recording = Recording(
            uid=str(uuid.uuid4()),
            workspace_id=workspace_id,
            name=data.name,
            tags=json.dumps(data.tags),
            status=RecordingStatus.RECORDING,
            enter_url=data.enter_url,
            source=data.source,
            created_by=user_id,
            total_duration=0,
            total_size=0,
        )
        return self.repo.create(recording)

    def update_recording(
        self,
        uid: str,
        data: RecordingUpdate,
    ) -> Optional[Recording]:
        """Update an existing recording."""
        recording = self.repo.get_by_uid(uid)
        if not recording:
            return None

        if data.name is not None:
            recording.name = data.name
        if data.tags is not None:
            recording.tags = json.dumps(data.tags)
        if data.status is not None:
            recording.status = data.status
        if data.exit_url is not None:
            recording.exit_url = data.exit_url
        if data.total_duration is not None:
            recording.total_duration = data.total_duration
        if data.total_size is not None:
            recording.total_size = data.total_size

        recording.updated_at = datetime.now(UTC)
        return self.repo.update(recording)

    def delete_recording(self, uid: str) -> bool:
        """Delete a recording and its segments."""
        recording = self.repo.get_by_uid(uid)
        if not recording:
            return False

        # Delete from S3
        storage_keys = self.segment_repo.get_storage_keys(recording.id)
        for key in storage_keys:
            self.storage.delete_file(key)

        # Delete from DB (cascade will delete segments)
        self.repo.delete(recording)
        return True

    def batch_delete(self, uids: list[str]) -> int:
        """Delete multiple recordings."""
        return self.repo.delete_batch(uids)

    def batch_update_tags(self, data: BatchTagsRequest) -> int:
        """Update tags for multiple recordings."""
        return self.repo.update_tags_batch(
            uids=data.uids,
            action=data.action,
            tags=data.tags,
        )

    def get_segments(self, recording_uid: str) -> Optional[list[Segment]]:
        """Get all segments for a recording."""
        recording = self.repo.get_by_uid(recording_uid)
        if not recording:
            return None
        return self.segment_repo.get_by_recording(recording.id)

    def add_segment(
        self,
        recording_uid: str,
        data: SegmentCreate,
    ) -> Optional[SegmentCreateResponse]:
        """Add a segment to a recording."""
        recording = self.repo.get_by_uid(recording_uid)
        if not recording:
            return None

        sequence = self.segment_repo.get_next_sequence(recording.id)

        segment = Segment(
            uid=str(uuid.uuid4()),
            recording_id=recording.id,
            sequence=sequence,
            start_time=data.start_time,
            end_time=data.end_time,
            page_urls=json.dumps(data.page_urls),
            storage_key=data.storage_key,
            size=data.size,
        )
        created_segment = self.segment_repo.create(segment)

        # Increment recording totals by this segment's contribution.
        # (Avoids an O(n) re-aggregation on every segment add.)
        segment_duration = 0
        if data.end_time is not None and data.start_time is not None:
            segment_duration = int((data.end_time - data.start_time).total_seconds())

        recording.total_duration = (recording.total_duration or 0) + segment_duration
        recording.total_size = (recording.total_size or 0) + data.size
        recording.updated_at = datetime.now(UTC)
        self.repo.update(recording)

        return SegmentCreateResponse(
            uid=created_segment.uid,
            sequence=created_segment.sequence,
        )

    def generate_upload_url(
        self,
        workspace_code: str,
        recording_uid: str,
        segment_uid: str,
        data: PresignedUrlRequest,
    ) -> PresignedUrlResponse:
        """Generate presigned URL for upload.

        Storage key follows the S3 directory convention
        (see `.pi/rules/rules-s3.md`):
            neo/workspace_{workspace_code}/recording/{recording_uid}/{segment_uid}.rrweb.json
        """
        storage_key = f"neo/workspace_{workspace_code}/recording/{recording_uid}/{segment_uid}.rrweb.json"
        result = self.storage.generate_presigned_upload_url(
            storage_key=storage_key,
            content_type=data.content_type,
        )
        return PresignedUrlResponse(
            upload_url=result.url,
            storage_key=result.storage_key,
            expires_in=result.expires_in,
        )

    def generate_download_url(
        self,
        segment_uid: str,
    ) -> Optional[DownloadUrlResponse]:
        """Generate presigned URL for download."""
        segment = self.segment_repo.get_by_uid(segment_uid)
        if not segment:
            return None

        result = self.storage.generate_presigned_download_url(
            storage_key=segment.storage_key,
        )
        return DownloadUrlResponse(
            download_url=result.url,
            expires_in=result.expires_in,
        )

    def complete_recording(self, uid: str, exit_url: str) -> Optional[Recording]:
        """Mark recording as completed."""
        recording = self.repo.get_by_uid(uid)
        if not recording:
            return None

        recording.status = RecordingStatus.COMPLETED
        recording.exit_url = exit_url
        recording.updated_at = datetime.now(UTC)

        # Calculate totals from segments
        segments = self.segment_repo.get_by_recording(recording.id)
        recording.total_duration = sum(
            (s.end_time - s.start_time).total_seconds() if s.end_time else 0 for s in segments
        )
        recording.total_size = sum(s.size for s in segments)

        return self.repo.update(recording)
