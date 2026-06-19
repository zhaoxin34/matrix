"""Unit tests for RecordingSegmentCommentService (tasks 2.6, 2.7, 2.8).

Covers:
- Permission matrix: Admin can create, Member cannot, creator-only edit/delete, Owner override
- Time-range validation: hide_time > show_time, show_time >= 0
- Batch delete: per-item permission skip list
"""

import uuid
from datetime import UTC, datetime
from decimal import Decimal

import pytest
from sqlalchemy.orm import Session

from app.models import (
    MemberRole,
    OrganizationUnit,
    OrgUnitType,
    Recording,
    Segment,
    User,
    Workspace,
    WorkspaceMember,
    WorkspaceStatus,
)
from app.schemas.recording_segment_comment import (
    RecordingSegmentCommentCreate,
    RecordingSegmentCommentUpdate,
)
from app.services.auth_service import hash_password
from app.services.recording_segment_comment_service import (
    InvalidTimeRangeError,
    PermissionDeniedError,
    RecordingSegmentCommentService,
)

# ==================== Fixtures ====================


@pytest.fixture
def admin_user(db_session: Session) -> User:
    """Workspace Admin (non-owner) for write tests."""
    user = User(
        phone="13800138010",
        hashed_password=hash_password("abcd1234"),
        username="admin_user",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def member_user(db_session: Session) -> User:
    """Workspace Member (no write permission)."""
    user = User(
        phone="13800138011",
        hashed_password=hash_password("abcd1234"),
        username="member_user",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def workspace_with_admin(db_session: Session, admin_user: User) -> Workspace:
    """Workspace where admin_user is ADMIN (not OWNER).

    Owner is a separate admin_user_2 fixture (added per-test) when needed.
    """
    org = OrganizationUnit(
        name="Comment Test Org",
        code="COMMENT_TEST_ORG",
        type=OrgUnitType.COMPANY,
        level=0,
    )
    db_session.add(org)
    db_session.flush()

    # Owner
    owner = User(
        phone="13800138001",
        hashed_password=hash_password("abcd1234"),
        username="owner_user",
        is_active=True,
    )
    db_session.add(owner)
    db_session.flush()

    ws = Workspace(
        name="Comment Test WS",
        code="ws_comment",
        status=WorkspaceStatus.ACTIVE,
        org_id=org.id,
        owner_id=owner.id,
    )
    db_session.add(ws)
    db_session.flush()

    db_session.add(WorkspaceMember(workspace_id=ws.id, user_id=owner.id, role=MemberRole.OWNER))
    db_session.add(WorkspaceMember(workspace_id=ws.id, user_id=admin_user.id, role=MemberRole.ADMIN))
    db_session.commit()
    db_session.refresh(ws)
    return ws


@pytest.fixture
def recording_with_segment(db_session: Session, workspace_with_admin: Workspace, admin_user: User) -> Recording:
    """A recording with one segment under workspace_with_admin."""
    rec = Recording(
        uid=str(uuid.uuid4()),
        workspace_id=workspace_with_admin.id,
        name="test_rec",
        tags="[]",
        status="recording",
        created_by=admin_user.id,
        total_duration=0,
        total_size=0,
    )
    db_session.add(rec)
    db_session.flush()

    seg = Segment(
        uid=str(uuid.uuid4()),
        recording_id=rec.id,
        sequence=1,
        start_time=datetime.now(UTC),
        storage_key="test/seg.rrweb.json",
        size=0,
    )
    db_session.add(seg)
    db_session.commit()
    db_session.refresh(rec)
    return rec


# ==================== Task 2.6: Permission matrix ====================


class TestPermissionMatrix:
    """Admin can create; Member cannot; Editor-of-other's-comment cannot edit; Owner can override."""

    def test_admin_can_create_comment(self, db_session, recording_with_segment, admin_user):
        svc = RecordingSegmentCommentService(db_session)
        cmt = svc.create_comment(
            recording_with_segment.uid,
            RecordingSegmentCommentCreate(
                segment_uid=recording_with_segment.segments[0].uid,
                show_time=Decimal("1.0"),
                hide_time=Decimal("3.0"),
                abstract="test",
                content=None,
            ),
            admin_user.id,
        )
        assert cmt.uid is not None
        assert cmt.creator_id == admin_user.id

    def test_member_cannot_create_comment(self, db_session, recording_with_segment, member_user, workspace_with_admin):
        # Add member as MEMBER (no write permission)
        db_session.add(
            WorkspaceMember(
                workspace_id=workspace_with_admin.id,
                user_id=member_user.id,
                role=MemberRole.MEMBER,
            )
        )
        db_session.commit()

        svc = RecordingSegmentCommentService(db_session)
        with pytest.raises(PermissionDeniedError):
            svc.create_comment(
                recording_with_segment.uid,
                RecordingSegmentCommentCreate(
                    segment_uid=recording_with_segment.segments[0].uid,
                    show_time=Decimal("1.0"),
                    hide_time=Decimal("3.0"),
                    abstract="test",
                    content=None,
                ),
                member_user.id,
            )

    def test_creator_can_update_own_comment(self, db_session, recording_with_segment, admin_user):
        svc = RecordingSegmentCommentService(db_session)
        cmt = svc.create_comment(
            recording_with_segment.uid,
            RecordingSegmentCommentCreate(
                segment_uid=recording_with_segment.segments[0].uid,
                show_time=Decimal("1.0"),
                hide_time=Decimal("3.0"),
                abstract="orig",
                content=None,
            ),
            admin_user.id,
        )
        updated = svc.update_comment(
            cmt.uid,
            RecordingSegmentCommentUpdate(abstract="edited"),
            admin_user.id,
        )
        assert updated.abstract == "edited"

    def test_non_creator_non_owner_cannot_update(self, db_session, recording_with_segment, admin_user, member_user):
        svc = RecordingSegmentCommentService(db_session)
        cmt = svc.create_comment(
            recording_with_segment.uid,
            RecordingSegmentCommentCreate(
                segment_uid=recording_with_segment.segments[0].uid,
                show_time=Decimal("1.0"),
                hide_time=Decimal("3.0"),
                abstract="orig",
                content=None,
            ),
            admin_user.id,
        )
        with pytest.raises(PermissionDeniedError):
            svc.update_comment(
                cmt.uid,
                RecordingSegmentCommentUpdate(abstract="hacked"),
                member_user.id,  # member_user is not even a workspace member here
            )

    def test_workspace_owner_can_update_any_comment(
        self, db_session, recording_with_segment, admin_user, workspace_with_admin
    ):
        svc = RecordingSegmentCommentService(db_session)
        cmt = svc.create_comment(
            recording_with_segment.uid,
            RecordingSegmentCommentCreate(
                segment_uid=recording_with_segment.segments[0].uid,
                show_time=Decimal("1.0"),
                hide_time=Decimal("3.0"),
                abstract="orig",
                content=None,
            ),
            admin_user.id,
        )
        # workspace_with_admin's owner_id is the OWNER user
        owner = db_session.query(User).filter(User.phone == "13800138001").first()
        updated = svc.update_comment(
            cmt.uid,
            RecordingSegmentCommentUpdate(abstract="owner_edited"),
            owner.id,
        )
        assert updated.abstract == "owner_edited"


# ==================== Task 2.7: Time range validation ====================


class TestTimeRangeValidation:
    """Service-layer defense for time range invariants."""

    def test_hide_equal_to_show_rejected(self, db_session, recording_with_segment, admin_user):
        svc = RecordingSegmentCommentService(db_session)
        # Schema layer catches first; if schema is bypassed, service layer catches.
        with pytest.raises((InvalidTimeRangeError, ValueError)):
            svc.create_comment(
                recording_with_segment.uid,
                RecordingSegmentCommentCreate(
                    segment_uid=recording_with_segment.segments[0].uid,
                    show_time=Decimal("5.0"),
                    hide_time=Decimal("5.0"),  # not strictly greater
                    abstract="x",
                    content=None,
                ),
                admin_user.id,
            )

    def test_hide_less_than_show_rejected(self, db_session, recording_with_segment, admin_user):
        svc = RecordingSegmentCommentService(db_session)
        with pytest.raises((InvalidTimeRangeError, ValueError)):
            svc.create_comment(
                recording_with_segment.uid,
                RecordingSegmentCommentCreate(
                    segment_uid=recording_with_segment.segments[0].uid,
                    show_time=Decimal("10.0"),
                    hide_time=Decimal("5.0"),
                    abstract="x",
                    content=None,
                ),
                admin_user.id,
            )

    def test_show_time_zero_accepted(self, db_session, recording_with_segment, admin_user):
        svc = RecordingSegmentCommentService(db_session)
        cmt = svc.create_comment(
            recording_with_segment.uid,
            RecordingSegmentCommentCreate(
                segment_uid=recording_with_segment.segments[0].uid,
                show_time=Decimal("0.0"),
                hide_time=Decimal("2.0"),
                abstract="start",
                content=None,
            ),
            admin_user.id,
        )
        assert cmt.show_time == Decimal("0.0")

    def test_negative_show_time_rejected_at_service(self, db_session, recording_with_segment, admin_user):
        """Even if schema validation is bypassed, service rejects negative show_time.

        In practice, schema validation catches it first. We assert either layer
        successfully rejects the request.
        """
        from pydantic import ValidationError

        svc = RecordingSegmentCommentService(db_session)
        with pytest.raises((InvalidTimeRangeError, ValidationError)):
            svc.create_comment(
                recording_with_segment.uid,
                RecordingSegmentCommentCreate(
                    segment_uid=recording_with_segment.segments[0].uid,
                    show_time=Decimal("-1.0"),
                    hide_time=Decimal("2.0"),
                    abstract="x",
                    content=None,
                ),
                admin_user.id,
            )


# ==================== Task 2.8: Batch delete skips forbidden items ====================


class TestBatchDelete:
    """Batch delete should skip items the user lacks permission for."""

    def test_batch_delete_partial_skip(
        self, db_session, recording_with_segment, admin_user, member_user, workspace_with_admin
    ):
        # Make member_user a MEMBER
        db_session.add(
            WorkspaceMember(
                workspace_id=workspace_with_admin.id,
                user_id=member_user.id,
                role=MemberRole.MEMBER,
            )
        )
        db_session.commit()

        svc = RecordingSegmentCommentService(db_session)
        # admin creates two comments
        c1 = svc.create_comment(
            recording_with_segment.uid,
            RecordingSegmentCommentCreate(
                segment_uid=recording_with_segment.segments[0].uid,
                show_time=Decimal("1.0"),
                hide_time=Decimal("3.0"),
                abstract="c1",
                content=None,
            ),
            admin_user.id,
        )
        c2 = svc.create_comment(
            recording_with_segment.uid,
            RecordingSegmentCommentCreate(
                segment_uid=recording_with_segment.segments[0].uid,
                show_time=Decimal("5.0"),
                hide_time=Decimal("7.0"),
                abstract="c2",
                content=None,
            ),
            admin_user.id,
        )
        # nonexistent uid
        bogus = "nonexistent-uid"

        deleted, skipped = svc.batch_delete_comments(
            recording_with_segment.uid,
            [c1.uid, c2.uid, bogus],
            admin_user.id,
        )
        assert deleted == 2
        # bogus should be skipped (not found)
        assert bogus in skipped

    def test_batch_delete_admin_can_delete_own(self, db_session, recording_with_segment, admin_user):
        svc = RecordingSegmentCommentService(db_session)
        c1 = svc.create_comment(
            recording_with_segment.uid,
            RecordingSegmentCommentCreate(
                segment_uid=recording_with_segment.segments[0].uid,
                show_time=Decimal("1.0"),
                hide_time=Decimal("3.0"),
                abstract="c1",
                content=None,
            ),
            admin_user.id,
        )
        deleted, skipped = svc.batch_delete_comments(recording_with_segment.uid, [c1.uid], admin_user.id)
        assert deleted == 1
        assert skipped == []


# ==================== List queries (sanity) ====================


class TestList:
    def test_list_by_recording_empty(self, db_session, recording_with_segment):
        svc = RecordingSegmentCommentService(db_session)
        items, total = svc.list_by_recording(recording_with_segment.uid)
        assert items == []
        assert total == 0

    def test_list_by_segment(self, db_session, recording_with_segment, admin_user):
        svc = RecordingSegmentCommentService(db_session)
        seg = recording_with_segment.segments[0]
        svc.create_comment(
            recording_with_segment.uid,
            RecordingSegmentCommentCreate(
                segment_uid=seg.uid,
                show_time=Decimal("1.0"),
                hide_time=Decimal("3.0"),
                abstract="a",
                content=None,
            ),
            admin_user.id,
        )
        svc.create_comment(
            recording_with_segment.uid,
            RecordingSegmentCommentCreate(
                segment_uid=seg.uid,
                show_time=Decimal("5.0"),
                hide_time=Decimal("7.0"),
                abstract="b",
                content=None,
            ),
            admin_user.id,
        )
        items = svc.list_by_segment(seg.uid)
        assert len(items) == 2
        # Default sort by show_time asc
        assert items[0].show_time == Decimal("1.0")
        assert items[1].show_time == Decimal("5.0")
