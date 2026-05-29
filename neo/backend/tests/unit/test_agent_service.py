"""Unit tests for AgentService."""

from unittest.mock import MagicMock, patch

import pytest
from sqlalchemy.orm import Session

from app.core.error_codes import (
    ERR_AGENT_NAME_EXISTS,
    ERR_AGENT_NOT_FOUND,
    ERR_AGENT_STATUS_NOT_ALLOWED,
    ERR_NOT_FOUND,
    ERR_PROTOTYPE_NOT_ENABLED,
    ERR_PROTOTYPE_NOT_FOUND,
)
from app.core.exceptions import BusinessException
from app.models.agent import Agent, AgentStatus
from app.models.agent_prototype import AgentPrototype
from app.models.agent_prototype import AgentStatus as PrototypeStatus
from app.models.agent_prototype_version import AgentPrototypeVersion
from app.services.agent_service import AgentService


@pytest.fixture
def mock_db():
    """Create mock database session."""
    return MagicMock(spec=Session)


@pytest.fixture
def agent_service(mock_db):
    """Create AgentService instance with mocked dependencies."""
    return AgentService(mock_db)


@pytest.fixture
def mock_agent_repo(mock_db):
    """Create mock AgentRepository."""
    from app.repositories.agent_repository import AgentRepository

    return MagicMock(spec=AgentRepository)


@pytest.fixture
def mock_prototype_repo():
    """Create mock AgentPrototypeRepository."""
    from app.repositories.agent_prototype_repository import AgentPrototypeRepository

    return MagicMock(spec=AgentPrototypeRepository)


@pytest.fixture
def mock_version_repo():
    """Create mock AgentPrototypeVersionRepository."""
    from app.repositories.agent_prototype_repository import AgentPrototypeVersionRepository

    return MagicMock(spec=AgentPrototypeVersionRepository)


@pytest.fixture
def sample_prototype():
    """Create sample agent prototype."""
    prototype = MagicMock(spec=AgentPrototype)
    prototype.id = 1
    prototype.name = "测试助手"
    prototype.status = PrototypeStatus.ENABLED
    prototype.model = "gpt-4"
    return prototype


@pytest.fixture
def sample_version():
    """Create sample agent prototype version."""
    version = MagicMock(spec=AgentPrototypeVersion)
    version.version = "1.0.0"
    version.id = 1
    return version


@pytest.fixture
def sample_workspace():
    """Create sample workspace."""
    workspace = MagicMock()
    workspace.id = 1
    workspace.code = "test_workspace"
    return workspace


@pytest.fixture
def sample_agent():
    """Create sample agent."""
    agent = MagicMock(spec=Agent)
    agent.id = 1
    agent.name = "test-agent"
    agent.status = AgentStatus.ENABLED
    agent.workspace_id = 1
    agent.prototype_id = 1
    agent.prototype_version = "1.0.0"
    return agent


