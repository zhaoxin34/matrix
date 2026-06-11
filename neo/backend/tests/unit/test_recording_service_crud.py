"""Unit tests for RecordingService CRUD operations (task 6.1).

Covers:
- create_recording
- get_recording
- list_recordings (filters, pagination, sort)
- update_recording
- delete_recording (incl. S3 file cleanup)
- batch_delete
- batch_update_tags
- complete_recording

Storage (RustFS) is mocked; DB is the real SQLite session from conftest.
"""

from datetime import UTC, datetime, timedelta
from unittest.mock import MagicMock

import pytest
from sqlalchemy.orm import Session

from app.models import OrganizationUnit, OrgUnitType, User, Workspace, WorkspaceMember
from app.models.recording import Recording, RecordingSource, RecordingStatus
from app.schemas.recording import (
    BatchTagsRequest,
    RecordingCreate,
    RecordingUpdate,
)
from app.services.auth_service import hash_password
from app.services.recording_service import RecordingService

# ==================== Fixtures ====================


@pytest.fixture
def workspace(db_session: Session) -> Workspace:
    """Create a workspace and owner user, return the workspace."""
    from app.models import MemberRole, WorkspaceStatus

    org = OrganizationUnit(
        name="Test Org",
        code="TEST_ORG_CRUD",
        type=OrgUnitType.COMPANY,
        level=0,
    )
    db_session.add(org)
    db_session.flush()

    user = User(
        phone="13800138002",
        hashed_password=hash_password("abcd1234"),
        username="crud_user",
        is_active=True,
    )
    db_session.add(user)
    db_session.flush()

    workspace = Workspace(
        name="CRUD WS",
        code="ws_crud",
        status=WorkspaceStatus.ACTIVE,
        org_id=org.id,
        owner_id=user.id,
    )
    db_session.add(workspace)
    db_session.flush()

    db_session.add(
        WorkspaceMember(
            workspace_id=workspace.id,
            user_id=user.id,
            role=MemberRole.OWNER,
        )
    )
    db_session.commit()
    db_session.refresh(workspace)
    return workspace


@pytest.fixture
def other_workspace(db_session: Session) -> Workspace:
    """Create a second workspace (used for cross-workspace isolation tests)."""
    from app.models import WorkspaceStatus

    org = OrganizationUnit(
        name="Other Org",
        code="OTHER_ORG",
        type=OrgUnitType.COMPANY,
        level=0,
    )
    db_session.add(org)
    db_session.flush()

    user = User(
        phone="13800138099",
        hashed_password=hash_password("abcd1234"),
        username="other_user",
        is_active=True,
    )
    db_session.add(user)
    db_session.flush()

    workspace = Workspace(
        name="Other WS",
        code="ws_other",
        status=WorkspaceStatus.ACTIVE,
        org_id=org.id,
        owner_id=user.id,
    )
    db_session.add(workspace)
    db_session.commit()
    db_session.refresh(workspace)
    return workspace


@pytest.fixture
def service(db_session: Session) -> RecordingService:
    """RecordingService with mocked storage backend."""
    storage = MagicMock()
    return RecordingService(db_session, storage)


# ==================== create_recording ====================


class TestCreateRecording:
    """Tests for create_recording."""

    def test_creates_with_minimal_fields(self, service, workspace):
        """Defaults: status=recording, source=agent, total_*=0, tags=[]."""
        data = RecordingCreate(name="minimal")

        recording = service.create_recording(
            workspace_id=workspace.id,
            data=data,
            user_id=workspace.owner_id,
        )

        assert recording.id is not None
        assert recording.uid  # UUID generated
        assert recording.workspace_id == workspace.id
        assert recording.name == "minimal"
        assert recording.status == RecordingStatus.RECORDING
        assert recording.source == RecordingSource.AGENT
        assert recording.total_duration == 0
        assert recording.total_size == 0
        # tags is stored as JSON text
        import json

        assert json.loads(recording.tags) == []

    def test_creates_with_all_fields(self, service, workspace):
        """All optional fields are persisted."""
        data = RecordingCreate(
            name="full",
            tags=["demo", "tutorial"],
            enter_url="https://example.com/start",
            source=RecordingSource.UPLOAD,
        )

        recording = service.create_recording(
            workspace_id=workspace.id,
            data=data,
            user_id=workspace.owner_id,
        )

        assert recording.name == "full"
        assert recording.enter_url == "https://example.com/start"
        assert recording.source == RecordingSource.UPLOAD
        import json

        assert json.loads(recording.tags) == ["demo", "tutorial"]

    def test_generates_unique_uids(self, service, workspace):
        """Two recordings must have different UIDs."""
        r1 = service.create_recording(
            workspace_id=workspace.id,
            data=RecordingCreate(name="r1"),
            user_id=workspace.owner_id,
        )
        r2 = service.create_recording(
            workspace_id=workspace.id,
            data=RecordingCreate(name="r2"),
            user_id=workspace.owner_id,
        )
        assert r1.uid != r2.uid


