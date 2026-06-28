"""Integration tests for Interceptors API.

Tests CRUD operations and enable/disable for interceptors.
"""

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client(db_session):
    """Create test client with database session."""
    import sys
    from pathlib import Path

    sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src"))

    from app.dependencies import get_current_user, get_db
    from app.main import app
    from app.models import User

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    def override_get_current_user():
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
def test_site(client, test_workspace):
    """Create a test embedded site."""
    site_data = {
        "site_name": "测试网站",
        "site_url": "https://example.com",
        "description": "测试用网站",
    }
    response = client.post(
        f"/api/v1/workspaces/{test_workspace.code}/embedded-sites",
        json=site_data,
    )
    assert response.status_code == 201
    # Enable the site for interceptor use
    site_id = response.json()["data"]["id"]
    client.patch(f"/api/v1/workspaces/{test_workspace.code}/embedded-sites/{site_id}/enable")
    response = client.get(f"/api/v1/workspaces/{test_workspace.code}/embedded-sites/{site_id}")
    return response.json()["data"]


@pytest.fixture
def sample_interceptor_data(test_site):
    """Sample interceptor creation data."""
    return {
        "embedded_site_id": test_site["id"],
        "name": "测试拦截器",
        "event_name": "lead.assigned",
        "entity_name": "lead",
        "target_entity_name": "user",
        "mode": "observe",
        "trigger": {
            "type": "dom",
            "selector": "#assign-btn",
        },
        "page_url_pattern": "https://crm.example.com/leads/*",
        "debounce_ms": 1000,
    }


@pytest.fixture
def created_interceptor(client, test_workspace, sample_interceptor_data):
    """Create an interceptor and return its data."""
    response = client.post(
        f"/api/v1/workspaces/{test_workspace.code}/interceptors",
        json=sample_interceptor_data,
    )
    assert response.status_code == 201
    return response.json()


class TestInterceptorList:
    """Tests for listing interceptors."""

    def test_list_empty(self, client, test_workspace):
        """Test listing when no interceptors exist."""
        response = client.get(f"/api/v1/workspaces/{test_workspace.code}/interceptors")
        assert response.status_code == 200
        result = response.json()
        assert result["data"]["total"] == 0
        assert result["data"]["items"] == []

    def test_list_with_interceptors(self, client, test_workspace, created_interceptor):
        """Test listing with existing interceptors."""
        response = client.get(f"/api/v1/workspaces/{test_workspace.code}/interceptors")
        assert response.status_code == 200
        result = response.json()
        assert result["data"]["total"] == 1
        assert len(result["data"]["items"]) == 1
        assert result["data"]["items"][0]["name"] == "测试拦截器"

    def test_list_with_site_filter(self, client, test_workspace, created_interceptor, test_site):
        """Test listing with site filter."""
        response = client.get(
            f"/api/v1/workspaces/{test_workspace.code}/interceptors?embedded_site_id={test_site['id']}",
        )
        assert response.status_code == 200
        result = response.json()
        assert result["data"]["total"] == 1

    def test_list_with_status_filter(self, client, test_workspace, created_interceptor):
        """Test listing with status filter."""
        response = client.get(
            f"/api/v1/workspaces/{test_workspace.code}/interceptors?status=ENABLED",
        )
        assert response.status_code == 200
        result = response.json()
        assert result["data"]["items"][0]["status"] == "ENABLED"

    def test_list_with_name_search(self, client, test_workspace, created_interceptor):
        """Test listing with name search."""
        response = client.get(
            f"/api/v1/workspaces/{test_workspace.code}/interceptors?name=测试",
        )
        assert response.status_code == 200
        result = response.json()
        assert result["data"]["total"] == 1

    def test_list_pagination(self, client, test_workspace, sample_interceptor_data):
        """Test listing with pagination."""
        # Create multiple interceptors
        for i in range(3):
            data = sample_interceptor_data.copy()
            data["name"] = f"拦截器{i}"
            client.post(
                f"/api/v1/workspaces/{test_workspace.code}/interceptors",
                json=data,
            )

        response = client.get(
            f"/api/v1/workspaces/{test_workspace.code}/interceptors?page=1&page_size=2",
        )
        assert response.status_code == 200
        result = response.json()
        assert result["data"]["total"] == 3
        assert len(result["data"]["items"]) == 2
        assert result["data"]["page"] == 1
        assert result["data"]["page_size"] == 2