class TestAgentServiceCreate:
    """Tests for AgentService.create_agent()."""

    def test_create_agent_success(
        self,
        mock_db,
        sample_workspace,
        sample_prototype,
        sample_version,
    ):
        """Test successful agent creation."""
        # Setup mocks
        with (
            patch("app.services.agent_service.AgentRepository") as _MockAgentRepo,
            patch("app.services.agent_service.AgentPrototypeRepository") as _MockProtoRepo,
            patch("app.services.agent_service.AgentPrototypeVersionRepository") as _MockVersionRepo,
            patch("app.services.agent_service.get_workspace_by_code") as mock_get_workspace,
        ):
            mock_get_workspace.return_value = sample_workspace

            agent_repo_instance = MagicMock()
            agent_repo_instance.exists_in_workspace.return_value = False
            _MockAgentRepo.return_value = agent_repo_instance

            prototype_repo_instance = MagicMock()
            prototype_repo_instance.get_by_id.return_value = sample_prototype
            _MockProtoRepo.return_value = prototype_repo_instance

            version_repo_instance = MagicMock()
            version_repo_instance.get_version.return_value = sample_version
            _MockVersionRepo.return_value = version_repo_instance

            service = AgentService(mock_db)

            # Test data
            data = {
                "name": "new-agent",
                "prototype_id": 1,
                "prototype_version": "1.0.0",
                "model": "gpt-4",
                "skills": ["faq"],
                "config": {},
            }

            _ = service.create_agent(
                workspace_code="test_workspace",
                data=data,
                user_id=1,
            )

            # Verify create was called
            agent_repo_instance.create.assert_called_once()

    def test_create_agent_workspace_not_found(self, mock_db):
        """Test creating agent with non-existent workspace."""
        with (
            patch("app.services.agent_service.AgentRepository") as _MockAgentRepo,
            patch("app.services.agent_service.AgentPrototypeRepository") as _MockProtoRepo,
            patch("app.services.agent_service.AgentPrototypeVersionRepository") as _MockVersionRepo,
            patch("app.services.agent_service.get_workspace_by_code") as mock_get_workspace,
        ):
            mock_get_workspace.return_value = None
            service = AgentService(mock_db)

            with pytest.raises(BusinessException) as exc_info:
                service.create_agent(
                    workspace_code="non_existent",
                    data={"name": "test", "prototype_id": 1, "prototype_version": "1.0.0"},
                    user_id=1,
                )

            assert exc_info.value.code == ERR_NOT_FOUND

    def test_create_agent_name_exists(
        self,
        mock_db,
        sample_workspace,
        sample_prototype,
    ):
        """Test creating agent with duplicate name."""
        with (
            patch("app.services.agent_service.AgentRepository") as _MockAgentRepo,
            patch("app.services.agent_service.AgentPrototypeRepository") as _MockProtoRepo,
            patch("app.services.agent_service.AgentPrototypeVersionRepository") as _MockVersionRepo,
            patch("app.services.agent_service.get_workspace_by_code") as mock_get_workspace,
        ):
            mock_get_workspace.return_value = sample_workspace

            agent_repo_instance = MagicMock()
            agent_repo_instance.exists_in_workspace.return_value = True
            _MockAgentRepo.return_value = agent_repo_instance

            prototype_repo_instance = MagicMock()
            prototype_repo_instance.get_by_id.return_value = sample_prototype
            _MockProtoRepo.return_value = prototype_repo_instance

            version_repo_instance = MagicMock()
            version_repo_instance.get_version.return_value = MagicMock()
            _MockVersionRepo.return_value = version_repo_instance

            service = AgentService(mock_db)

            with pytest.raises(BusinessException) as exc_info:
                service.create_agent(
                    workspace_code="test_workspace",
                    data={
                        "name": "existing-agent",
                        "prototype_id": 1,
                        "prototype_version": "1.0.0",
                    },
                    user_id=1,
                )

            assert exc_info.value.code == ERR_AGENT_NAME_EXISTS

    def test_create_agent_prototype_not_found(self, mock_db, sample_workspace):
        """Test creating agent with non-existent prototype."""
        with (
            patch("app.services.agent_service.AgentRepository") as _MockAgentRepo,
            patch("app.services.agent_service.AgentPrototypeRepository") as _MockProtoRepo,
            patch("app.services.agent_service.AgentPrototypeVersionRepository") as _MockVersionRepo,
            patch("app.services.agent_service.get_workspace_by_code") as mock_get_workspace,
        ):
            mock_get_workspace.return_value = sample_workspace

            agent_repo_instance = MagicMock()
            agent_repo_instance.exists_in_workspace.return_value = False
            _MockAgentRepo.return_value = agent_repo_instance

            prototype_repo_instance = MagicMock()
            prototype_repo_instance.get_by_id.return_value = None
            _MockProtoRepo.return_value = prototype_repo_instance

            service = AgentService(mock_db)

            with pytest.raises(BusinessException) as exc_info:
                service.create_agent(
                    workspace_code="test_workspace",
                    data={
                        "name": "test-agent",
                        "prototype_id": 999,
                        "prototype_version": "1.0.0",
                    },
                    user_id=1,
                )

            assert exc_info.value.code == ERR_PROTOTYPE_NOT_FOUND

    def test_create_agent_prototype_disabled(
        self,
        mock_db,
        sample_workspace,
        sample_prototype,
    ):
        """Test creating agent with disabled prototype."""
        sample_prototype.status = PrototypeStatus.DISABLED

        with (
            patch("app.services.agent_service.AgentRepository") as _MockAgentRepo,
            patch("app.services.agent_service.AgentPrototypeRepository") as _MockProtoRepo,
            patch("app.services.agent_service.AgentPrototypeVersionRepository") as _MockVersionRepo,
            patch("app.services.agent_service.get_workspace_by_code") as mock_get_workspace,
        ):
            mock_get_workspace.return_value = sample_workspace

            agent_repo_instance = MagicMock()
            agent_repo_instance.exists_in_workspace.return_value = False
            _MockAgentRepo.return_value = agent_repo_instance

            prototype_repo_instance = MagicMock()
            prototype_repo_instance.get_by_id.return_value = sample_prototype
            _MockProtoRepo.return_value = prototype_repo_instance

            service = AgentService(mock_db)

            with pytest.raises(BusinessException) as exc_info:
                service.create_agent(
                    workspace_code="test_workspace",
                    data={
                        "name": "test-agent",
                        "prototype_id": 1,
                        "prototype_version": "1.0.0",
                    },
                    user_id=1,
                )

            assert exc_info.value.code == ERR_PROTOTYPE_NOT_ENABLED


