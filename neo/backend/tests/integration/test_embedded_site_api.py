"""Integration tests for Embedded Sites API.

Tests CRUD operations and status toggle for embedded sites.
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
def sample_site_data():
    """Sample embedded site creation data."""
    return {
        "site_name": "测试网站",
        "site_url": "https://example.com",
        "description": "这是一个测试网站",
    }


@pytest.fixture
def created_site(client, sample_site_data, test_workspace):
    """Create an embedded site and return its data."""
    response = client.post(
        f"/api/v1/workspaces/{test_workspace.code}/embedded-sites",
        json=sample_site_data,
    )
    assert response.status_code == 201
    return response.json()["data"]


class TestEmbeddedSiteList:
    """Tests for listing embedded sites."""

    def test_list_empty(self, client, test_workspace):
        """Test listing when no embedded sites exist."""
        response = client.get(f"/api/v1/workspaces/{test_workspace.code}/embedded-sites")
        assert response.status_code == 200
        result = response.json()
        data = result["data"]
        assert data["total"] == 0
        assert data["items"] == []

    def test_list_with_sites(self, client, test_workspace, created_site):
        """Test listing with existing embedded sites."""
        response = client.get(f"/api/v1/workspaces/{test_workspace.code}/embedded-sites")
        assert response.status_code == 200
        result = response.json()
        data = result["data"]
        assert data["total"] == 1
        assert len(data["items"]) == 1
        assert data["items"][0]["site_name"] == "测试网站"

    def test_list_with_search(self, client, test_workspace, created_site):
        """Test listing with search filter."""
        response = client.get(f"/api/v1/workspaces/{test_workspace.code}/embedded-sites?search=测试")
        assert response.status_code == 200
        result = response.json()
        data = result["data"]
        assert data["total"] == 1

    def test_list_with_status_filter(self, client, test_workspace, created_site):
        """Test listing with status filter."""
        response = client.get(f"/api/v1/workspaces/{test_workspace.code}/embedded-sites?status=DISABLED")
        assert response.status_code == 200
        result = response.json()
        data = result["data"]
        assert data["items"][0]["status"] == "DISABLED"

    def test_list_pagination(self, client, test_workspace, sample_site_data):
        """Test listing with pagination."""
        # Create multiple sites
        for i in range(3):
            post_data = sample_site_data.copy()
            post_data["site_name"] = f"网站{i}"
            client.post(
                f"/api/v1/workspaces/{test_workspace.code}/embedded-sites",
                json=post_data,
            )

        response = client.get(f"/api/v1/workspaces/{test_workspace.code}/embedded-sites?page=1&page_size=2")
        assert response.status_code == 200
        result = response.json()
        data = result["data"]
        assert data["total"] == 3
        assert len(data["items"]) == 2
        assert data["page"] == 1
        assert data["page_size"] == 2
        assert data["total_pages"] == 2


class TestEmbeddedSiteGet:
    """Tests for getting single embedded site."""

    def test_get_site(self, client, test_workspace, created_site):
        """Test getting a single embedded site."""
        response = client.get(f"/api/v1/workspaces/{test_workspace.code}/embedded-sites/{created_site['id']}")
        assert response.status_code == 200
        result = response.json()
        data = result["data"]
        assert data["site_name"] == "测试网站"
        assert data["site_url"] == "https://example.com"

    def test_get_site_not_found(self, client, test_workspace):
        """Test getting non-existent embedded site."""
        response = client.get(f"/api/v1/workspaces/{test_workspace.code}/embedded-sites/99999")
        assert response.status_code == 200  # API always returns 200
        data = response.json()
        assert data["code"] == 404  # Error code in body


class TestEmbeddedSiteCreate:
    """Tests for creating embedded sites."""

    def test_create_site(self, client, test_workspace, sample_site_data):
        """Test creating a new embedded site."""
        response = client.post(
            f"/api/v1/workspaces/{test_workspace.code}/embedded-sites",
            json=sample_site_data,
        )
        assert response.status_code == 201
        result = response.json()
        data = result["data"]
        assert data["site_name"] == "测试网站"
        assert data["site_url"] == "https://example.com"
        assert data["status"] == "DISABLED"

    def test_create_site_without_description(self, client, test_workspace):
        """Test creating a site without description."""
        request_data = {"site_name": "网站", "site_url": "https://site.com"}
        response = client.post(
            f"/api/v1/workspaces/{test_workspace.code}/embedded-sites",
            json=request_data,
        )
        assert response.status_code == 201
        result = response.json()
        data = result["data"]
        assert data["description"] is None

    def test_create_duplicate_name(self, client, test_workspace, created_site, sample_site_data):
        """Test creating site with duplicate name in workspace."""
        response = client.post(
            f"/api/v1/workspaces/{test_workspace.code}/embedded-sites",
            json=sample_site_data,
        )
        assert response.status_code == 200  # API always returns 200
        data = response.json()
        assert data["code"] == 409  # Conflict error code

    def test_create_invalid_url(self, client, test_workspace):
        """Test creating site with invalid URL."""
        data = {"site_name": "网站", "site_url": "not-a-url"}
        response = client.post(
            f"/api/v1/workspaces/{test_workspace.code}/embedded-sites",
            json=data,
        )
        # FastAPI returns 422 for validation errors
        assert response.status_code == 422


class TestEmbeddedSiteUpdate:
    """Tests for updating embedded sites."""

    def test_update_site(self, client, test_workspace, created_site):
        """Test updating an embedded site."""
        update_data = {
            "site_name": "更新后的名称",
            "site_url": "https://new-example.com",
        }
        response = client.put(
            f"/api/v1/workspaces/{test_workspace.code}/embedded-sites/{created_site['id']}",
            json=update_data,
        )
        assert response.status_code == 200
        result = response.json()
        data = result["data"]
        assert data["site_name"] == "更新后的名称"
        assert data["site_url"] == "https://new-example.com"

    def test_update_partial(self, client, test_workspace, created_site):
        """Test partial update (only name)."""
        update_data = {"site_name": "仅更新名称"}
        response = client.put(
            f"/api/v1/workspaces/{test_workspace.code}/embedded-sites/{created_site['id']}",
            json=update_data,
        )
        assert response.status_code == 200
        result = response.json()
        data = result["data"]
        assert data["site_name"] == "仅更新名称"
        assert data["site_url"] == "https://example.com"  # Unchanged


class TestEmbeddedSiteDelete:
    """Tests for deleting embedded sites."""

    def test_delete_site(self, client, test_workspace, created_site):
        """Test soft deleting an embedded site."""
        response = client.delete(f"/api/v1/workspaces/{test_workspace.code}/embedded-sites/{created_site['id']}")
        assert response.status_code == 204  # No Content


class TestEmbeddedSiteStatus:
    """Tests for enabling/disabling embedded sites."""

    def test_enable_site(self, client, test_workspace, created_site):
        """Test enabling an embedded site."""
        response = client.patch(f"/api/v1/workspaces/{test_workspace.code}/embedded-sites/{created_site['id']}/enable")
        assert response.status_code == 200
        result = response.json()
        data = result["data"]
        assert data["status"] == "ENABLED"

    def test_disable_site(self, client, test_workspace, created_site):
        """Test disabling an embedded site."""
        # First enable
        client.patch(f"/api/v1/workspaces/{test_workspace.code}/embedded-sites/{created_site['id']}/enable")
        # Then disable
        response = client.patch(f"/api/v1/workspaces/{test_workspace.code}/embedded-sites/{created_site['id']}/disable")
        assert response.status_code == 200
        result = response.json()
        data = result["data"]
        assert data["status"] == "DISABLED"

    def test_idempotent_enable(self, client, test_workspace, created_site):
        """Test that enabling an already enabled site is idempotent."""
        # Enable twice
        response1 = client.patch(f"/api/v1/workspaces/{test_workspace.code}/embedded-sites/{created_site['id']}/enable")
        response2 = client.patch(f"/api/v1/workspaces/{test_workspace.code}/embedded-sites/{created_site['id']}/enable")
        assert response1.status_code == 200
        assert response2.status_code == 200
        data1 = response1.json()["data"]
        data2 = response2.json()["data"]
        assert data1["status"] == "ENABLED"
        assert data2["status"] == "ENABLED"

    def test_idempotent_disable(self, client, test_workspace, created_site):
        """Test that disabling an already disabled site is idempotent."""
        # Disable twice (site starts as disabled)
        response1 = client.patch(
            f"/api/v1/workspaces/{test_workspace.code}/embedded-sites/{created_site['id']}/disable"
        )
        response2 = client.patch(
            f"/api/v1/workspaces/{test_workspace.code}/embedded-sites/{created_site['id']}/disable"
        )
        assert response1.status_code == 200
        assert response2.status_code == 200
        data1 = response1.json()["data"]
        data2 = response2.json()["data"]
        assert data1["status"] == "DISABLED"
        assert data2["status"] == "DISABLED"
