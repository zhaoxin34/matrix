"""HTTP-level integration tests for RecordingSegmentComment API (task 3.6).

Covers the full flow: create -> list -> update -> delete -> batch.
Uses TestClient + dependency overrides for clean unit isolation.
"""

import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src"))


# ==================== Fixtures ====================


@pytest.fixture
def admin_user(db_session: Session):
    """Admin user who can create comments."""
    from app.models import User
    from app.services.auth_service import hash_password

    user = User(
        phone="13900000001",
        hashed_password=hash_password("abcd1234"),
        username="csc_admin",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def owner_user(db_session: Session):
    """Workspace Owner user."""
    from app.models import User
    from app.services.auth_service import hash_password

    user = User(
        phone="13900000002",
        hashed_password=hash_password("abcd1234"),
        username="csc_owner",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def member_user(db_session: Session):
    """Plain Member user (no write permission)."""
    from app.models import User
    from app.services.auth_service import hash_password

    user = User(
        phone="13900000003",
        hashed_password=hash_password("abcd1234"),
        username="csc_member",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def workspace_with_segment(db_session: Session, admin_user, owner_user):
    """Workspace (owner=owner_user, admin=admin_user) with one recording+segment."""
    import uuid
    from datetime import UTC, datetime

    from app.models import (
        MemberRole,
        OrganizationUnit,
        OrgUnitType,
        Recording,
        Segment,
        Workspace,
        WorkspaceMember,
        WorkspaceStatus,
    )

    org = OrganizationUnit(
        name="CSC Org",
        code="CSC_ORG_API",
        type=OrgUnitType.COMPANY,
        level=0,
    )
    db_session.add(org)
    db_session.flush()

    ws = Workspace(
        name="CSC WS",
        code="csc_ws",
        status=WorkspaceStatus.ACTIVE,
        org_id=org.id,
        owner_id=owner_user.id,
    )
    db_session.add(ws)
    db_session.flush()

    db_session.add_all(
        [
            WorkspaceMember(workspace_id=ws.id, user_id=owner_user.id, role=MemberRole.OWNER),
            WorkspaceMember(workspace_id=ws.id, user_id=admin_user.id, role=MemberRole.ADMIN),
        ],
    )

    rec = Recording(
        uid=str(uuid.uuid4()),
        workspace_id=ws.id,
        name="csc_rec",
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
        storage_key="test/csc.rrweb.json",
        size=0,
    )
    db_session.add(seg)
    db_session.commit()
    db_session.refresh(ws)
    db_session.refresh(rec)
    db_session.refresh(seg)
    return ws, rec, seg


def _client_with_user(db_session, user):
    """TestClient configured to authenticate as the given user."""
    from app.dependencies import get_current_user, get_db
    from app.main import app

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    def override_get_current_user():
        return user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    return TestClient(app)


# ==================== Tests ====================


class TestFullFlow:
    """End-to-end: create -> list -> update -> delete -> batch."""

    def test_create_then_list_then_update_then_delete(self, db_session, workspace_with_segment, admin_user):
        ws, rec, seg = workspace_with_segment
        client = _client_with_user(db_session, admin_user)

        # Create
        r = client.post(
            f"/api/v1/workspaces/{ws.code}/recordings/{rec.uid}/segment-comments",
            json={
                "segment_uid": seg.uid,
                "show_time": 1.0,
                "hide_time": 3.0,
                "abstract": "test",
                "content": "details",
            },
        )
        assert r.status_code == 200, r.text
        assert r.json()["code"] == 0
        cmt_uid = r.json()["data"]["uid"]
        assert r.json()["data"]["abstract"] == "test"

        # List by recording
        r = client.get(f"/api/v1/workspaces/{ws.code}/recordings/{rec.uid}/segment-comments")
        assert r.status_code == 200
        assert len(r.json()["data"]["items"]) == 1

        # List by segment
        r = client.get(f"/api/v1/workspaces/{ws.code}/recordings/{rec.uid}/segments/{seg.uid}/comments")
        assert r.status_code == 200
        assert len(r.json()["data"]) == 1

        # Update
        r = client.put(
            f"/api/v1/workspaces/{ws.code}/recordings/{rec.uid}/segment-comments/{cmt_uid}",
            json={"abstract": "edited"},
        )
        assert r.status_code == 200
        assert r.json()["data"]["abstract"] == "edited"

        # Delete
        r = client.delete(f"/api/v1/workspaces/{ws.code}/recordings/{rec.uid}/segment-comments/{cmt_uid}")
        assert r.status_code == 200

        # List now empty
        r = client.get(f"/api/v1/workspaces/{ws.code}/recordings/{rec.uid}/segment-comments")
        assert r.status_code == 200
        assert r.json()["data"]["pagination"]["total"] == 0

    def test_batch_delete_with_skip(self, db_session, workspace_with_segment, admin_user):
        ws, rec, seg = workspace_with_segment
        client = _client_with_user(db_session, admin_user)

        # Create 2 comments
        uids = []
        for t in [(1.0, 3.0, "a"), (5.0, 7.0, "b")]:
            r = client.post(
                f"/api/v1/workspaces/{ws.code}/recordings/{rec.uid}/segment-comments",
                json={
                    "segment_uid": seg.uid,
                    "show_time": t[0],
                    "hide_time": t[1],
                    "abstract": t[2],
                },
            )
            uids.append(r.json()["data"]["uid"])

        # Batch delete with one bogus
        # TestClient.delete() doesn't accept `json=`; use client.request() instead.
        r = client.request(
            "DELETE",
            f"/api/v1/workspaces/{ws.code}/recordings/{rec.uid}/segment-comments/batch",
            json={"comment_uids": uids + ["bogus-uid"]},
        )
        # Project uses unified error envelope: HTTP 200 + body.code 0 for success
        assert r.status_code == 200
        assert r.json()["code"] == 0
        assert r.json()["data"]["deleted_count"] == 2
        assert "bogus-uid" in r.json()["data"]["skipped"]


class TestPermissions:
    """Permission semantics at the API layer."""

    def test_member_cannot_create(self, db_session, workspace_with_segment, admin_user, member_user):
        ws, rec, seg = workspace_with_segment
        # Add member
        from app.models import MemberRole, WorkspaceMember

        db_session.add(WorkspaceMember(workspace_id=ws.id, user_id=member_user.id, role=MemberRole.MEMBER))
        db_session.commit()

        client = _client_with_user(db_session, member_user)
        r = client.post(
            f"/api/v1/workspaces/{ws.code}/recordings/{rec.uid}/segment-comments",
            json={"segment_uid": seg.uid, "show_time": 1.0, "hide_time": 3.0, "abstract": "x"},
        )
        # Project uses unified error envelope: HTTP 200 + body.code mirrors HTTPException.status_code
        assert r.status_code == 200
        assert r.json()["code"] == 403  # Forbidden

    def test_non_creator_cannot_update(self, db_session, workspace_with_segment, admin_user, member_user):
        ws, rec, seg = workspace_with_segment
        # admin creates a comment
        client_admin = _client_with_user(db_session, admin_user)
        r = client_admin.post(
            f"/api/v1/workspaces/{ws.code}/recordings/{rec.uid}/segment-comments",
            json={"segment_uid": seg.uid, "show_time": 1.0, "hide_time": 3.0, "abstract": "by_admin"},
        )
        cmt_uid = r.json()["data"]["uid"]

        # member_user is not a workspace member at all
        client_member = _client_with_user(db_session, member_user)
        r = client_member.put(
            f"/api/v1/workspaces/{ws.code}/recordings/{rec.uid}/segment-comments/{cmt_uid}",
            json={"abstract": "hacked"},
        )
        assert r.status_code == 200
        assert r.json()["code"] == 403  # "Not a workspace member"


class TestValidation:
    """Schema-level validation surfaces as 4xx."""

    def test_invalid_time_range_rejected(self, db_session, workspace_with_segment, admin_user):
        ws, rec, seg = workspace_with_segment
        client = _client_with_user(db_session, admin_user)
        r = client.post(
            f"/api/v1/workspaces/{ws.code}/recordings/{rec.uid}/segment-comments",
            json={"segment_uid": seg.uid, "show_time": 5.0, "hide_time": 3.0, "abstract": "x"},
        )
        assert r.status_code == 422  # pydantic validation error

    def test_missing_abstract_rejected(self, db_session, workspace_with_segment, admin_user):
        ws, rec, seg = workspace_with_segment
        client = _client_with_user(db_session, admin_user)
        r = client.post(
            f"/api/v1/workspaces/{ws.code}/recordings/{rec.uid}/segment-comments",
            json={"segment_uid": seg.uid, "show_time": 1.0, "hide_time": 3.0, "abstract": ""},
        )
        assert r.status_code == 422
