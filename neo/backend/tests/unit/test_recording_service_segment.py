"""Unit tests for RecordingService Segment management (task 6.2).

Covers:
- get_segments: returns segments for a recording; None for unknown uid
- add_segment:
    * sequence auto-increments starting at 1
    * start_time / end_time / page_urls / storage_key / size are persisted
    * recording.total_duration is incremented by (end - start).total_seconds()
    * recording.total_size is incremented by segment size
    * subsequent segments keep accumulating (no double-counting, no reset)
    * a segment without end_time contributes 0 to duration
"""

from datetime import UTC, datetime, timedelta
from unittest.mock import MagicMock

import pytest
from sqlalchemy.orm import Session

from app.models import OrganizationUnit, OrgUnitType, User, Workspace, WorkspaceMember
from app.schemas.recording import RecordingCreate, SegmentCreate
from app.services.auth_service import hash_password
from app.services.recording_service import RecordingService

# ==================== Fixtures ====================


@pytest.fixture
def workspace(db_session: Session) -> Workspace:
    """Workspace + owner user."""
    from app.models import MemberRole, WorkspaceStatus

    org = OrganizationUnit(
        name="Seg Org",
        code="SEG_ORG",
        type=OrgUnitType.COMPANY,
        level=0,
    )
    db_session.add(org)
    db_session.flush()

    user = User(
        phone="13800138002",
        hashed_password=hash_password("abcd1234"),
        username="seg_user",
        is_active=True,
    )
    db_session.add(user)
    db_session.flush()

    ws = Workspace(
        name="Seg WS",
        code="ws_seg",
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
def service(db_session: Session) -> RecordingService:
    return RecordingService(db_session, MagicMock())


@pytest.fixture
def recording(service, workspace):
    return service.create_recording(
        workspace_id=workspace.id,
        data=RecordingCreate(name="rec-with-segs"),
        user_id=workspace.owner_id,
    )


# ==================== get_segments ====================


class TestGetSegments:
    """Tests for get_segments."""

    def test_returns_none_for_unknown_recording(self, service):
        assert service.get_segments("nonexistent-uid") is None

    def test_returns_empty_list_for_recording_without_segments(self, service, recording):
        assert service.get_segments(recording.uid) == []

    def test_returns_segments_ordered_by_sequence(self, service, recording):
        t0 = datetime.now(UTC)
        for i in range(3):
            service.add_segment(
                recording.uid,
                SegmentCreate(
                    start_time=t0 + timedelta(minutes=10 * i),
                    end_time=t0 + timedelta(minutes=10 * i + 10),
                    page_urls=[f"https://example.com/p{i}"],
                    storage_key=f"key-{i}",
                    size=100 * (i + 1),
                ),
            )

        segments = service.get_segments(recording.uid)

        assert segments is not None
        assert [s.sequence for s in segments] == [1, 2, 3]


# ==================== add_segment ====================


class TestAddSegment:
    """Tests for add_segment."""

    def test_returns_uid_and_sequence(self, service, recording):
        result = service.add_segment(
            recording.uid,
            SegmentCreate(
                start_time=datetime.now(UTC),
                end_time=datetime.now(UTC) + timedelta(seconds=10),
                page_urls=[],
                storage_key="k1",
                size=512,
            ),
        )

        assert result is not None
        assert result.uid  # UUID
        assert result.sequence == 1

    def test_persists_all_fields(self, service, recording):
        t0 = datetime.now(UTC)
        t1 = t0 + timedelta(seconds=42)
        page_urls = ["https://a.example", "https://b.example"]
        service.add_segment(
            recording.uid,
            SegmentCreate(
                start_time=t0,
                end_time=t1,
                page_urls=page_urls,
                storage_key="neo/workspace_x/recording/y/seg-1.rrweb.json",
                size=2048,
            ),
        )

        segments = service.get_segments(recording.uid)
        assert len(segments) == 1
        seg = segments[0]
        # SQLite drops tzinfo; compare as naive datetimes.
        assert seg.start_time.replace(tzinfo=None) == t0.replace(tzinfo=None)
        assert seg.end_time.replace(tzinfo=None) == t1.replace(tzinfo=None)
        # page_urls stored as JSON text
        import json

        assert json.loads(seg.page_urls) == page_urls
        assert seg.storage_key == "neo/workspace_x/recording/y/seg-1.rrweb.json"
        assert seg.size == 2048

    def test_sequence_auto_increments_from_one(self, service, recording):
        t0 = datetime.now(UTC)
        for i in range(1, 4):
            result = service.add_segment(
                recording.uid,
                SegmentCreate(
                    start_time=t0,
                    end_time=t0 + timedelta(seconds=10),
                    page_urls=[],
                    storage_key=f"k{i}",
                    size=1,
                ),
            )
            assert result.sequence == i

    def test_increments_total_duration(self, service, recording):
        t0 = datetime.now(UTC)
        service.add_segment(
            recording.uid,
            SegmentCreate(
                start_time=t0,
                end_time=t0 + timedelta(seconds=30),
                page_urls=[],
                storage_key="k1",
                size=1,
            ),
        )

        service.db.refresh(recording)
        assert recording.total_duration == 30

    def test_increments_total_size(self, service, recording):
        t0 = datetime.now(UTC)
        service.add_segment(
            recording.uid,
            SegmentCreate(
                start_time=t0,
                end_time=t0 + timedelta(seconds=10),
                page_urls=[],
                storage_key="k1",
                size=500,
            ),
        )
        service.add_segment(
            recording.uid,
            SegmentCreate(
                start_time=t0 + timedelta(seconds=10),
                end_time=t0 + timedelta(seconds=20),
                page_urls=[],
                storage_key="k2",
                size=700,
            ),
        )

        service.db.refresh(recording)
        assert recording.total_size == 1200

    def test_subsequent_segments_keep_accumulating(self, service, recording):
        """Regression guard: the bug-fix that replaced 'sum all' with 'increment'."""
        t0 = datetime.now(UTC)
        for i in range(5):
            service.add_segment(
                recording.uid,
                SegmentCreate(
                    start_time=t0 + timedelta(seconds=10 * i),
                    end_time=t0 + timedelta(seconds=10 * i + 5),
                    page_urls=[],
                    storage_key=f"k{i}",
                    size=10,
                ),
            )

        service.db.refresh(recording)
        # 5 segments × 5 seconds = 25; 5 segments × 10 bytes = 50
        assert recording.total_duration == 25
        assert recording.total_size == 50

    def test_segment_without_end_time_contributes_zero_duration(self, service, recording):
        t0 = datetime.now(UTC)
        # end_time is None (segment still in progress)
        service.add_segment(
            recording.uid,
            SegmentCreate(
                start_time=t0,
                end_time=None,
                page_urls=[],
                storage_key="k1",
                size=100,
            ),
        )

        service.db.refresh(recording)
        assert recording.total_duration == 0
        assert recording.total_size == 100  # size still accumulates

    def test_returns_none_for_unknown_recording(self, service):
        result = service.add_segment(
            "nonexistent-uid",
            SegmentCreate(
                start_time=datetime.now(UTC),
                storage_key="k",
                size=0,
            ),
        )
        assert result is None