class TestInterceptorGet:
    """Tests for getting single interceptor."""

    def test_get_interceptor(self, client, test_workspace, created_interceptor):
        """Test getting a single interceptor."""
        interceptor_id = created_interceptor["data"]["id"]
        response = client.get(
            f"/api/v1/workspaces/{test_workspace.code}/interceptors/{interceptor_id}",
        )
        assert response.status_code == 200
        result = response.json()
        assert result["data"]["name"] == "测试拦截器"
        assert result["data"]["event_name"] == "lead.assigned"

    def test_get_interceptor_not_found(self, client, test_workspace):
        """Test getting non-existent interceptor."""
        response = client.get(
            f"/api/v1/workspaces/{test_workspace.code}/interceptors/99999",
        )
        assert response.status_code == 200  # API always returns 200
        data = response.json()
        assert data["code"] == 404  # Error code in body


class TestInterceptorCreate:
    """Tests for creating interceptors."""

    def test_create_dom_interceptor(self, client, test_workspace, test_site):
        """Test creating a DOM type interceptor."""
        data = {
            "embedded_site_id": test_site["id"],
            "name": "DOM拦截器",
            "event_name": "button.clicked",
            "entity_name": "button",
            "mode": "observe",
            "trigger": {
                "type": "dom",
                "selector": "#submit-btn",
            },
            "debounce_ms": 500,
        }
        response = client.post(
            f"/api/v1/workspaces/{test_workspace.code}/interceptors",
            json=data,
        )
        assert response.status_code == 201
        result = response.json()
        assert result["data"]["name"] == "DOM拦截器"
        assert result["data"]["trigger_type"] == "dom"
        assert result["data"]["status"] == "ENABLED"

    def test_create_network_interceptor(self, client, test_workspace, test_site):
        """Test creating a Network type interceptor."""
        data = {
            "embedded_site_id": test_site["id"],
            "name": "网络拦截器",
            "event_name": "api.request",
            "entity_name": "api",
            "mode": "intercept",
            "trigger": {
                "type": "network",
                "url_pattern": "/api/leads/*/assign",
                "method": "POST",
            },
            "debounce_ms": 2000,
        }
        response = client.post(
            f"/api/v1/workspaces/{test_workspace.code}/interceptors",
            json=data,
        )
        assert response.status_code == 201
        result = response.json()
        assert result["data"]["name"] == "网络拦截器"
        assert result["data"]["trigger_type"] == "network"
        assert result["data"]["mode"] == "intercept"

    def test_create_with_actions(self, client, test_workspace, test_site):
        """Test creating interceptor with before/after actions."""
        data = {
            "embedded_site_id": test_site["id"],
            "name": "带动作的拦截器",
            "event_name": "form.submit",
            "entity_name": "form",
            "mode": "observe",
            "trigger": {
                "type": "dom",
                "selector": ".submit-form",
            },
            "before_actions": [{"type": "log", "config": {"message": "before"}}],
            "after_actions": [{"type": "notify", "config": {"channel": "slack"}}],
        }
        response = client.post(
            f"/api/v1/workspaces/{test_workspace.code}/interceptors",
            json=data,
        )
        assert response.status_code == 201
        result = response.json()
        assert len(result["data"]["before_actions"]) == 1
        assert len(result["data"]["after_actions"]) == 1

    def test_create_invalid_trigger_dom_missing_selector(self, client, test_workspace, test_site):
        """Test creating DOM interceptor without selector."""
        data = {
            "embedded_site_id": test_site["id"],
            "name": "无效拦截器",
            "event_name": "test.event",
            "entity_name": "test",
            "trigger": {
                "type": "dom",
            },
        }
        response = client.post(
            f"/api/v1/workspaces/{test_workspace.code}/interceptors",
            json=data,
        )
        assert response.status_code == 422

    def test_create_invalid_trigger_network_missing_url_pattern(self, client, test_workspace, test_site):
        """Test creating network interceptor without url_pattern."""
        data = {
            "embedded_site_id": test_site["id"],
            "name": "无效拦截器",
            "event_name": "test.event",
            "entity_name": "test",
            "trigger": {
                "type": "network",
            },
        }
        response = client.post(
            f"/api/v1/workspaces/{test_workspace.code}/interceptors",
            json=data,
        )
        assert response.status_code == 422

    def test_create_invalid_trigger_type(self, client, test_workspace, test_site):
        """Test creating interceptor with invalid trigger type."""
        data = {
            "embedded_site_id": test_site["id"],
            "name": "无效拦截器",
            "event_name": "test.event",
            "entity_name": "test",
            "trigger": {
                "type": "invalid",
            },
        }
        response = client.post(
            f"/api/v1/workspaces/{test_workspace.code}/interceptors",
            json=data,
        )
        assert response.status_code == 422

    def test_create_nonexistent_site(self, client, test_workspace):
        """Test creating interceptor with non-existent site."""
        data = {
            "embedded_site_id": 99999,
            "name": "无效拦截器",
            "event_name": "test.event",
            "entity_name": "test",
            "trigger": {
                "type": "dom",
                "selector": "#btn",
            },
        }
        response = client.post(
            f"/api/v1/workspaces/{test_workspace.code}/interceptors",
            json=data,
        )
        assert response.status_code == 200  # API always returns 200
        result = response.json()
        assert result["code"] == 404

    def test_create_invalid_mode(self, client, test_workspace, test_site):
        """Test creating interceptor with invalid mode."""
        data = {
            "embedded_site_id": test_site["id"],
            "name": "无效拦截器",
            "event_name": "test.event",
            "entity_name": "test",
            "mode": "invalid",
            "trigger": {
                "type": "dom",
                "selector": "#btn",
            },
        }
        response = client.post(
            f"/api/v1/workspaces/{test_workspace.code}/interceptors",
            json=data,
        )
        assert response.status_code == 422


