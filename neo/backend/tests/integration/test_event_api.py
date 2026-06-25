"""Integration tests for Events API.

Tests CRUD operations for events.
"""

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client(db_session):
    """Create test client with database session."""
    import sys
    from pathlib import Path

    # Add src to path
    sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src"))

    # Import app after path is set
    from app.dependencies import get_current_user, get_db
    from app.main import app
    from app.models import User

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    def override_get_current_user():
        # Get or create test user in database
        user = db_session.query(User).filter(User.id == 1).first()
        if not user:
            from app.services.auth_service import hash_password

            user = User(
                id=1,
                phone="13800138002",
                hashed_password=hash_password("abcd1234"),
                username="testuser",
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
def sample_event_data():
    """Sample event creation data."""
    return {
        "name": "lead.assigned",
        "entity_name": "lead_123",
        "target_entity_name": "user_zhangsan",
        "actor": "user_john",
        "timestamp": "2026-06-25T10:00:00",
        "page_url": "https://crm.example.com/leads/123",
        "session_id": "sess_abc123",
        "metadata": {"key": "value"},
    }


@pytest.fixture
def created_event(client, test_workspace, sample_event_data):
    """Create an event and return its data."""
    response = client.post(
        f"/api/v1/workspaces/{test_workspace.code}/events",
        json=sample_event_data,
    )
    assert response.status_code == 201
    return response.json()["data"]


class TestEventList:
    """Tests for listing events."""

    def test_list_empty(self, client, test_workspace):
        """Test listing when no events exist."""
        response = client.get(f"/api/v1/workspaces/{test_workspace.code}/events")
        assert response.status_code == 200
        result = response.json()
        data = result["data"]
        assert data["total"] == 0
        assert data["items"] == []

    def test_list_with_events(self, client, test_workspace, created_event):
        """Test listing with existing events."""
        response = client.get(f"/api/v1/workspaces/{test_workspace.code}/events")
        assert response.status_code == 200
        result = response.json()
        data = result["data"]
        assert data["total"] == 1
        assert len(data["items"]) == 1
        assert data["items"][0]["name"] == "lead.assigned"

    def test_list_with_name_filter(self, client, test_workspace, created_event):
        """Test listing with name filter (partial match)."""
        response = client.get(f"/api/v1/workspaces/{test_workspace.code}/events?name=lead")
        assert response.status_code == 200
        result = response.json()
        data = result["data"]
        assert data["total"] == 1

    def test_list_with_entity_filter(self, client, test_workspace, created_event):
        """Test listing with entity_name filter (exact match)."""
        response = client.get(f"/api/v1/workspaces/{test_workspace.code}/events?entity_name=lead_123")
        assert response.status_code == 200
        result = response.json()
        data = result["data"]
        assert data["total"] == 1

    def test_list_with_actor_filter(self, client, test_workspace, created_event):
        """Test listing with actor filter (partial match)."""
        response = client.get(f"/api/v1/workspaces/{test_workspace.code}/events?actor=john")
        assert response.status_code == 200
        result = response.json()
        data = result["data"]
        assert data["total"] == 1

    def test_list_with_timestamp_range(self, client, test_workspace, created_event):
        """Test listing with timestamp range filter."""
        response = client.get(
            f"/api/v1/workspaces/{test_workspace.code}/events"
            "?timestamp_start=2026-06-01T00:00:00&timestamp_end=2026-06-30T23:59:59"
        )
        assert response.status_code == 200
        result = response.json()
        data = result["data"]
        assert data["total"] == 1

    def test_list_pagination(self, client, test_workspace, sample_event_data):
        """Test listing with pagination."""
        # Create multiple events
        for i in range(3):
            post_data = sample_event_data.copy()
            post_data["name"] = f"event_{i}"
            client.post(
                f"/api/v1/workspaces/{test_workspace.code}/events",
                json=post_data,
            )

        response = client.get(f"/api/v1/workspaces/{test_workspace.code}/events?page=1&page_size=2")
        assert response.status_code == 200
        result = response.json()
        data = result["data"]
        assert data["total"] == 3
        assert len(data["items"]) == 2
        assert data["page"] == 1
        assert data["page_size"] == 2
        assert data["total_pages"] == 2


class TestEventGet:
    """Tests for getting single event."""

    def test_get_event(self, client, test_workspace, created_event):
        """Test getting a single event."""
        response = client.get(f"/api/v1/workspaces/{test_workspace.code}/events/{created_event['id']}")
        assert response.status_code == 200
        result = response.json()
        data = result["data"]
        assert data["name"] == "lead.assigned"
        assert data["entity_name"] == "lead_123"
        assert data["actor"] == "user_john"

    def test_get_event_not_found(self, client, test_workspace):
        """Test getting non-existent event."""
        response = client.get(f"/api/v1/workspaces/{test_workspace.code}/events/99999")
        assert response.status_code == 200  # API always returns 200
        data = response.json()
        assert data["code"] == 404  # Error code in body


class TestEventCreate:
    """Tests for creating events."""

    def test_create_event(self, client, test_workspace, sample_event_data):
        """Test creating a new event."""
        response = client.post(
            f"/api/v1/workspaces/{test_workspace.code}/events",
            json=sample_event_data,
        )
        assert response.status_code == 201
        result = response.json()
        data = result["data"]
        assert data["name"] == "lead.assigned"
        assert data["entity_name"] == "lead_123"
        assert data["actor"] == "user_john"
        assert data["workspace_id"] == test_workspace.id
        assert data["created_by"] == 1

    def test_create_event_without_optional_fields(self, client, test_workspace):
        """Test creating event with only required fields."""
        request_data = {
            "name": "user.login",
            "entity_name": "user_456",
            "actor": "system",
            "timestamp": "2026-06-25T10:00:00",
        }
        response = client.post(
            f"/api/v1/workspaces/{test_workspace.code}/events",
            json=request_data,
        )
        assert response.status_code == 201
        result = response.json()
        data = result["data"]
        assert data["name"] == "user.login"
        assert data["target_entity_name"] is None
        assert data["page_url"] is None

    def test_create_event_invalid_entity_format(self, client, test_workspace):
        """Test creating event with invalid entity_name format."""
        data = {
            "name": "event.test",
            "entity_name": "invalid-format",
            "actor": "user",
            "timestamp": "2026-06-25T10:00:00",
        }
        response = client.post(
            f"/api/v1/workspaces/{test_workspace.code}/events",
            json=data,
        )
        # FastAPI returns 422 for validation errors
        assert response.status_code == 422

    def test_create_event_invalid_url(self, client, test_workspace):
        """Test creating event with invalid page_url."""
        data = {
            "name": "event.test",
            "entity_name": "entity_123",
            "actor": "user",
            "timestamp": "2026-06-25T10:00:00",
            "page_url": "not-a-url",
        }
        response = client.post(
            f"/api/v1/workspaces/{test_workspace.code}/events",
            json=data,
        )
        assert response.status_code == 422


class TestEventUpdate:
    """Tests for updating events."""

    def test_update_event(self, client, test_workspace, created_event):
        """Test updating an event."""
        update_data = {
            "name": "lead.assigned.v2",
            "actor": "user_jane",
        }
        response = client.put(
            f"/api/v1/workspaces/{test_workspace.code}/events/{created_event['id']}",
            json=update_data,
        )
        assert response.status_code == 200
        result = response.json()
        data = result["data"]
        assert data["name"] == "lead.assigned.v2"
        assert data["actor"] == "user_jane"
        assert data["entity_name"] == "lead_123"  # Unchanged

    def test_update_partial(self, client, test_workspace, created_event):
        """Test partial update (only timestamp)."""
        update_data = {"timestamp": "2026-06-26T12:00:00"}
        response = client.put(
            f"/api/v1/workspaces/{test_workspace.code}/events/{created_event['id']}",
            json=update_data,
        )
        assert response.status_code == 200
        result = response.json()
        data = result["data"]
        assert data["name"] == "lead.assigned"  # Unchanged


class TestEventDelete:
    """Tests for deleting events (hard delete)."""

    def test_delete_event(self, client, test_workspace, created_event):
        """Test hard deleting an event."""
        response = client.delete(f"/api/v1/workspaces/{test_workspace.code}/events/{created_event['id']}")
        assert response.status_code == 204  # No Content

        # Verify event is deleted
        response = client.get(f"/api/v1/workspaces/{test_workspace.code}/events/{created_event['id']}")
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 404

    def test_delete_event_not_found(self, client, test_workspace):
        """Test deleting non-existent event."""
        response = client.delete(f"/api/v1/workspaces/{test_workspace.code}/events/99999")
        # API always returns 200, error code in body
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 404
