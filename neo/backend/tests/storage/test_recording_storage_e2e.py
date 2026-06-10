"""End-to-end integration tests for RecordingService against real RustFS.

This suite wires together the real DB session (SQLite, from conftest),
a real RustFS bucket, and the real RecordingService. It exercises the
full S3 round-trip using actual presigned URLs (HTTP PUT/GET), which
is the only way to confirm the bytes we generate here match what
gets replayed later by the player.

Run with:
    RUN_INTEGRATION_TESTS=1 pytest tests/storage/test_recording_storage_e2e.py -v
"""

import json
import os
import uuid
from datetime import UTC, datetime, timedelta

import pytest
import requests
from sqlalchemy.orm import Session

# Skip unless explicitly enabled
pytestmark = pytest.mark.skipif(
    not os.environ.get("RUN_INTEGRATION_TESTS"),
    reason="Integration tests require RUN_INTEGRATION_TESTS=1 and running RustFS instance",
)


# ==================== Module-level helpers (shared across test classes) ====================


def put_bytes(url: str, payload: bytes, content_type: str) -> None:
    """PUT bytes to a presigned URL; raise on non-2xx."""
    resp = requests.put(url, data=payload, headers={"Content-Type": content_type}, timeout=10)
    assert resp.status_code in (200, 204), f"PUT failed: {resp.status_code} {resp.text[:200]}"


def get_bytes(url: str) -> bytes:
    """GET bytes from a presigned URL; raise on non-2xx."""
    resp = requests.get(url, timeout=10)
    assert resp.status_code == 200, f"GET failed: {resp.status_code} {resp.text[:200]}"
    return resp.content


def seed_recording(service, workspace, name: str = "e2e"):
    """Create a recording and return it."""
    from app.schemas.recording import RecordingCreate

    return service.create_recording(
        workspace_id=workspace.id,
        data=RecordingCreate(name=name),
        user_id=workspace.owner_id,
    )


# ==================== Fixtures ====================


@pytest.fixture(scope="module")
def rustfs_service():
    from app.storage.service import RustFSService

    return RustFSService()


@pytest.fixture
def default_bucket(rustfs_service):
    """The bucket the service writes to (RustFSService.default_bucket).

    Presigned URLs are signed for the default bucket, not a custom one.
    """
    return rustfs_service.default_bucket


@pytest.fixture
def cleanup_keys(rustfs_service):
    """Track storage keys created during a test so we can clean them up."""
    keys: list[str] = []

    yield keys

    for k in keys:
        try:
            rustfs_service.delete_file(k)
        except Exception:
            pass


