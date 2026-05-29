"""Unit tests for AgentRepository."""

import pytest
from sqlalchemy.orm import Session

from app.models.agent import Agent, AgentStatus
from app.models.agent_prototype import AgentPrototype
from app.models.agent_prototype import AgentStatus as PrototypeStatus
from app.repositories.agent_repository import AgentRepository


@pytest.fixture
def agent_prototype(db_session: Session):
    """Create a test agent prototype."""
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
    db_session.commit()
    db_session.refresh(prototype)
    return prototype


@pytest.fixture
def agent_repo(db_session: Session):
    """Create AgentRepository instance."""
    return AgentRepository(db_session)


@pytest.fixture
def test_agent(db_session: Session, test_workspace, agent_prototype, test_user):
    """Create a test agent."""
    agent = Agent(
        name="test-agent",
        description="Test agent description",
        prototype_id=agent_prototype.id,
        prototype_version="1.0.0",
        workspace_id=test_workspace.id,
        model="gpt-4",
        skills=["faq", "ticket"],
        config={"temperature": 0.7, "max_tokens": 4096},
        status=AgentStatus.ENABLED,
        created_by=test_user.id,
    )
    db_session.add(agent)
    db_session.commit()
    db_session.refresh(agent)
    return agent


class TestAgentRepositoryCreate:
    """Tests for AgentRepository.create()."""

    def test_create_agent(self, agent_repo, test_workspace, agent_prototype, test_user):
        """Test creating a new agent."""
        agent = Agent(
            name="new-agent",
            description="New agent",
            prototype_id=agent_prototype.id,
            prototype_version="1.0.0",
            workspace_id=test_workspace.id,
            model="gpt-4",
            skills=["faq"],
            config={},
            status=AgentStatus.ENABLED,
            created_by=test_user.id,
        )

        result = agent_repo.create(agent)

        assert result.id is not None
        assert result.name == "new-agent"
        assert result.status == AgentStatus.ENABLED

    def test_create_agent_with_skills(self, agent_repo, test_workspace, agent_prototype, test_user):
        """Test creating agent with skills."""
        agent = Agent(
            name="agent-with-skills",
            prototype_id=agent_prototype.id,
            prototype_version="1.0.0",
            workspace_id=test_workspace.id,
            model="gpt-4",
            skills=["faq", "ticket", "crm"],
            config={},
            status=AgentStatus.ENABLED,
            created_by=test_user.id,
        )

        result = agent_repo.create(agent)

        assert result.skills == ["faq", "ticket", "crm"]


class TestAgentRepositoryGet:
    """Tests for AgentRepository.get_by_id() and get_by_name()."""

    def test_get_by_id(self, agent_repo, test_agent):
        """Test getting agent by ID."""
        result = agent_repo.get_by_id(test_agent.id)

        assert result is not None
        assert result.id == test_agent.id
        assert result.name == test_agent.name

    def test_get_by_id_not_found(self, agent_repo):
        """Test getting non-existent agent."""
        result = agent_repo.get_by_id(9999)

        assert result is None

    def test_get_by_name(self, agent_repo, test_agent, test_workspace):
        """Test getting agent by name and workspace."""
        result = agent_repo.get_by_name(test_workspace.id, "test-agent")

        assert result is not None
        assert result.name == "test-agent"

    def test_get_by_name_not_found(self, agent_repo, test_workspace):
        """Test getting non-existent agent by name."""
        result = agent_repo.get_by_name(test_workspace.id, "non-existent")

        assert result is None