class TestAgentServiceGet:
    """Tests for AgentService.get_agent()."""

    def test_get_agent_success(self, mock_db, sample_workspace, sample_agent):
        """Test getting agent successfully."""
        with (
            patch("app.services.agent_service.AgentRepository") as _MockAgentRepo,
            patch("app.services.agent_service.AgentPrototypeRepository") as _MockProtoRepo,
            patch("app.services.agent_service.AgentPrototypeVersionRepository") as _MockVersionRepo,
            patch("app.services.agent_service.get_workspace_by_code") as mock_get_workspace,
        ):
            mock_get_workspace.return_value = sample_workspace

            agent_repo_instance = MagicMock()
            agent_repo_instance.get_by_id.return_value = sample_agent
            _MockAgentRepo.return_value = agent_repo_instance

            service = AgentService(mock_db)
            result = service.get_agent("test_workspace", 1)

            assert result.id == 1

    def test_get_agent_not_found(self, mock_db, sample_workspace):
        """Test getting non-existent agent."""
        with (
            patch("app.services.agent_service.AgentRepository") as _MockAgentRepo,
            patch("app.services.agent_service.AgentPrototypeRepository") as _MockProtoRepo,
            patch("app.services.agent_service.AgentPrototypeVersionRepository") as _MockVersionRepo,
            patch("app.services.agent_service.get_workspace_by_code") as mock_get_workspace,
        ):
            mock_get_workspace.return_value = sample_workspace

            agent_repo_instance = MagicMock()
            agent_repo_instance.get_by_id.return_value = None
            _MockAgentRepo.return_value = agent_repo_instance

            service = AgentService(mock_db)

            with pytest.raises(BusinessException) as exc_info:
                service.get_agent("test_workspace", 999)

            assert exc_info.value.code == ERR_AGENT_NOT_FOUND

    def test_get_agent_wrong_workspace(self, mock_db, sample_workspace, sample_agent):
        """Test getting agent from wrong workspace."""
        sample_agent.workspace_id = 999

        with (
            patch("app.services.agent_service.AgentRepository") as _MockAgentRepo,
            patch("app.services.agent_service.AgentPrototypeRepository") as _MockProtoRepo,
            patch("app.services.agent_service.AgentPrototypeVersionRepository") as _MockVersionRepo,
            patch("app.services.agent_service.get_workspace_by_code") as mock_get_workspace,
        ):
            mock_get_workspace.return_value = sample_workspace

            agent_repo_instance = MagicMock()
            agent_repo_instance.get_by_id.return_value = sample_agent
            _MockAgentRepo.return_value = agent_repo_instance

            service = AgentService(mock_db)

            with pytest.raises(BusinessException) as exc_info:
                service.get_agent("test_workspace", 1)

            assert exc_info.value.code == ERR_AGENT_NOT_FOUND