@pytest.fixture
def workspace(db_session: Session):
    from app.models import (
        MemberRole,
        OrganizationUnit,
        OrgUnitType,
        User,
        Workspace,
        WorkspaceMember,
        WorkspaceStatus,
    )
    from app.services.auth_service import hash_password

    org = OrganizationUnit(
        name="E2E Org",
        code=f"E2E_ORG_{uuid.uuid4().hex[:6]}",
        type=OrgUnitType.COMPANY,
        level=0,
    )
    db_session.add(org)
    db_session.flush()

    user = User(
        phone="13800138002",
        hashed_password=hash_password("abcd1234"),
        username="e2e_user",
        is_active=True,
    )
    db_session.add(user)
    db_session.flush()

    ws = Workspace(
        name="E2E WS",
        code=f"ws_e2e_{uuid.uuid4().hex[:6]}",
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
def service_with_real_storage(db_session: Session, rustfs_service):
    """RecordingService backed by the real RustFS client."""
    from app.services.recording_service import RecordingService

    return RecordingService(db_session, rustfs_service)


# ==================== Round-trip ====================


class TestUploadDownloadRoundTrip:
    """Upload data via the presigned URL, then download and compare bytes."""

    def test_rrweb_payload_round_trip(self, service_with_real_storage, workspace, rustfs_service, cleanup_keys):
        """Realistic rrweb JSON payload survives the upload→download cycle."""
        from app.schemas.recording import PresignedUrlRequest, SegmentCreate

        service = service_with_real_storage
        recording = seed_recording(service, workspace)
        segment_uid = f"seg-{uuid.uuid4().hex}"

        # 1) Get an upload URL
        presigned = service.generate_upload_url(
            workspace_code=workspace.code,
            recording_uid=recording.uid,
            segment_uid=segment_uid,
            data=PresignedUrlRequest(
                filename=f"{segment_uid}.rrweb.json",
                content_type="application/json",
            ),
        )
        expected_key = f"neo/workspace_{workspace.code}/recording/{recording.uid}/{segment_uid}.rrweb.json"
        assert presigned.storage_key == expected_key
        cleanup_keys.append(expected_key)

        # 2) PUT a realistic rrweb payload through the presigned URL
        rrweb_payload = json.dumps(
            [
                {"type": 4, "data": {"href": "https://example.com/", "width": 1280}},
                {"type": 5, "data": {"source": 1, "lines": []}},
                {"type": 6, "data": {"source": 1, "lines": []}},
            ]
        ).encode("utf-8")
        put_bytes(presigned.upload_url, rrweb_payload, "application/json")

        # 3) Object must exist in S3
        assert rustfs_service.file_exists(expected_key)

        # 4) Register the segment in DB
        t0 = datetime.now(UTC)
        result = service.add_segment(
            recording.uid,
            SegmentCreate(
                start_time=t0,
                end_time=t0 + timedelta(seconds=10),
                page_urls=["https://example.com/"],
                storage_key=expected_key,
                size=len(rrweb_payload),
            ),
        )
        assert result is not None
        assert result.sequence == 1

        # 5) Download via the presigned download URL
        download = service.generate_download_url(result.uid)
        assert download is not None
        downloaded = get_bytes(download.download_url)

        # 6) Bytes must match exactly
        assert downloaded == rrweb_payload

    def test_storage_key_visible_to_s3_head_object(
        self, service_with_real_storage, workspace, rustfs_service, cleanup_keys
    ):
        """The storage_key reported by the service is queryable via boto3 head_object."""
        from app.schemas.recording import PresignedUrlRequest

        service = service_with_real_storage
        recording = seed_recording(service, workspace, name="head-test")
        segment_uid = f"seg-{uuid.uuid4().hex}"

        presigned = service.generate_upload_url(
            workspace_code=workspace.code,
            recording_uid=recording.uid,
            segment_uid=segment_uid,
            data=PresignedUrlRequest(
                filename=f"{segment_uid}.rrweb.json",
                content_type="application/json",
            ),
        )
        cleanup_keys.append(presigned.storage_key)
        put_bytes(presigned.upload_url, b'{"events":[]}', "application/json")

        # head_object on the reported key must succeed
        settings = rustfs_service._settings
        head = rustfs_service.client.head_object(Bucket=settings.RUSTFS_BUCKET, Key=presigned.storage_key)
        assert head["ResponseMetadata"]["HTTPStatusCode"] == 200
        assert head["ContentLength"] == len(b'{"events":[]}')


# ==================== Cleanup ====================


class TestDeleteCleansS3:
    """delete_recording must remove all segment files from S3, not just the DB rows."""

    def test_delete_recording_removes_segment_files(self, service_with_real_storage, workspace, rustfs_service):
        from app.schemas.recording import (
            PresignedUrlRequest,
            RecordingCreate,
            SegmentCreate,
        )

        service = service_with_real_storage
        recording = service.create_recording(
            workspace_id=workspace.id,
            data=RecordingCreate(name="cleanup-test"),
            user_id=workspace.owner_id,
        )

        # Upload two segments
        keys: list[str] = []
        for _ in range(2):
            seg_uid = f"seg-{uuid.uuid4().hex}"
            presigned = service.generate_upload_url(
                workspace_code=workspace.code,
                recording_uid=recording.uid,
                segment_uid=seg_uid,
                data=PresignedUrlRequest(
                    filename=f"{seg_uid}.rrweb.json",
                    content_type="application/json",
                ),
            )
            put_bytes(presigned.upload_url, b"x", "application/json")

            t0 = datetime.now(UTC)
            added = service.add_segment(
                recording.uid,
                SegmentCreate(
                    start_time=t0,
                    end_time=t0 + timedelta(seconds=1),
                    page_urls=[],
                    storage_key=presigned.storage_key,
                    size=1,
                ),
            )
            assert added is not None
            keys.append(presigned.storage_key)

        # Pre-condition: both files exist in the default bucket
        for k in keys:
            assert rustfs_service.file_exists(k)

        # Delete the recording (must also remove the segment files from S3)
        assert service.delete_recording(recording.uid) is True

        # Post-condition: both files gone from S3
        for k in keys:
            assert not rustfs_service.file_exists(k)
