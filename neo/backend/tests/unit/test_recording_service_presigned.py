"""Unit tests for RecordingService Presigned URL operations (task 6.3).

Covers:
- generate_upload_url:
    * Storage key follows `neo/workspace_{code}/recording/{recording}/{segment}.rrweb.json`
    * workspace_code (str) is used, not workspace_id (int)
    * Different workspace_codes produce isolated top-level paths
    * File extension is `.rrweb.json`
    * content_type and expires_in are forwarded to the storage layer
- generate_download_url:
    * Returns a DownloadUrlResponse with the presigned URL
    * Uses the segment's stored storage_key
    * Returns None when the segment UID is unknown
"""

from datetime import UTC, datetime
from unittest.mock import MagicMock

import pytest
from sqlalchemy.orm import Session

from app.models import OrganizationUnit, OrgUnitType, User, Workspace, WorkspaceMember
from app.schemas.recording import PresignedUrlRequest, RecordingCreate, SegmentCreate
from app.services.auth_service import hash_password
from app.services.recording_service import RecordingService
from app.storage.service import PresignedUrlResult

# ==================== Fixtures ====================


@pytest.fixture
def workspace(db_session: Session) -> Workspace:
    from app.models import MemberRole, WorkspaceStatus

    org = OrganizationUnit(
        name="PS Org",
        code="PS_ORG",
        type=OrgUnitType.COMPANY,
        level=0,
    )
    db_session.add(org)
    db_session.flush()

    user = User(
        phone="13800138002",
        hashed_password=hash_password("abcd1234"),
        username="ps_user",
        is_active=True,
    )
    db_session.add(user)
    db_session.flush()

    ws = Workspace(
        name="PS WS",
        code="ws_ps",
        status=WorkspaceStatus.ACTIVE,
        org_id=org.id,
        owner_id=user.id,
    )
    db_session.add(ws)
    db_session.flush()
    db_session.add(WorkspaceMember(workspace_id=ws.id, user_id=user.id, role=MemberRole.OWNER))
    db_session.commit()
    db_session.refresh(ws)
    return ws


@pytest.fixture
def mock_storage() -> MagicMock:
    """Pre-configured mock storage that returns a valid PresignedUrlResult."""
    storage = MagicMock()
    storage.generate_presigned_upload_url.return_value = PresignedUrlResult(
        url="https://rustfs.example/upload",
        storage_key="ignored-by-mock",
        expires_in=3600,
    )
    storage.generate_presigned_download_url.return_value = PresignedUrlResult(
        url="https://rustfs.example/download",
        storage_key="ignored-by-mock",
        expires_in=3600,
    )
    return storage


@pytest.fixture
def service(db_session: Session, mock_storage) -> RecordingService:
    return RecordingService(db_session, mock_storage)


# ==================== generate_upload_url: storage_key path ====================


class TestGenerateUploadUrlStorageKey:
    """Storage key format must follow `.pi/rules/rules-s3.md`."""

    def test_storage_key_follows_s3_directory_convention(self, service):
        service.generate_upload_url(
            workspace_code="wsp_demo",
            recording_uid="rec-abc123",
            segment_uid="seg-xyz789",
            data=PresignedUrlRequest(
                filename="segment-001.rrweb.json",
                content_type="application/json",
            ),
        )

        actual_key = service.storage.generate_presigned_upload_url.call_args.kwargs["storage_key"]
        assert actual_key == ("neo/workspace_wsp_demo/recording/rec-abc123/seg-xyz789.rrweb.json")

    def test_storage_key_uses_workspace_code_not_workspace_id(self, service):
        """Regression: original code used `recordings/<int>/...`."""
        service.generate_upload_url(
            workspace_code="alpha-1",
            recording_uid="rec-1",
            segment_uid="seg-1",
            data=PresignedUrlRequest(filename="x.rrweb.json"),
        )

        actual_key = service.storage.generate_presigned_upload_url.call_args.kwargs["storage_key"]
        assert not actual_key.startswith("recordings/")
        segments = actual_key.split("/")
        assert segments[0] == "neo"
        assert segments[1] == "workspace_alpha-1"
        assert segments[2] == "recording"

    def test_storage_key_segments_are_isolated_by_workspace(self, service):
        service.generate_upload_url(
            workspace_code="wsp_a",
            recording_uid="rec-1",
            segment_uid="seg-1",
            data=PresignedUrlRequest(filename="x.rrweb.json"),
        )
        key_a = service.storage.generate_presigned_upload_url.call_args.kwargs["storage_key"]

        service.generate_upload_url(
            workspace_code="wsp_b",
            recording_uid="rec-1",
            segment_uid="seg-1",
            data=PresignedUrlRequest(filename="x.rrweb.json"),
        )
        key_b = service.storage.generate_presigned_upload_url.call_args.kwargs["storage_key"]

        assert key_a != key_b
        assert key_a.startswith("neo/workspace_wsp_a/")
        assert key_b.startswith("neo/workspace_wsp_b/")

    def test_storage_key_extension_is_rrweb_json(self, service):
        service.generate_upload_url(
            workspace_code="wsp_demo",
            recording_uid="rec-1",
            segment_uid="seg-1",
            data=PresignedUrlRequest(filename="ignored.rrweb.json"),
        )
        actual_key = service.storage.generate_presigned_upload_url.call_args.kwargs["storage_key"]
        assert actual_key.endswith(".rrweb.json")