# ==================== get_recording ====================


class TestGetRecording:
    """Tests for get_recording."""

    def test_returns_existing_recording(self, service, workspace):
        data = RecordingCreate(name="findme")
        created = service.create_recording(workspace_id=workspace.id, data=data, user_id=workspace.owner_id)

        found = service.get_recording(created.uid)

        assert found is not None
        assert found.id == created.id
        assert found.name == "findme"

    def test_returns_none_for_unknown_uid(self, service):
        assert service.get_recording("nonexistent-uid") is None


# ==================== list_recordings ====================


class TestListRecordings:
    """Tests for list_recordings."""

    def _seed(self, service, workspace, n: int) -> list[Recording]:
        return [
            service.create_recording(
                workspace_id=workspace.id,
                data=RecordingCreate(name=f"rec-{i:02d}"),
                user_id=workspace.owner_id,
            )
            for i in range(n)
        ]

    def test_pagination(self, service, workspace):
        """Total count + page slicing work."""
        self._seed(service, workspace, 25)

        page1, total1 = service.list_recordings(workspace_id=workspace.id, page=1, page_size=10)
        page3, total3 = service.list_recordings(workspace_id=workspace.id, page=3, page_size=10)

        assert total1 == total3 == 25
        assert len(page1) == 10
        assert len(page3) == 5  # 25 - 2*10

    def test_filter_by_search(self, service, workspace):
        """Name search is case-insensitive substring match."""
        self._seed(service, workspace, 3)
        service.create_recording(
            workspace_id=workspace.id,
            data=RecordingCreate(name="Login Flow"),
            user_id=workspace.owner_id,
        )

        items, total = service.list_recordings(workspace_id=workspace.id, search="login")

        assert total == 1
        assert items[0].name == "Login Flow"

    def test_filter_by_status(self, service, workspace):
        """Status filter applies."""
        r1 = self._seed(service, workspace, 1)[0]
        r1.status = RecordingStatus.COMPLETED
        service.repo.update(r1)
        self._seed(service, workspace, 2)  # still RECORDING

        completed, total_completed = service.list_recordings(
            workspace_id=workspace.id, status=RecordingStatus.COMPLETED
        )
        recording, total_recording = service.list_recordings(
            workspace_id=workspace.id, status=RecordingStatus.RECORDING
        )

        assert total_completed == 1
        assert total_recording == 2

    def test_cross_workspace_isolation(self, service, workspace, other_workspace):
        """Other workspace's recordings must not leak in."""
        self._seed(service, workspace, 2)
        self._seed(service, other_workspace, 3)

        items_a, total_a = service.list_recordings(workspace_id=workspace.id)
        items_b, total_b = service.list_recordings(workspace_id=other_workspace.id)

        assert total_a == 2
        assert total_b == 3
        assert {r.workspace_id for r in items_a} == {workspace.id}
        assert {r.workspace_id for r in items_b} == {other_workspace.id}

    def test_sort_and_order(self, service, workspace):
        """Default sort is created_at desc; ascending reverses order."""
        self._seed(service, workspace, 3)

        desc, _ = service.list_recordings(workspace_id=workspace.id, sort="name", order="desc")
        asc, _ = service.list_recordings(workspace_id=workspace.id, sort="name", order="asc")

        assert [r.name for r in desc] == ["rec-02", "rec-01", "rec-00"]
        assert [r.name for r in asc] == ["rec-00", "rec-01", "rec-02"]


# ==================== update_recording ====================


class TestUpdateRecording:
    """Tests for update_recording."""

    def test_updates_only_provided_fields(self, service, workspace):
        created = service.create_recording(
            workspace_id=workspace.id,
            data=RecordingCreate(name="before", tags=["old"]),
            user_id=workspace.owner_id,
        )

        updated = service.update_recording(
            created.uid,
            RecordingUpdate(name="after", status=RecordingStatus.COMPLETED),
        )

        assert updated.name == "after"
        assert updated.status == RecordingStatus.COMPLETED
        # Unchanged fields
        import json

        assert json.loads(updated.tags) == ["old"]

    def test_returns_none_for_unknown_uid(self, service):
        result = service.update_recording("nope", RecordingUpdate(name="x"))
        assert result is None


# ==================== delete_recording ====================


