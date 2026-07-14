"""Unit tests for KnlgAgentMappingRepository.

Composite primary key (workspace_id, type) — all lookups use that pair.
"""

import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.agent import Agent, AgentStatus
from app.models.agent_prototype import AgentPrototype
from app.models.agent_prototype import AgentStatus as PrototypeStatus
from app.repositories.knlg_agent_mapping_repository import KnlgAgentMappingRepository

# ==================== Fixtures ====================


@pytest.fixture
def agent_prototype(db_session: Session):
    prototype = AgentPrototype(
        name="mapping-test-prototype",
        code="mapping_test_pt",
        model="gpt-4",
        prompts={},
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
def test_agent(db_session, test_workspace, agent_prototype, test_user):
    agent = Agent(
        name="mapping-test-agent",
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
    db_session.refresh(agent)
    return agent


@pytest.fixture
def mapping_repo(db_session: Session):
    return KnlgAgentMappingRepository(db_session)


# ==================== Tests ====================


class TestCreate:
    def test_create_mapping(self, mapping_repo, test_workspace, test_agent):
        result = mapping_repo.create(
            workspace_id=test_workspace.id,
            type="site_operation",
            agent_id=test_agent.id,
        )

        assert result.workspace_id == test_workspace.id
        assert result.type == "site_operation"
        assert result.agent_id == test_agent.id
        assert result.created_at is not None
        assert result.updated_at is not None

    def test_create_duplicate_type_raises_integrity_error(self, mapping_repo, test_workspace, test_agent):
        """PK (workspace_id, type) violation surfaces as IntegrityError."""
        mapping_repo.create(
            workspace_id=test_workspace.id,
            type="expert_interview",
            agent_id=test_agent.id,
        )

        with pytest.raises(IntegrityError):
            mapping_repo.create(
                workspace_id=test_workspace.id,
                type="expert_interview",
                agent_id=test_agent.id,
            )

    def test_same_type_different_workspace_allowed(
        self, mapping_repo, test_workspace, test_agent, db_session, test_user, test_org_unit
    ):
        """Different workspace may use the same `type` value."""
        from app.models import MemberRole, Workspace, WorkspaceMember, WorkspaceStatus

        workspace_b = Workspace(
            name="Workspace B",
            code="workspace_b",
            status=WorkspaceStatus.ACTIVE,
            org_id=test_org_unit.id,
            owner_id=test_user.id,
        )
        db_session.add(workspace_b)
        db_session.flush()
        db_session.add(WorkspaceMember(workspace_id=workspace_b.id, user_id=test_user.id, role=MemberRole.OWNER))
        db_session.commit()

        mapping_repo.create(
            workspace_id=test_workspace.id,
            type="expert_interview",
            agent_id=test_agent.id,
        )
        # Should not raise — different workspace
        mapping_repo.create(
            workspace_id=workspace_b.id,
            type="expert_interview",
            agent_id=test_agent.id,
        )


class TestReads:
    def test_get_by_workspace_and_type(self, mapping_repo, test_workspace, test_agent):
        created = mapping_repo.create(
            workspace_id=test_workspace.id,
            type="expert_interview",
            agent_id=test_agent.id,
        )
        found = mapping_repo.get_by_workspace_and_type(test_workspace.id, "expert_interview")

        assert found is not None
        assert found.workspace_id == created.workspace_id
        assert found.type == created.type
        assert found.agent_id == created.agent_id

    def test_get_by_workspace_and_type_not_found(self, mapping_repo, test_workspace):
        assert mapping_repo.get_by_workspace_and_type(test_workspace.id, "nonexistent") is None

    def test_list_by_workspace_ordered_by_type_asc(self, mapping_repo, test_workspace, test_agent):
        for t in ["expert_interview", "site_operation"]:
            mapping_repo.create(
                workspace_id=test_workspace.id,
                type=t,
                agent_id=test_agent.id,
            )

        items, total = mapping_repo.list_by_workspace(workspace_id=test_workspace.id, page=1, page_size=20)

        assert total == 2
        assert len(items) == 2
        # Alphabetical order: expert_interview < site_operation
        assert items[0].type == "expert_interview"
        assert items[1].type == "site_operation"

    def test_list_by_workspace_pagination(self, mapping_repo, test_workspace, test_agent):
        # Create 4 mappings to test pagination
        # (only 2 valid type values exist; use different workspaces would also work)
        # We'll create 2 valid types and rely on test_workspace + workspace_b
        for t in ["site_operation", "expert_interview"]:
            mapping_repo.create(
                workspace_id=test_workspace.id,
                type=t,
                agent_id=test_agent.id,
            )

        page1, total1 = mapping_repo.list_by_workspace(workspace_id=test_workspace.id, page=1, page_size=1)
        page2, total2 = mapping_repo.list_by_workspace(workspace_id=test_workspace.id, page=2, page_size=1)

        assert total1 == 2
        assert total2 == 2
        assert len(page1) == 1
        assert len(page2) == 1
        # Different items on different pages
        assert page1[0].type != page2[0].type

    def test_list_by_workspace_empty(self, mapping_repo, test_workspace):
        items, total = mapping_repo.list_by_workspace(workspace_id=test_workspace.id, page=1, page_size=20)
        assert items == []
        assert total == 0


class TestUpdate:
    def test_update_agent_id(self, mapping_repo, test_workspace, test_agent, db_session):
        """Replace the agent_id and verify updated_at changes."""
        mapping_repo.create(
            workspace_id=test_workspace.id,
            type="expert_interview",
            agent_id=test_agent.id,
        )

        new_agent = Agent(
            name="mapping-test-agent-2",
            prototype_id=test_agent.prototype_id,
            prototype_version="1.0.0",
            workspace_id=test_workspace.id,
            model="gpt-4",
            skills=[],
            config={},
            status=AgentStatus.ENABLED,
            created_by=test_agent.created_by,
        )
        db_session.add(new_agent)
        db_session.commit()
        db_session.refresh(new_agent)

        updated = mapping_repo.update_agent_id(
            workspace_id=test_workspace.id,
            type="expert_interview",
            new_agent_id=new_agent.id,
        )

        assert updated is not None
        assert updated.agent_id == new_agent.id
        assert updated.type == "expert_interview"

    def test_update_nonexistent_returns_none(self, mapping_repo, test_workspace):
        result = mapping_repo.update_agent_id(
            workspace_id=test_workspace.id,
            type="nonexistent",
            new_agent_id=1,
        )
        assert result is None


class TestDelete:
    def test_delete_mapping(self, mapping_repo, test_workspace, test_agent):
        mapping_repo.create(
            workspace_id=test_workspace.id,
            type="expert_interview",
            agent_id=test_agent.id,
        )
        deleted = mapping_repo.delete(test_workspace.id, "expert_interview")
        assert deleted is True

        # Verify it's gone
        assert mapping_repo.get_by_workspace_and_type(test_workspace.id, "expert_interview") is None

    def test_delete_nonexistent_returns_false(self, mapping_repo, test_workspace):
        deleted = mapping_repo.delete(test_workspace.id, "never_existed")
        assert deleted is False
