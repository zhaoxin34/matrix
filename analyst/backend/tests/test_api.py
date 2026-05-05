"""Tests for analyst backend."""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client() -> TestClient:
    """Create test client."""
    return TestClient(app)


class TestHealth:
    """Health check tests."""

    def test_health(self, client: TestClient) -> None:
        """Test health endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}


class TestCollect:
    """Collect API tests."""

    def test_collect_landing(self, client: TestClient) -> None:
        """Test collect endpoint with landing action."""
        response = client.post(
            "/api/v1/collect",
            json={
                "session_id": "test-session-123",
                "user_id": "user-456",
                "action": "landing",
                "current_state": "landing",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 0
        assert "page_state" in data["data"]
        assert data["data"]["session_id"] == "test-session-123"

    def test_collect_browse(self, client: TestClient) -> None:
        """Test collect endpoint with browse action."""
        response = client.post(
            "/api/v1/collect",
            json={
                "session_id": "test-session-123",
                "action": "browse",
                "current_state": "landing",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 0
        assert data["data"]["page_state"]["page_type"] in ["landing", "browse"]

    def test_collect_invalid_action(self, client: TestClient) -> None:
        """Test collect endpoint with invalid action."""
        response = client.post(
            "/api/v1/collect",
            json={
                "session_id": "test-session-123",
                "action": "invalid_action",
                "current_state": "landing",
            },
        )
        assert response.status_code == 400


class TestSession:
    """Session API tests."""

    def test_get_session(self, client: TestClient) -> None:
        """Test get session endpoint."""
        # First create a session
        client.post(
            "/api/v1/collect",
            json={
                "session_id": "session-get-test",
                "action": "landing",
                "current_state": "landing",
            },
        )
        # Then get it
        response = client.get("/api/v1/collect/session/session-get-test")
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 0
        assert data["data"]["session_id"] == "session-get-test"

    def test_get_session_not_found(self, client: TestClient) -> None:
        """Test get session endpoint with non-existent session."""
        response = client.get("/api/v1/collect/session/non-existent")
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 2001  # SESSION_NOT_FOUND
