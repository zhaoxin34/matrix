"""Integration tests for Agent API.

Tests CRUD operations for agents in workspaces.
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
    from app.services.auth_service import hash_password

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    def override_get_current_user():
        # Get or create test user in database
        user = db_session.query(User).filter(User.id == 1).first()
        if not user:
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
def sample_prototype(db_session):
    """Create a test agent prototype with version."""
    from app.models.agent_prototype import AgentPrototype
    from app.models.agent_prototype import AgentStatus as PrototypeStatus
    from app.models.agent_prototype_version import AgentPrototypeVersion

    prototype = AgentPrototype(
        name="测试助手",
        code="test_assistant",
        description="测试用助手原型",
        model="gpt-4",
        prompts={"system": "你是一个测试助手"},
        config={},
        status=PrototypeStatus.ENABLED,
        created_by=1,
        version="1.0.0",
    )
    db_session.add(prototype)
    db_session.flush()

    # Create version record
    version = AgentPrototypeVersion(
        agent_prototype_id=prototype.id,
        version="1.0.0",
        prompts_snapshot={"system": "你是一个测试助手"},
        config_snapshot={},
        change_summary="初始版本",
        created_by=1,
    )
    db_session.add(version)
    db_session.commit()
    db_session.refresh(prototype)
    return prototype


@pytest.fixture
def sample_workspace(db_session, test_user):
    """Create a test workspace."""
    from app.models import MemberRole, OrganizationUnit, OrgUnitType, WorkspaceMember, WorkspaceStatus
    from app.models.workspace import Workspace

    # Create org unit
    org = OrganizationUnit(
        name="测试公司",
        code="test_company",
        type=OrgUnitType.COMPANY,
        level=0,
    )
    db_session.add(org)
    db_session.flush()

    # Create workspace
    workspace = Workspace(
        name="测试工作空间",
        code="test_workspace",
        description="测试用工作空间",
        status=WorkspaceStatus.ACTIVE,
        org_id=org.id,
        owner_id=test_user.id,
    )
    db_session.add(workspace)
    db_session.flush()

    # Create owner member
    member = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=test_user.id,
        role=MemberRole.OWNER,
    )
    db_session.add(member)
    db_session.commit()
    db_session.refresh(workspace)
    return workspace


@pytest.fixture
def sample_agent_data(sample_prototype):
    """Sample agent creation data."""
    return {
        "name": "test-agent",
        "description": "Test agent description",
        "prototype_id": sample_prototype.id,
        "prototype_version": "1.0.0",
        "model": "gpt-4",
        "skills": ["faq", "ticket"],
        "config": {
            "temperature": 0.7,
            "max_tokens": 4096,
        },
    }


class TestAgentAPIList:
    """Tests for Agent list API."""

    def test_list_agents_empty(self, client, sample_workspace):
        """Test listing agents when none exist."""
        response = client.get(f"/api/v1/workspaces/{sample_workspace.code}/agents")
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 0
        assert data["data"]["total"] == 0
        assert data["data"]["items"] == []

    def test_list_agents_with_data(self, client, sample_workspace, sample_agent_data):
        """Test listing agents with data."""
        # Create an agent first
        client.post(
            f"/api/v1/workspaces/{sample_workspace.code}/agents",
            json=sample_agent_data,
        )

        # List agents
        response = client.get(f"/api/v1/workspaces/{sample_workspace.code}/agents")
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 0
        assert data["data"]["total"] >= 1

    def test_list_agents_with_filter(self, client, sample_workspace, sample_agent_data):
        """Test listing agents with status filter."""
        # Create an agent
        client.post(
            f"/api/v1/workspaces/{sample_workspace.code}/agents",
            json=sample_agent_data,
        )

        # List with filter
        response = client.get(
            f"/api/v1/workspaces/{sample_workspace.code}/agents",
            params={"status": "enabled"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 0
        assert all(item["status"] == "enabled" for item in data["data"]["items"])

    def test_list_agents_with_search(self, client, sample_workspace, sample_agent_data):
        """Test listing agents with search."""
        # Create an agent
        client.post(
            f"/api/v1/workspaces/{sample_workspace.code}/agents",
            json=sample_agent_data,
        )

        # Search
        response = client.get(
            f"/api/v1/workspaces/{sample_workspace.code}/agents",
            params={"search": "test"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 0


class TestAgentAPICreate:
    """Tests for Agent creation API."""

    def test_create_agent_success(self, client, sample_workspace, sample_agent_data):
        """Test successful agent creation."""
        response = client.post(
            f"/api/v1/workspaces/{sample_workspace.code}/agents",
            json=sample_agent_data,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 0
        assert data["data"]["name"] == sample_agent_data["name"]
        assert data["data"]["status"] == "enabled"
        assert "id" in data["data"]

    def test_create_agent_missing_fields(self, client, sample_workspace):
        """Test agent creation with missing required fields."""
        response = client.post(
            f"/api/v1/workspaces/{sample_workspace.code}/agents",
            json={"name": "test"},
        )
        assert response.status_code == 422  # Validation error

    def test_create_agent_duplicate_name(self, client, sample_workspace, sample_agent_data):
        """Test creating agent with duplicate name."""
        # Create first agent
        response = client.post(
            f"/api/v1/workspaces/{sample_workspace.code}/agents",
            json=sample_agent_data,
        )
        assert response.status_code == 200

        # Try to create duplicate
        response = client.post(
            f"/api/v1/workspaces/{sample_workspace.code}/agents",
            json=sample_agent_data,
        )
        # Should return 400 (Bad Request) because duplicate name
        assert response.status_code == 400
        data = response.json()
        assert data["code"] != 0  # Should fail


class TestAgentAPIGet:
    """Tests for Agent get API."""

    def test_get_agent_success(self, client, sample_workspace, sample_agent_data):
        """Test getting agent by ID."""
        # Create agent
        create_response = client.post(
            f"/api/v1/workspaces/{sample_workspace.code}/agents",
            json=sample_agent_data,
        )
        agent_id = create_response.json()["data"]["id"]

        # Get agent
        response = client.get(
            f"/api/v1/workspaces/{sample_workspace.code}/agents/{agent_id}",
        )
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 0
        assert data["data"]["id"] == agent_id

    def test_get_agent_not_found(self, client, sample_workspace):
        """Test getting non-existent agent."""
        response = client.get(
            f"/api/v1/workspaces/{sample_workspace.code}/agents/9999",
        )
        # Should return 404 (Not Found) because agent doesn't exist
        assert response.status_code == 404


class TestAgentAPIUpdate:
    """Tests for Agent update API."""

    def test_update_agent_success(self, client, sample_workspace, sample_agent_data):
        """Test successful agent update."""
        # Create agent
        create_response = client.post(
            f"/api/v1/workspaces/{sample_workspace.code}/agents",
            json=sample_agent_data,
        )
        agent_id = create_response.json()["data"]["id"]

        # Update agent
        response = client.put(
            f"/api/v1/workspaces/{sample_workspace.code}/agents/{agent_id}",
            json={"description": "Updated description"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 0
        assert data["data"]["description"] == "Updated description"

    def test_update_agent_name(self, client, sample_workspace, sample_agent_data):
        """Test updating agent name."""
        # Create agent
        create_response = client.post(
            f"/api/v1/workspaces/{sample_workspace.code}/agents",
            json=sample_agent_data,
        )
        agent_id = create_response.json()["data"]["id"]

        # Update name
        response = client.put(
            f"/api/v1/workspaces/{sample_workspace.code}/agents/{agent_id}",
            json={"name": "updated-name"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 0
        assert data["data"]["name"] == "updated-name"

    def test_update_agent_prototype_version(self, client, db_session, sample_workspace, sample_prototype):
        """Test updating agent prototype version."""
        from app.models.agent_prototype_version import AgentPrototypeVersion

        # Create a second version for the prototype
        version2 = AgentPrototypeVersion(
            agent_prototype_id=sample_prototype.id,
            version="1.1.0",
            prompts_snapshot={"system": "更新后的提示词"},
            config_snapshot={},
            change_summary="功能更新",
            created_by=1,
        )
        db_session.add(version2)
        db_session.commit()

        # Create agent with version 1.0.0
        agent_data = {
            "name": "test-agent-version",
            "prototype_id": sample_prototype.id,
            "prototype_version": "1.0.0",
            "model": "gpt-4",
        }
        create_response = client.post(
            f"/api/v1/workspaces/{sample_workspace.code}/agents",
            json=agent_data,
        )
        agent_id = create_response.json()["data"]["id"]
        assert create_response.json()["data"]["prototype_version"] == "1.0.0"

        # Update to version 1.1.0
        response = client.put(
            f"/api/v1/workspaces/{sample_workspace.code}/agents/{agent_id}",
            json={"prototype_version": "1.1.0"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 0
        assert data["data"]["prototype_version"] == "1.1.0"

    def test_update_agent_prototype_version_not_found(self, client, sample_workspace, sample_agent_data):
        """Test updating agent with non-existent prototype version fails."""
        # Create agent
        create_response = client.post(
            f"/api/v1/workspaces/{sample_workspace.code}/agents",
            json=sample_agent_data,
        )
        agent_id = create_response.json()["data"]["id"]

        # Try to update to non-existent version
        response = client.put(
            f"/api/v1/workspaces/{sample_workspace.code}/agents/{agent_id}",
            json={"prototype_version": "99.99.99"},
        )
        assert response.status_code == 400


class TestAgentAPIDelete:
    """Tests for Agent delete API."""

    def test_delete_agent_success(self, client, sample_workspace, sample_agent_data):
        """Test successful agent deletion."""
        # Create agent
        create_response = client.post(
            f"/api/v1/workspaces/{sample_workspace.code}/agents",
            json=sample_agent_data,
        )
        agent_id = create_response.json()["data"]["id"]

        # Delete agent
        response = client.delete(
            f"/api/v1/workspaces/{sample_workspace.code}/agents/{agent_id}",
        )
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 0

        # Verify agent is soft deleted (not returned in list)
        list_response = client.get(
            f"/api/v1/workspaces/{sample_workspace.code}/agents",
        )
        list_data = list_response.json()
        assert all(item["id"] != agent_id for item in list_data["data"]["items"])


class TestAgentAPIEnableDisable:
    """Tests for Agent enable/disable API."""

    def test_disable_agent_success(self, client, sample_workspace, sample_agent_data):
        """Test successful agent disable."""
        # Create agent
        create_response = client.post(
            f"/api/v1/workspaces/{sample_workspace.code}/agents",
            json=sample_agent_data,
        )
        agent_id = create_response.json()["data"]["id"]

        # Disable agent
        response = client.patch(
            f"/api/v1/workspaces/{sample_workspace.code}/agents/{agent_id}/disable",
        )
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 0
        assert data["data"]["status"] == "disabled"

    def test_enable_agent_success(self, client, sample_workspace, sample_agent_data):
        """Test successful agent enable."""
        # Create agent
        create_response = client.post(
            f"/api/v1/workspaces/{sample_workspace.code}/agents",
            json=sample_agent_data,
        )
        agent_id = create_response.json()["data"]["id"]

        # Disable then enable
        client.patch(
            f"/api/v1/workspaces/{sample_workspace.code}/agents/{agent_id}/disable",
        )
        response = client.patch(
            f"/api/v1/workspaces/{sample_workspace.code}/agents/{agent_id}/enable",
        )
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == 0
        assert data["data"]["status"] == "enabled"

    def test_disable_already_disabled_fails(self, client, sample_workspace, sample_agent_data):
        """Test disabling already disabled agent fails."""
        # Create agent
        create_response = client.post(
            f"/api/v1/workspaces/{sample_workspace.code}/agents",
            json=sample_agent_data,
        )
        agent_id = create_response.json()["data"]["id"]

        # Disable first time
        client.patch(
            f"/api/v1/workspaces/{sample_workspace.code}/agents/{agent_id}/disable",
        )

        # Disable again - should fail with 400
        response = client.patch(
            f"/api/v1/workspaces/{sample_workspace.code}/agents/{agent_id}/disable",
        )
        assert response.status_code == 400
        data = response.json()
        assert data["code"] != 0  # Should fail