class TestAgentRepositoryList:
    """Tests for AgentRepository.list_agents()."""

    def test_list_agents_empty(self, agent_repo, test_workspace):
        """Test listing agents when none exist."""
        agents, total = agent_repo.list_agents(workspace_id=test_workspace.id)

        assert total == 0
        assert agents == []

    def test_list_agents_with_data(self, agent_repo, test_workspace, test_agent):
        """Test listing agents with data."""
        agents, total = agent_repo.list_agents(workspace_id=test_workspace.id)

        assert total == 1
        assert len(agents) == 1
        assert agents[0].name == test_agent.name

    def test_list_agents_excludes_deleted(
        self, agent_repo, test_workspace, test_agent, test_user, agent_prototype, db_session
    ):
        """Test that deleted agents are excluded by default."""
        # Create a deleted agent
        deleted_agent = Agent(
            name="deleted-agent",
            prototype_id=agent_prototype.id,
            prototype_version="1.0.0",
            workspace_id=test_workspace.id,
            model="gpt-4",
            skills=[],
            config={},
            status=AgentStatus.DELETED,
            created_by=test_user.id,
        )
        db_session.add(deleted_agent)
        db_session.commit()

        agents, total = agent_repo.list_agents(workspace_id=test_workspace.id)

        assert total == 1
        assert all(a.status != AgentStatus.DELETED for a in agents)

    def test_list_agents_filter_by_status(
        self, agent_repo, test_workspace, test_agent, test_user, agent_prototype, db_session
    ):
        """Test filtering agents by status."""
        # Create a disabled agent
        disabled_agent = Agent(
            name="disabled-agent",
            prototype_id=agent_prototype.id,
            prototype_version="1.0.0",
            workspace_id=test_workspace.id,
            model="gpt-4",
            skills=[],
            config={},
            status=AgentStatus.DISABLED,
            created_by=test_user.id,
        )
        db_session.add(disabled_agent)
        db_session.commit()

        agents, total = agent_repo.list_agents(
            workspace_id=test_workspace.id,
            status=AgentStatus.DISABLED.value,
        )

        assert total == 1
        assert agents[0].name == "disabled-agent"

    def test_list_agents_filter_by_prototype(
        self, agent_repo, test_workspace, test_agent, db_session, test_user, agent_prototype
    ):
        """Test filtering agents by prototype."""
        agents, total = agent_repo.list_agents(
            workspace_id=test_workspace.id,
            prototype_id=agent_prototype.id,
        )

        assert total == 1
        assert agents[0].prototype_id == agent_prototype.id

    def test_list_agents_search(self, agent_repo, test_workspace, test_agent):
        """Test searching agents."""
        agents, total = agent_repo.list_agents(
            workspace_id=test_workspace.id,
            search="test",
        )

        assert total == 1
        assert "test" in agents[0].name.lower()

    def test_list_agents_pagination(
        self, agent_repo, test_workspace, test_agent, test_user, agent_prototype, db_session
    ):
        """Test pagination."""
        # Create more agents
        for i in range(5):
            agent = Agent(
                name=f"agent-{i}",
                prototype_id=agent_prototype.id,
                prototype_version="1.0.0",
                workspace_id=test_workspace.id,
                model="gpt-4",
                skills=[],
                config={},
                status=AgentStatus.ENABLED,
                created_by=test_user.id,
            )
            db_session.add(agent)
        db_session.commit()

        # Get page 1
        agents, total = agent_repo.list_agents(
            workspace_id=test_workspace.id,
            page=1,
            page_size=3,
        )

        assert total == 6
        assert len(agents) == 3

        # Get page 2
        agents, total = agent_repo.list_agents(
            workspace_id=test_workspace.id,
            page=2,
            page_size=3,
        )

        assert len(agents) == 3


class TestAgentRepositoryUpdate:
    """Tests for AgentRepository.update()."""

    def test_update_agent(self, agent_repo, test_agent):
        """Test updating agent fields."""
        result = agent_repo.update(test_agent, {"description": "Updated description"})

        assert result.description == "Updated description"

    def test_update_agent_status(self, agent_repo, test_agent):
        """Test updating agent status."""
        result = agent_repo.update_status(test_agent, AgentStatus.DISABLED.value)

        assert result.status == AgentStatus.DISABLED

    def test_update_forbidden_fields_ignored(self, agent_repo, test_agent):
        """Test that forbidden fields are not updated."""
        original_prototype_id = test_agent.prototype_id

        agent_repo.update(
            test_agent,
            {
                "prototype_id": 999,
                "id": 999,
                "created_by": 999,
            },
        )

        assert test_agent.prototype_id == original_prototype_id


class TestAgentRepositoryExists:
    """Tests for AgentRepository.exists_in_workspace()."""

    def test_exists_true(self, agent_repo, test_workspace, test_agent):
        """Test exists returns True for existing agent."""
        assert agent_repo.exists_in_workspace(test_workspace.id, "test-agent") is True

    def test_exists_false(self, agent_repo, test_workspace):
        """Test exists returns False for non-existing agent."""
        assert agent_repo.exists_in_workspace(test_workspace.id, "non-existent") is False

    def test_exists_exclude_self(self, agent_repo, test_workspace, test_agent):
        """Test exists with exclude_id parameter."""
        # Should return False when excluding the agent itself
        assert (
            agent_repo.exists_in_workspace(
                test_workspace.id,
                "test-agent",
                exclude_id=test_agent.id,
            )
            is False
        )

        # Should return True when not excluding
        assert (
            agent_repo.exists_in_workspace(
                test_workspace.id,
                "test-agent",
            )
            is True
        )


class TestAgentRepositorySoftDelete:
    """Tests for AgentRepository.soft_delete()."""

    def test_soft_delete(self, agent_repo, test_agent):
        """Test soft deleting an agent."""
        result = agent_repo.soft_delete(test_agent)

        assert result.status == AgentStatus.DELETED
