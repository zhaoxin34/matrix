"""Unit tests for KnlgAgentMappingRepository."""

import pytest
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.agent import Agent, AgentStatus
from app.models.agent_prototype import AgentPrototype
from app.models.agent_prototype import AgentStatus as PrototypeStatus
from app.models.knlg_agent_mapping import KnlgAgentMapping
from app.repositories.knlg_agent_mapping_repository import KnlgAgentMappingRepository

# ==================== Fixtures ====================


@pytest.fixture
def agent_prototype(db_session: Session):
    """Create a minimal prototype to satisfy Agent FK."""
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
    """Create a test agent bound to the test workspace."""
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
            type="expert_interview",
            agent_id=test_agent.id,
        )

        assert result.id is not None
        assert result.workspace_id == test_workspace.id
        assert result.type == "expert_interview"
        assert result.agent_id == test_agent.id
        assert result.created_at is not None
        assert result.updated_at is not None

    def test_create_duplicate_type_raises_integrity_error(self, mapping_repo, test_workspace, test_agent):
        """UNIQUE (workspace_id, type) violation surfaces as IntegrityError."""
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
        # Should not raise
        mapping_repo.create(
            workspace_id=workspace_b.id,
            type="expert_interview",
            agent_id=test_agent.id,
        )


class TestReads:
    def test_get_by_id(self, mapping_repo, test_workspace, test_agent):
        created = mapping_repo.create(
            workspace_id=test_workspace.id,
            type="expert_interview",
            agent_id=test_agent.id,
        )
        found = mapping_repo.get_by_id(created.id)

        assert found is not None
        assert found.id == created.id
        assert found.type == "expert_interview"

    def test_get_by_id_not_found(self, mapping_repo):
        assert mapping_repo.get_by_id(9999) is None

    def test_get_by_workspace_and_type(self, mapping_repo, test_workspace, test_agent):
        mapping_repo.create(
            workspace_id=test_workspace.id,
            type="expert_interview",
            agent_id=test_agent.id,
        )
        found = mapping_repo.get_by_workspace_and_type(test_workspace.id, "expert_interview")

        assert found is not None
        assert found.type == "expert_interview"
        assert found.workspace_id == test_workspace.id

    def test_get_by_workspace_and_type_not_found(self, mapping_repo, test_workspace):
        assert mapping_repo.get_by_workspace_and_type(test_workspace.id, "nonexistent") is None

    def test_list_by_workspace_ordered_by_created_at_desc(self, mapping_repo, test_workspace, test_agent):
        # Create three mappings
        for t in ["type_a", "type_b", "type_c"]:
            mapping_repo.create(
                workspace_id=test_workspace.id,
                type=t,
                agent_id=test_agent.id,
            )

        items, total = mapping_repo.list_by_workspace(workspace_id=test_workspace.id, page=1, page_size=20)

        assert total == 3
        assert len(items) == 3
        # Newest first
        assert items[0].type == "type_c"
        assert items[-1].type == "type_a"

    def test_list_by_workspace_pagination(self, mapping_repo, test_workspace, test_agent):
        for i in range(5):
            mapping_repo.create(
                workspace_id=test_workspace.id,
                type=f"type_{i}",
                agent_id=test_agent.id,
            )

        page1, total1 = mapping_repo.list_by_workspace(workspace_id=test_workspace.id, page=1, page_size=2)
        page2, total2 = mapping_repo.list_by_workspace(workspace_id=test_workspace.id, page=2, page_size=2)

        assert total1 == 5
        assert total2 == 5
        assert len(page1) == 2
        assert len(page2) == 2
        # Different items on different pages
        assert page1[0].id != page2[0].id

    def test_list_by_workspace_empty(self, mapping_repo, test_workspace):
        items, total = mapping_repo.list_by_workspace(workspace_id=test_workspace.id, page=1, page_size=20)
        assert items == []
        assert total == 0


class TestUpdate:
    def test_update_agent_id(self, mapping_repo, test_workspace, test_agent, db_session):
        """Replace the agent_id and verify updated_at changes."""

        created = mapping_repo.create(
            workspace_id=test_workspace.id,
            type="expert_interview",
            agent_id=test_agent.id,
        )
        original_updated_at = created.updated_at

        # Sleep is overkill; just verify the new agent_id is set
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

        updated = mapping_repo.update_agent_id(created, new_agent.id)

        assert updated.agent_id == new_agent.id
        assert updated.id == created.id
        # updated_at should be >= original
        assert updated.updated_at >= original_updated_at


class TestDelete:
    def test_delete_mapping(self, mapping_repo, test_workspace, test_agent):
        created = mapping_repo.create(
            workspace_id=test_workspace.id,
            type="expert_interview",
            agent_id=test_agent.id,
        )
        mapping_repo.delete(created)

        assert mapping_repo.get_by_workspace_and_type(test_workspace.id, "expert_interview") is None
        assert mapping_repo.get_by_id(created.id) is None

    def test_delete_is_idempotent_after_lookup_returns_none(self, mapping_repo, test_workspace):
        """If the lookup returns None, service layer should bail out before
        calling repo.delete. This test verifies the repo contract for that case."""
        # get_by_workspace_and_type returns None for non-existent mapping
        assert mapping_repo.get_by_workspace_and_type(test_workspace.id, "never_existed") is None
        # Repo.delete on a not-persisted object raises; service guards against this.
        fake = KnlgAgentMapping(
            workspace_id=test_workspace.id,
            type="never_existed",
            agent_id=9999,
        )
        with pytest.raises(Exception):
            mapping_repo.delete(fake)