class TestDeleteRecording:
    """Tests for delete_recording."""

    def test_deletes_recording_and_cleans_s3(self, service, workspace):
        created = service.create_recording(
            workspace_id=workspace.id,
            data=RecordingCreate(name="to-delete"),
            user_id=workspace.owner_id,
        )
        # Add a segment with a storage key
        from app.schemas.recording import SegmentCreate

        service.add_segment(
            created.uid,
            SegmentCreate(
                start_time=datetime.now(UTC),
                end_time=datetime.now(UTC) + timedelta(seconds=10),
                page_urls=["https://example.com"],
                storage_key="neo/workspace_ws_crud/recording/abc/seg-1.rrweb.json",
                size=1024,
            ),
        )

        result = service.delete_recording(created.uid)

        assert result is True
        assert service.get_recording(created.uid) is None
        # Storage delete was called for the segment's storage_key
        service.storage.delete_file.assert_called_once_with("neo/workspace_ws_crud/recording/abc/seg-1.rrweb.json")

    def test_returns_false_for_unknown_uid(self, service):
        assert service.delete_recording("nope") is False


# ==================== batch_delete ====================


class TestBatchDelete:
    """Tests for batch_delete."""

    def test_deletes_multiple(self, service, workspace):
        uids = [
            service.create_recording(
                workspace_id=workspace.id,
                data=RecordingCreate(name=f"b-{i}"),
                user_id=workspace.owner_id,
            ).uid
            for i in range(3)
        ]

        count = service.batch_delete(uids)

        assert count == 3
        for uid in uids:
            assert service.get_recording(uid) is None

    def test_returns_zero_for_empty_list(self, service):
        assert service.batch_delete([]) == 0

    def test_deletes_multiple_and_cleans_rustfs(self, service, workspace):
        """batch_delete must delete both MySQL records and rustfs segment files."""
        from app.schemas.recording import SegmentCreate

        # Create 2 recordings, each with 1 segment — save uids before deletion
        uids = []
        keys = []
        for i in range(2):
            r = service.create_recording(
                workspace_id=workspace.id,
                data=RecordingCreate(name=f"batch-{i}"),
                user_id=workspace.owner_id,
            )
            uid = r.uid
            uids.append(uid)
            t0 = datetime.now(UTC)
            service.add_segment(
                uid,
                SegmentCreate(
                    start_time=t0,
                    end_time=t0 + timedelta(seconds=5),
                    page_urls=["https://example.com"],
                    storage_key=f"neo/workspace_{workspace.code}/recording/{uid}/seg-{i}.rrweb.json",
                    size=512,
                ),
            )
            keys.append(f"neo/workspace_{workspace.code}/recording/{uid}/seg-{i}.rrweb.json")

        # Reset mock call list before batch_delete
        service.storage.reset_mock()

        count = service.batch_delete(uids)

        # DB: all deleted
        assert count == 2
        for uid in uids:
            assert service.get_recording(uid) is None

        # RustFS: delete_file called once per segment (2 recordings × 1 segment)
        from unittest.mock import call

        service.storage.delete_file.assert_has_calls([call(k) for k in keys], any_order=True)
        assert service.storage.delete_file.call_count == 2

    def test_rustfs_delete_failure_still_deletes_db(self, service, workspace, caplog):
        """If rustfs delete fails, DB records must still be deleted (fail-fast on DB is worse)."""
        from app.schemas.recording import SegmentCreate

        r = service.create_recording(
            workspace_id=workspace.id,
            data=RecordingCreate(name="failing-delete"),
            user_id=workspace.owner_id,
        )
        uid = r.uid  # capture uid before deletion
        t0 = datetime.now(UTC)
        service.add_segment(
            uid,
            SegmentCreate(
                start_time=t0,
                end_time=t0 + timedelta(seconds=5),
                page_urls=["https://example.com"],
                storage_key=f"neo/workspace_{workspace.code}/recording/{uid}/seg.rrweb.json",
                size=256,
            ),
        )

        # Simulate rustfs failure
        service.storage.delete_file.side_effect = OSError("rustfs unavailable")
        service.storage.reset_mock()

        with caplog.at_level("ERROR"):
            count = service.batch_delete([uid])

        # DB: recording is gone regardless
        assert count == 1
        assert service.get_recording(uid) is None

        # RustFS: still attempted
        service.storage.delete_file.assert_called_once_with(
            f"neo/workspace_{workspace.code}/recording/{uid}/seg.rrweb.json"
        )

        # Error logged (orphan key)
        assert any("orphan" in record.message.lower() for record in caplog.records), (
            "Expected an 'orphan' warning in logs after rustfs failure"
        )


# ==================== batch_update_tags ====================


