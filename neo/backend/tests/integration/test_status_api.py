"""Integration tests for Status API.

Tests CRUD operations for status records.
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
def sample_status_data():
    """Sample status creation data."""
    return {
        "entity_name": "lead_123",
        "attributes": {
            "name": "张三",
            "phone": "13800138000",
            "status": "跟进中",
        },
        "captured_at": "2026-06-25T10:00:00",
        "source": "crm_page_view",
        "session_id": "sess_abc123",
    }


@pytest.fixture
def created_status(client, test_workspace, sample_status_data):
    """Create a status record and return its data."""
    response = client.post(
        f"/api/v1/workspaces/{test_workspace.code}/status",
        json=sample_status_data,
    )
    assert response.status_code == 201
    return response.json()["data"]


class TestStatusList:
    """Tests for listing status records."""

    def test_list_empty(self, client, test_workspace):
        """Test listing when no status records exist."""
        response = client.get(f"/api/v1/workspaces/{test_workspace.code}/status")
        assert response.status_code == 200
        result = response.json()
        data = result["data"]
        assert data["total"] == 0
        assert data["items"] == []

    def test_list_with_statuses(self, client, test_workspace, created_status):
        """Test listing with existing status records."""
        response = client.get(f"/api/v1/workspaces/{test_workspace.code}/status")
        assert response.status_code == 200
        result = response.json()
        data = result["data"]
        assert data["total"] == 1
        assert len(data["items"]) == 1
        assert data["items"][0]["entity_name"] == "lead_123"

    def test_list_with_entity_filter(self, client, test_workspace, created_status):
        """Test listing with entity_name filter (exact match)."""
        response = client.get(f"/api/v1/workspaces/{test_workspace.code}/status?entity_name=lead_123")
        assert response.status_code == 200
        result = response.json()
        data = result["data"]
        assert data["total"] == 1

    def test_list_with_source_filter(self, client, test_workspace, created_status):
        """Test listing with source filter."""
        response = client.get(f"/api/v1/workspaces/{test_workspace.code}/status?source=crm_page_view")
        assert response.status_code == 200
        result = response.json()
        data = result["data"]
        assert data["total"] == 1

    def test_list_with_captured_range(self, client, test_workspace, created_status):
        """Test listing with captured_at range filter."""
        response = client.get(
            f"/api/v1/workspaces/{test_workspace.code}/status"
            "?captured_start=2026-06-01T00:00:00&captured_end=2026-06-30T23:59:59"
        )
        assert response.status_code == 200
        result = response.json()
        data = result["data"]
        assert data["total"] == 1

    def test_list_pagination(self, client, test_workspace, sample_status_data):
        """Test listing with pagination."""
        # Create multiple status records with different timestamps
        for i in range(3):
            post_data = sample_status_data.copy()
            post_data["entity_name"] = f"entity_{i}"
            post_data["captured_at"] = f"2026-06-2{i}T10:00:00"
            client.post(
                f"/api/v1/workspaces/{test_workspace.code}/status",
                json=post_data,
            )

        response = client.get(f"/api/v1/workspaces/{test_workspace.code}/status?page=1&page_size=2")
        assert response.status_code == 200
        result = response.json()
        data = result["data"]
        assert data["total"] == 3
        assert len(data["items"]) == 2
        assert data["page"] == 1
        assert data["page_size"] == 2
        assert data["total_pages"] == 2


class TestStatusGet:
    """Tests for getting single status record."""

    def test_get_status(self, client, test_workspace, created_status):
        """Test getting a single status record."""
        response = client.get(f"/api/v1/workspaces/{test_workspace.code}/status/{created_status['id']}")
        assert response.status_code == 200
        result = response.json()
        data = result["data"]
        assert data["entity_name"] == "lead_123"
        assert data["attributes"]["name"] == "张三"
        assert data["source"] == "crm_page_view"

    def test_get_status_not_found(self, client, test_workspace):
        """Test getting non-existent status record."""
        response = client.get(f"/api/v1/workspaces/{test_workspace.code}/status/99999")
        assert response.status_code == 200  # API always returns 200
        data = response.json()
        assert data["code"] == 404  # Error code in body


class TestStatusCreate:
    """Tests for creating status records."""

    def test_create_status(self, client, test_workspace, sample_status_data):
        """Test creating a new status record."""
        response = client.post(
            f"/api/v1/workspaces/{test_workspace.code}/status",
            json=sample_status_data,
        )
        assert response.status_code == 201
        result = response.json()
        data = result["data"]
        assert data["entity_name"] == "lead_123"
        assert data["attributes"]["name"] == "张三"
        assert data["source"] == "crm_page_view"
        assert data["workspace_id"] == test_workspace.id
        assert data["created_by"] == 1

    def test_create_status_without_optional_fields(self, client, test_workspace):
        """Test creating status with only required fields."""
        request_data = {
            "entity_name": "user_456",
            "attributes": {"name": "李四"},
            "captured_at": "2026-06-25T10:00:00",
        }
        response = client.post(
            f"/api/v1/workspaces/{test_workspace.code}/status",
            json=request_data,
        )
        assert response.status_code == 201
        result = response.json()
        data = result["data"]
        assert data["entity_name"] == "user_456"
        assert data["source"] is None
        assert data["session_id"] is None

    def test_create_status_duplicate(self, client, test_workspace, created_status, sample_status_data):
        """Test creating status with same entity_name and captured_at."""
        response = client.post(
            f"/api/v1/workspaces/{test_workspace.code}/status",
            json=sample_status_data,
        )
        assert response.status_code == 200  # API always returns 200
        data = response.json()
        assert data["code"] == 409  # Conflict error code

    def test_create_status_invalid_entity_format(self, client, test_workspace):
        """Test creating status with invalid entity_name format."""
        data = {
            "entity_name": "invalid-format",
            "attributes": {"name": "test"},
            "captured_at": "2026-06-25T10:00:00",
        }
        response = client.post(
            f"/api/v1/workspaces/{test_workspace.code}/status",
            json=data,
        )
        # FastAPI returns 422 for validation errors
        assert response.status_code == 422


class TestStatusUpdate:
    """Tests for updating status records."""

    def test_update_status(self, client, test_workspace, created_status):
        """Test updating a status record."""
        update_data = {
            "attributes": {"name": "张三_updated", "phone": "13800138001"},
            "source": "manual",
        }
        response = client.put(
            f"/api/v1/workspaces/{test_workspace.code}/status/{created_status['id']}",
            json=update_data,
        )
        assert response.status_code == 200
        result = response.json()
        data = result["data"]
        assert data["attributes"]["name"] == "张三_updated"
        assert data["source"] == "manual"
        assert data["entity_name"] == "lead_123"  # Unchanged

    def test_update_partial(self, client, test_workspace, created_status):
        """Test partial update (only source)."""
        update_data = {"source": "api_sync"}
        response = client.put(
            f"/api/v1/workspaces/{test_workspace.code}/status/{created_status['id']}",
            json=update_data,
        )
        assert response.status_code == 200
        result = response.json()
        data = result["data"]
        assert data["source"] == "api_sync"
        assert data["attributes"]["name"] == "张三"  # Unchanged


class TestStatusDelete:
    """Tests for deleting status records (hard delete)."""

    def test_delete_status(self, client, test_workspace, created_status):
        """Test hard deleting a status record."""
        response = client.delete(f"/api/v1/workspaces/{test_workspace.code}/status/{created_status['id']}")
        assert response.status_code == 204  # No Content

        # Verify status is deleted
        response = client.get(f"/api/v1/workspaces/{test_workspace.code}/status/{created_status['id']}")
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 404

    def test_delete_status_not_found(self, client, test_workspace):
        """Test deleting non-existent status record."""
        response = client.delete(f"/api/v1/workspaces/{test_workspace.code}/status/99999")
        # API always returns 200, error code in body
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 404