class TestAgentServiceList:
    """Tests for AgentService.list_agents()."""

    def test_list_agents_success(self, mock_db, sample_workspace):
        """Test listing agents successfully."""
        with (
            patch("app.services.agent_service.AgentRepository") as _MockAgentRepo,
            patch("app.services.agent_service.AgentPrototypeRepository") as _MockProtoRepo,
            patch("app.services.agent_service.AgentPrototypeVersionRepository") as _MockVersionRepo,
            patch("app.services.agent_service.get_workspace_by_code") as mock_get_workspace,
        ):
            mock_get_workspace.return_value = sample_workspace

            mock_agents = [MagicMock(), MagicMock()]
            agent_repo_instance = MagicMock()
            agent_repo_instance.list_agents.return_value = (mock_agents, 2)
            _MockAgentRepo.return_value = agent_repo_instance

            service = AgentService(mock_db)
            agents, total = service.list_agents("test_workspace")

            assert total == 2
            assert len(agents) == 2

    def test_list_agents_with_filters(self, mock_db, sample_workspace):
        """Test listing agents with filters."""
        with (
            patch("app.services.agent_service.AgentRepository") as _MockAgentRepo,
            patch("app.services.agent_service.AgentPrototypeRepository") as _MockProtoRepo,
            patch("app.services.agent_service.AgentPrototypeVersionRepository") as _MockVersionRepo,
            patch("app.services.agent_service.get_workspace_by_code") as mock_get_workspace,
        ):
            mock_get_workspace.return_value = sample_workspace

            agent_repo_instance = MagicMock()
            agent_repo_instance.list_agents.return_value = ([], 0)
            _MockAgentRepo.return_value = agent_repo_instance

            service = AgentService(mock_db)
            agents, total = service.list_agents(
                "test_workspace",
                status="enabled",
                prototype_id=1,
                search="test",
                page=1,
                page_size=20,
            )

            agent_repo_instance.list_agents.assert_called_once_with(
                workspace_id=1,
                status="enabled",
                prototype_id=1,
                search="test",
                page=1,
                page_size=20,
            )


class TestAgentServiceUpdate:
    """Tests for AgentService.update_agent()."""

    def test_update_agent_success(self, mock_db, sample_workspace, sample_agent):
        """Test updating agent successfully."""
        updated_agent = MagicMock()
        updated_agent.description = "Updated description"

        with (
            patch("app.services.agent_service.AgentRepository") as _MockAgentRepo,
            patch("app.services.agent_service.AgentPrototypeRepository") as _MockProtoRepo,
            patch("app.services.agent_service.AgentPrototypeVersionRepository") as _MockVersionRepo,
            patch("app.services.agent_service.get_workspace_by_code") as mock_get_workspace,
        ):
            mock_get_workspace.return_value = sample_workspace

            agent_repo_instance = MagicMock()
            agent_repo_instance.get_by_id.return_value = sample_agent
            agent_repo_instance.exists_in_workspace.return_value = False
            agent_repo_instance.update.return_value = updated_agent
            _MockAgentRepo.return_value = agent_repo_instance

            service = AgentService(mock_db)
            result = service.update_agent(
                "test_workspace",
                1,
                {"description": "Updated description"},
            )

            assert result.description == "Updated description"

    def test_update_deleted_agent_fails(self, mock_db, sample_workspace, sample_agent):
        """Test updating a deleted agent fails (deleted agents not accessible)."""
        sample_agent.status = AgentStatus.DELETED

        with (
            patch("app.services.agent_service.AgentRepository") as _MockAgentRepo,
            patch("app.services.agent_service.AgentPrototypeRepository") as _MockProtoRepo,
            patch("app.services.agent_service.AgentPrototypeVersionRepository") as _MockVersionRepo,
            patch("app.services.agent_service.get_workspace_by_code") as mock_get_workspace,
        ):
            mock_get_workspace.return_value = sample_workspace

            agent_repo_instance = MagicMock()
            agent_repo_instance.get_by_id.return_value = sample_agent
            _MockAgentRepo.return_value = agent_repo_instance

            service = AgentService(mock_db)

            with pytest.raises(BusinessException) as exc_info:
                service.update_agent("test_workspace", 1, {"description": "Test"})

            # Deleted agents are not accessible, so get_agent raises ERR_AGENT_NOT_FOUND
            assert exc_info.value.code == ERR_AGENT_NOT_FOUND


class TestAgentServiceDelete:
    """Tests for AgentService.delete_agent()."""

    def test_delete_agent_success(self, mock_db, sample_workspace, sample_agent):
        """Test deleting agent successfully."""
        with (
            patch("app.services.agent_service.AgentRepository") as _MockAgentRepo,
            patch("app.services.agent_service.AgentPrototypeRepository") as _MockProtoRepo,
            patch("app.services.agent_service.AgentPrototypeVersionRepository") as _MockVersionRepo,
            patch("app.services.agent_service.get_workspace_by_code") as mock_get_workspace,
        ):
            mock_get_workspace.return_value = sample_workspace

            agent_repo_instance = MagicMock()
            agent_repo_instance.get_by_id.return_value = sample_agent
            agent_repo_instance.has_active_tasks.return_value = False
            _MockAgentRepo.return_value = agent_repo_instance

            service = AgentService(mock_db)
            service.delete_agent("test_workspace", 1)

            agent_repo_instance.soft_delete.assert_called_once()