class TestBatchUpdateTags:
    """Tests for batch_update_tags."""

    def test_add_tags(self, service, workspace):
        r1 = service.create_recording(
            workspace_id=workspace.id,
            data=RecordingCreate(name="r1", tags=["existing"]),
            user_id=workspace.owner_id,
        )
        r2 = service.create_recording(
            workspace_id=workspace.id,
            data=RecordingCreate(name="r2", tags=[]),
            user_id=workspace.owner_id,
        )

        count = service.batch_update_tags(BatchTagsRequest(uids=[r1.uid, r2.uid], action="add", tags=["new"]))

        import json

        assert count == 2
        assert json.loads(service.get_recording(r1.uid).tags) == ["existing", "new"]
        assert json.loads(service.get_recording(r2.uid).tags) == ["new"]

    def test_remove_tags(self, service, workspace):
        r = service.create_recording(
            workspace_id=workspace.id,
            data=RecordingCreate(name="r", tags=["a", "b", "c"]),
            user_id=workspace.owner_id,
        )

        service.batch_update_tags(BatchTagsRequest(uids=[r.uid], action="remove", tags=["b"]))

        import json

        assert json.loads(service.get_recording(r.uid).tags) == ["a", "c"]


# ==================== complete_recording ====================


class TestCompleteRecording:
    """Tests for complete_recording."""

    def test_marks_completed_and_aggregates_totals(self, service, workspace):
        created = service.create_recording(
            workspace_id=workspace.id,
            data=RecordingCreate(name="c"),
            user_id=workspace.owner_id,
        )
        from app.schemas.recording import SegmentCreate

        t0 = datetime.now(UTC)
        service.add_segment(
            created.uid,
            SegmentCreate(
                start_time=t0,
                end_time=t0 + timedelta(seconds=30),
                page_urls=["a"],
                storage_key="k1",
                size=100,
            ),
        )
        service.add_segment(
            created.uid,
            SegmentCreate(
                start_time=t0 + timedelta(seconds=30),
                end_time=t0 + timedelta(seconds=90),
                page_urls=["b"],
                storage_key="k2",
                size=200,
            ),
        )

        completed = service.complete_recording(created.uid, exit_url="https://x/exit")

        assert completed.status == RecordingStatus.COMPLETED
        assert completed.exit_url == "https://x/exit"
        assert completed.total_duration == 90  # 30 + 60
        assert completed.total_size == 300  # 100 + 200

    def test_returns_none_for_unknown_uid(self, service):
        assert service.complete_recording("nope", exit_url="") is None


# ==================== upload_segment_bytes (server-side proxy) ====================


class TestUploadSegmentBytes:
    """Tests for RecordingService.upload_segment_bytes.

    This is the path used by the browser to upload segment bytes through
    the backend (bypasses RustFS CORS, see rustfs/rustfs#1386).
    """

    def test_uploads_and_returns_canonical_storage_key(self, service, workspace):
        from app.schemas.recording import RecordingCreate

        recording = service.create_recording(
            workspace_id=workspace.id,
            data=RecordingCreate(name="upload"),
            user_id=workspace.owner_id,
        )
        body = b'{"events":[1,2,3]}'

        key = service.upload_segment_bytes(
            workspace_code=workspace.code,
            recording_uid=recording.uid,
            segment_uid="seg-abc123",
            body=body,
        )

        assert key == (f"neo/workspace_{workspace.code}/recording/{recording.uid}/seg-abc123.rrweb.json")
        # Storage was called with a BytesIO + the canonical key + content type
        service.storage.upload_fileobj.assert_called_once()
        kwargs = service.storage.upload_fileobj.call_args.kwargs
        assert kwargs["storage_key"] == key
        assert kwargs["content_type"] == "application/json"

    def test_rejects_invalid_segment_uid(self, service, workspace):
        from app.schemas.recording import RecordingCreate

        recording = service.create_recording(
            workspace_id=workspace.id,
            data=RecordingCreate(name="x"),
            user_id=workspace.owner_id,
        )
        for bad in ["", "../etc/passwd", "seg/with/slash", "seg with space", "x" * 129]:
            with pytest.raises(ValueError):
                service.upload_segment_bytes(
                    workspace_code=workspace.code,
                    recording_uid=recording.uid,
                    segment_uid=bad,
                    body=b"{}",
                )

    def test_rejects_oversize_body(self, service, workspace):
        from app.schemas.recording import RecordingCreate

        recording = service.create_recording(
            workspace_id=workspace.id,
            data=RecordingCreate(name="x"),
            user_id=workspace.owner_id,
        )
        too_big = b"x" * (RecordingService.MAX_SEGMENT_BYTES + 1)
        with pytest.raises(ValueError, match="too large"):
            service.upload_segment_bytes(
                workspace_code=workspace.code,
                recording_uid=recording.uid,
                segment_uid="seg-ok",
                body=too_big,
            )

    def test_returns_none_for_unknown_recording(self, service):
        assert (
            service.upload_segment_bytes(
                workspace_code="any",
                recording_uid="nope-uid",
                segment_uid="seg-1",
                body=b"{}",
            )
            is None
        )
