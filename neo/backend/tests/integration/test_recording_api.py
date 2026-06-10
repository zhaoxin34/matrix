"""HTTP-level integration tests for the Recording API.

Covers the `PUT /workspaces/{code}/recordings/{uid}/segments/{segUid}/bytes`
endpoint that the Agent Steer recorder uses to push segment bytes through
the backend (necessary while rustfs lacks PutBucketCors — see issue #1386).
"""

import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

# Make `app` importable from src/
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src"))


# ==================== Fixtures ====================


@pytest.fixture
def client(db_session: Session):
    """TestClient with DB + current-user dependency overrides."""
    from app.dependencies import get_current_user, get_db
    from app.main import app
    from app.models import User
    from app.services.auth_service import hash_password

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    def override_get_current_user():
        user = db_session.query(User).filter(User.id == 1).first()
        if not user:
            user = User(
                id=1,
                phone="13800138002",
                hashed_password=hash_password("abcd1234"),
                username="recording_test",
                is_admin=True,
                is_active=True,
            )
            db_session.add(user)
            db_session.commit()
            db_session.refresh(user)
        return user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def test_workspace(db_session: Session):
    """Workspace + owner user + owner membership."""
    from app.models import (
        MemberRole,
        OrganizationUnit,
        OrgUnitType,
        Workspace,
        WorkspaceMember,
        WorkspaceStatus,
    )

    org = OrganizationUnit(
        name="Rec Org",
        code="REC_ORG_API",
        type=OrgUnitType.COMPANY,
        level=0,
    )
    db_session.add(org)
    db_session.flush()

    ws = Workspace(
        name="Rec API WS",
        code="ws_rec_api",
        status=WorkspaceStatus.ACTIVE,
        org_id=org.id,
        owner_id=1,  # test user injected by override_get_current_user
    )
    db_session.add(ws)
    db_session.flush()
    db_session.add(WorkspaceMember(workspace_id=ws.id, user_id=1, role=MemberRole.OWNER))
    db_session.commit()
    db_session.refresh(ws)
    return ws


@pytest.fixture
def created_recording(client, test_workspace):
    """A recording in `recording` status, owned by the test workspace."""
    response = client.post(
        f"/api/v1/workspaces/{test_workspace.code}/recordings",
        json={"name": "api-test"},
    )
    assert response.status_code == 200, response.text
    return response.json()["data"]


# ==================== PUT bytes (server-side proxy) ====================


class TestUploadSegmentBytesEndpoint:
    """The proxy endpoint that lets browsers upload despite rustfs CORS gap.

    NOTE: This project wraps every HTTPException in a global handler that
    returns HTTP 200 with the error carried in `code` (see
    `app/core/exceptions.py`). Tests below assert on `body["code"]` and
    `body["message"]`, not on `response.status_code`.
    """

    def test_happy_path_returns_storage_key_and_size(self, client, test_workspace, created_recording):
        response = client.put(
            f"/api/v1/workspaces/{test_workspace.code}/recordings/{created_recording['uid']}/segments/seg-abc123/bytes",
            content=b'{"events":[1,2,3]}',
            headers={"Content-Type": "application/json"},
        )

        assert response.status_code == 200, response.text
        body = response.json()
        assert body["code"] == 0
        data = body["data"]
        assert data["storage_key"] == (
            f"neo/workspace_{test_workspace.code}/recording/{created_recording['uid']}/seg-abc123.rrweb.json"
        )
        assert data["size"] == len(b'{"events":[1,2,3]}')

    def test_empty_body_returns_error_code(self, client, test_workspace, created_recording):
        response = client.put(
            f"/api/v1/workspaces/{test_workspace.code}/recordings/{created_recording['uid']}/segments/seg-empty/bytes",
            content=b"",
            headers={"Content-Type": "application/json"},
        )
        body = response.json()
        assert body["code"] == 400
        assert "empty body" in body["message"]

    def test_invalid_segment_uid_returns_error_code(self, client, test_workspace, created_recording):
        # `.` is rejected by the segment_uid regex (`^[A-Za-z0-9_-]{1,128}$`).
        # We avoid `/` here because TestClient decodes `%2F` to `/`, which
        # makes the URL no longer match this route at all.
        response = client.put(
            f"/api/v1/workspaces/{test_workspace.code}/recordings/{created_recording['uid']}/segments/seg.bad/bytes",
            content=b"{}",
            headers={"Content-Type": "application/json"},
        )
        body = response.json()
        assert body["code"] == 400
        assert "invalid segment_uid" in body["message"]

    def test_unknown_recording_returns_error_code(self, client, test_workspace):
        response = client.put(
            f"/api/v1/workspaces/{test_workspace.code}/recordings/no-such-recording/segments/seg-1/bytes",
            content=b"{}",
            headers={"Content-Type": "application/json"},
        )
        body = response.json()
        assert body["code"] == 404

    def test_unknown_workspace_returns_error_code(self, client, created_recording):
        response = client.put(
            f"/api/v1/workspaces/no-such-ws/recordings/{created_recording['uid']}/segments/seg-1/bytes",
            content=b"{}",
            headers={"Content-Type": "application/json"},
        )
        body = response.json()
        assert body["code"] == 404