class TestAgentServiceEnableDisable:
    """Tests for AgentService.enable_agent() and disable_agent()."""

    def test_enable_agent_success(self, mock_db, sample_workspace, sample_agent):
        """Test enabling agent successfully."""
        sample_agent.status = AgentStatus.DISABLED

        with (
            patch("app.services.agent_service.AgentRepository") as _MockAgentRepo,
            patch("app.services.agent_service.AgentPrototypeRepository") as _MockProtoRepo,
            patch("app.services.agent_service.AgentPrototypeVersionRepository") as _MockVersionRepo,
            patch("app.services.agent_service.get_workspace_by_code") as mock_get_workspace,
        ):
            mock_get_workspace.return_value = sample_workspace

            enabled_agent = MagicMock()
            enabled_agent.status = AgentStatus.ENABLED

            agent_repo_instance = MagicMock()
            agent_repo_instance.get_by_id.return_value = sample_agent
            agent_repo_instance.update_status.return_value = enabled_agent
            _MockAgentRepo.return_value = agent_repo_instance

            service = AgentService(mock_db)
            result = service.enable_agent("test_workspace", 1)

            assert result.status == AgentStatus.ENABLED

    def test_enable_already_enabled_fails(self, mock_db, sample_workspace, sample_agent):
        """Test enabling already enabled agent fails."""
        sample_agent.status = AgentStatus.ENABLED

        with (
            patch("app.services.agent_service.AgentRepository") as _MockAgentRepo,
            patch("app.services.agent_service.AgentPrototypeRepository") as _MockProtoRepo,
            patch("app.services.agent_service.AgentPrototypeVersionRepository") as _MockVersionRepo,
            patch("app.services.agent_service.get_workspace_by_code") as mock_get_workspace,
        ):
            mock_get_workspace.return_value = sample_workspace

            agent_repo_instance = MagicMock()
            agent_repo_instance.get_by_id.return_value = sample_agent
            _MockAgentRepo.return_value = agent_repo_instance

            service = AgentService(mock_db)

            with pytest.raises(BusinessException) as exc_info:
                service.enable_agent("test_workspace", 1)

            assert exc_info.value.code == ERR_AGENT_STATUS_NOT_ALLOWED

    def test_disable_agent_success(self, mock_db, sample_workspace, sample_agent):
        """Test disabling agent successfully."""
        sample_agent.status = AgentStatus.ENABLED

        with (
            patch("app.services.agent_service.AgentRepository") as _MockAgentRepo,
            patch("app.services.agent_service.AgentPrototypeRepository") as _MockProtoRepo,
            patch("app.services.agent_service.AgentPrototypeVersionRepository") as _MockVersionRepo,
            patch("app.services.agent_service.get_workspace_by_code") as mock_get_workspace,
        ):
            mock_get_workspace.return_value = sample_workspace

            disabled_agent = MagicMock()
            disabled_agent.status = AgentStatus.DISABLED

            agent_repo_instance = MagicMock()
            agent_repo_instance.get_by_id.return_value = sample_agent
            agent_repo_instance.update_status.return_value = disabled_agent
            _MockAgentRepo.return_value = agent_repo_instance

            service = AgentService(mock_db)
            result = service.disable_agent("test_workspace", 1)

            assert result.status == AgentStatus.DISABLED

    def test_disable_already_disabled_fails(self, mock_db, sample_workspace, sample_agent):
        """Test disabling already disabled agent fails."""
        sample_agent.status = AgentStatus.DISABLED

        with (
            patch("app.services.agent_service.AgentRepository") as _MockAgentRepo,
            patch("app.services.agent_service.AgentPrototypeRepository") as _MockProtoRepo,
            patch("app.services.agent_service.AgentPrototypeVersionRepository") as _MockVersionRepo,
            patch("app.services.agent_service.get_workspace_by_code") as mock_get_workspace,
        ):
            mock_get_workspace.return_value = sample_workspace

            agent_repo_instance = MagicMock()
            agent_repo_instance.get_by_id.return_value = sample_agent
            _MockAgentRepo.return_value = agent_repo_instance

            service = AgentService(mock_db)

            with pytest.raises(BusinessException) as exc_info:
                service.disable_agent("test_workspace", 1)

            assert exc_info.value.code == ERR_AGENT_STATUS_NOT_ALLOWED