class TestInterceptorUpdate:
    """Tests for updating interceptors."""

    def test_update_interceptor(self, client, test_workspace, created_interceptor):
        """Test updating an interceptor."""
        interceptor_id = created_interceptor["data"]["id"]
        update_data = {
            "name": "更新后的拦截器",
            "event_name": "updated.event",
        }
        response = client.put(
            f"/api/v1/workspaces/{test_workspace.code}/interceptors/{interceptor_id}",
            json=update_data,
        )
        assert response.status_code == 200
        result = response.json()
        assert result["data"]["name"] == "更新后的拦截器"
        assert result["data"]["event_name"] == "updated.event"

    def test_update_trigger_type(self, client, test_workspace, created_interceptor, test_site):
        """Test updating trigger type from dom to network."""
        interceptor_id = created_interceptor["data"]["id"]
        update_data = {
            "trigger": {
                "type": "network",
                "url_pattern": "/api/new/*",
                "method": "GET",
            },
        }
        response = client.put(
            f"/api/v1/workspaces/{test_workspace.code}/interceptors/{interceptor_id}",
            json=update_data,
        )
        assert response.status_code == 200
        result = response.json()
        assert result["data"]["trigger_type"] == "network"

    def test_update_partial(self, client, test_workspace, created_interceptor):
        """Test partial update (only name)."""
        interceptor_id = created_interceptor["data"]["id"]
        update_data = {"name": "仅更新名称"}
        response = client.put(
            f"/api/v1/workspaces/{test_workspace.code}/interceptors/{interceptor_id}",
            json=update_data,
        )
        assert response.status_code == 200
        result = response.json()
        assert result["data"]["name"] == "仅更新名称"
        assert result["data"]["event_name"] == "lead.assigned"  # Unchanged