# ==================== generate_upload_url: response wiring ====================


class TestGenerateUploadUrlResponse:
    """The service must relay storage fields into the response schema."""

    def test_returns_presigned_url_and_storage_key(self, service):
        service.storage.generate_presigned_upload_url.return_value = PresignedUrlResult(
            url="https://rustfs.example/upload?X-Amz-...",
            storage_key="neo/workspace_w/recording/r/s.rrweb.json",
            expires_in=1800,
        )

        result = service.generate_upload_url(
            workspace_code="w",
            recording_uid="r",
            segment_uid="s",
            data=PresignedUrlRequest(filename="s.rrweb.json"),
        )

        assert result.upload_url == "https://rustfs.example/upload?X-Amz-..."
        assert result.storage_key == "neo/workspace_w/recording/r/s.rrweb.json"
        assert result.expires_in == 1800

    def test_forwards_content_type_to_storage(self, service):
        service.generate_upload_url(
            workspace_code="w",
            recording_uid="r",
            segment_uid="s",
            data=PresignedUrlRequest(
                filename="s.rrweb.json",
                content_type="application/x-rrweb",
            ),
        )

        kwargs = service.storage.generate_presigned_upload_url.call_args.kwargs
        assert kwargs["content_type"] == "application/x-rrweb"


# ==================== generate_download_url ====================


class TestGenerateDownloadUrl:
    """Tests for generate_download_url."""

    def test_returns_presigned_url_for_existing_segment(self, service, workspace):
        # Seed a recording + segment so we have a real storage_key to look up
        recording = service.create_recording(
            workspace_id=workspace.id,
            data=RecordingCreate(name="dl"),
            user_id=workspace.owner_id,
        )
        service.add_segment(
            recording.uid,
            SegmentCreate(
                start_time=datetime.now(UTC),
                storage_key="neo/workspace_ws_ps/recording/abc/seg-1.rrweb.json",
                size=1024,
            ),
        )
        segment = service.get_segments(recording.uid)[0]
        service.storage.generate_presigned_download_url.return_value = PresignedUrlResult(
            url="https://rustfs.example/dl?X-Amz-...",
            storage_key=segment.storage_key,
            expires_in=900,
        )

        result = service.generate_download_url(segment.uid)

        assert result is not None
        assert result.download_url == "https://rustfs.example/dl?X-Amz-..."
        assert result.expires_in == 900
        # Storage was called with the segment's stored storage_key
        service.storage.generate_presigned_download_url.assert_called_once_with(
            storage_key="neo/workspace_ws_ps/recording/abc/seg-1.rrweb.json"
        )

    def test_returns_none_for_unknown_segment(self, service):
        result = service.generate_download_url("nonexistent-segment-uid")
        assert result is None
        # Storage must not be called when the segment is missing
        service.storage.generate_presigned_download_url.assert_not_called()
