"""Recording service."""

import json
import logging
import uuid
from datetime import UTC, datetime

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

logger = logging.getLogger(__name__)


class RecordingService:
    """Service for Recording operations."""

    def __init__(self, db: Session, storage: RustFSService):
        """Initialize service."""
        self.db = db
        self.storage = storage
        self.repo = repo.RecordingRepository(db)
        self.segment_repo = repo.SegmentRepository(db)

    def get_recording(self, uid: str) -> Recording | None:
        """Get recording by UID."""
        return self.repo.get_by_uid(uid)

    def list_recordings(
        self,
        workspace_id: int,
        search: str | None = None,
        tags: list[str] | None = None,
        status: RecordingStatus | None = None,
        from_date: datetime | None = None,
        to_date: datetime | None = None,
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
    ) -> Recording | None:
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
        """Delete multiple recordings and their rustfs objects."""
        if not uids:
            return 0
        recordings = self.repo.get_by_uids(uids)
        if not recordings:
            return 0

        # 1) Collect and delete rustfs objects first
        storage_keys: list[str] = []
        for r in recordings:
            storage_keys.extend(self.segment_repo.get_storage_keys(r.id))

        failed_keys: list[str] = []
        for key in storage_keys:
            try:
                self.storage.delete_file(key)
            except Exception:  # noqa: BLE001
                failed_keys.append(key)
                logger.warning("rustfs delete failed: %s", key)

        if failed_keys:
            logger.error("batch_delete: %d rustfs objects left as orphans: %s", len(failed_keys), failed_keys)

        # 2) Delete DB records (cascade removes segments)
        return self.repo.delete_batch(uids)

    def batch_update_tags(self, data: BatchTagsRequest) -> int:
        """Update tags for multiple recordings."""
        return self.repo.update_tags_batch(
            uids=data.uids,
            action=data.action,
            tags=data.tags,
        )

    def get_segments(self, recording_uid: str) -> list[Segment] | None:
        """Get all segments for a recording."""
        recording = self.repo.get_by_uid(recording_uid)
        if not recording:
            return None
        return self.segment_repo.get_by_recording(recording.id)

    def add_segment(
        self,
        recording_uid: str,
        data: SegmentCreate,
    ) -> SegmentCreateResponse | None:
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

    # Maximum allowed segment body size (20 MB). rrweb JSON for a 10-minute
    # recording rarely exceeds a few MB; 20 MB gives generous headroom.
    MAX_SEGMENT_BYTES = 20 * 1024 * 1024
    # segment_uid is supplied by the client; constrain to a safe charset to
    # keep it from injecting path separators into the storage_key.
    _SEGMENT_UID_RE = __import__("re").compile(r"^[A-Za-z0-9_-]{1,128}$")

    def upload_segment_bytes(
        self,
        workspace_code: str,
        recording_uid: str,
        segment_uid: str,
        body: bytes,
        content_type: str = "application/json",
    ) -> str | None:
        """Upload raw segment bytes to S3 via the server (bypasses browser CORS).

        Returns the storage_key on success, None if the recording is unknown.
        Raises ValueError on invalid segment_uid or oversize body.
        """
        if not self._SEGMENT_UID_RE.match(segment_uid or ""):
            raise ValueError("invalid segment_uid")
        if len(body) > self.MAX_SEGMENT_BYTES:
            raise ValueError(f"segment body too large: {len(body)} > {self.MAX_SEGMENT_BYTES}")

        recording = self.repo.get_by_uid(recording_uid)
        if not recording:
            return None

        storage_key = f"neo/workspace_{workspace_code}/recording/{recording_uid}/{segment_uid}.rrweb.json"

        import io

        self.storage.upload_fileobj(
            io.BytesIO(body),
            storage_key=storage_key,
            content_type=content_type,
        )
        return storage_key

    def get_segment_bytes(
        self,
        workspace_code: str,
        recording_uid: str,
        segment_uid: str,
    ) -> tuple[bytes, str] | None:
        """Read a segment's bytes from S3 via the server (bypasses browser CORS).

        Returns (body, content_type) or None if the recording or segment is
        unknown. Raises ValueError on invalid segment_uid.

        The storage_key is read from the segment record (not reconstructed
        from the segment_uid) because the upload path uses a frontend-
        generated segment_uid that may differ from the DB row's primary
        key.
        """
        if not self._SEGMENT_UID_RE.match(segment_uid or ""):
            raise ValueError("invalid segment_uid")

        recording = self.repo.get_by_uid(recording_uid)
        if not recording:
            return None

        segment = self.segment_repo.get_by_uid(segment_uid)
        if not segment or segment.recording_id != recording.id:
            return None

        body, content_type = self.storage.get_object_bytes(segment.storage_key)
        return body, content_type

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
    ) -> DownloadUrlResponse | None:
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

    def complete_recording(self, uid: str, exit_url: str) -> Recording | None:
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