class TestInterceptorDelete:
    """Tests for deleting interceptors."""

    def test_delete_interceptor(self, client, test_workspace, created_interceptor):
        """Test soft deleting an interceptor."""
        interceptor_id = created_interceptor["data"]["id"]
        response = client.delete(
            f"/api/v1/workspaces/{test_workspace.code}/interceptors/{interceptor_id}",
        )
        assert response.status_code == 204

    def test_deleted_interceptor_has_disabled_status(self, client, test_workspace, created_interceptor):
        """Test that deleted interceptor has DISABLED status."""
        interceptor_id = created_interceptor["data"]["id"]
        client.delete(
            f"/api/v1/workspaces/{test_workspace.code}/interceptors/{interceptor_id}",
        )
        # Verify it's still accessible but disabled
        response = client.get(
            f"/api/v1/workspaces/{test_workspace.code}/interceptors/{interceptor_id}",
        )
        assert response.status_code == 200
        assert response.json()["data"]["status"] == "DISABLED"


class TestInterceptorEnableDisable:
    """Tests for enabling/disabling interceptors."""

    def test_enable_interceptor(self, client, test_workspace, created_interceptor):
        """Test enabling an interceptor (starts enabled)."""
        interceptor_id = created_interceptor["data"]["id"]
        # First disable it
        client.post(
            f"/api/v1/workspaces/{test_workspace.code}/interceptors/{interceptor_id}/disable",
        )
        # Then enable
        response = client.post(
            f"/api/v1/workspaces/{test_workspace.code}/interceptors/{interceptor_id}/enable",
        )
        assert response.status_code == 200
        assert response.json()["data"]["status"] == "ENABLED"

    def test_disable_interceptor(self, client, test_workspace, created_interceptor):
        """Test disabling an interceptor."""
        interceptor_id = created_interceptor["data"]["id"]
        response = client.post(
            f"/api/v1/workspaces/{test_workspace.code}/interceptors/{interceptor_id}/disable",
        )
        assert response.status_code == 200
        assert response.json()["data"]["status"] == "DISABLED"

    def test_idempotent_enable(self, client, test_workspace, created_interceptor):
        """Test that enabling an already enabled interceptor is idempotent."""
        interceptor_id = created_interceptor["data"]["id"]
        response1 = client.post(
            f"/api/v1/workspaces/{test_workspace.code}/interceptors/{interceptor_id}/enable",
        )
        response2 = client.post(
            f"/api/v1/workspaces/{test_workspace.code}/interceptors/{interceptor_id}/enable",
        )
        assert response1.status_code == 200
        assert response2.status_code == 200
        assert response1.json()["data"]["status"] == "ENABLED"
        assert response2.json()["data"]["status"] == "ENABLED"

    def test_idempotent_disable(self, client, test_workspace, created_interceptor):
        """Test that disabling an already disabled interceptor is idempotent."""
        interceptor_id = created_interceptor["data"]["id"]
        # Disable twice
        response1 = client.post(
            f"/api/v1/workspaces/{test_workspace.code}/interceptors/{interceptor_id}/disable",
        )
        response2 = client.post(
            f"/api/v1/workspaces/{test_workspace.code}/interceptors/{interceptor_id}/disable",
        )
        assert response1.status_code == 200
        assert response2.status_code == 200
        assert response1.json()["data"]["status"] == "DISABLED"
        assert response2.json()["data"]["status"] == "DISABLED"

    def test_enable_not_found(self, client, test_workspace):
        """Test enabling non-existent interceptor."""
        response = client.post(
            f"/api/v1/workspaces/{test_workspace.code}/interceptors/99999/enable",
        )
        assert response.status_code == 200  # API always returns 200
        data = response.json()
        assert data["code"] == 404

    def test_disable_not_found(self, client, test_workspace):
        """Test disabling non-existent interceptor."""
        response = client.post(
            f"/api/v1/workspaces/{test_workspace.code}/interceptors/99999/disable",
        )
        assert response.status_code == 200  # API always returns 200
        data = response.json()
        assert data["code"] == 404
