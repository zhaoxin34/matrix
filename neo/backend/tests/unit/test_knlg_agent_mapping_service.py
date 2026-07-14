"""Unit tests for KnlgAgentMappingService.

Uses real SQLite-backed session (via existing conftest fixtures) so we can
exercise UNIQUE/PK constraint + transaction semantics end-to-end.
"""

import pytest
from sqlalchemy.orm import Session

from app.core.exceptions import BusinessException, ErrorCode
from app.models.agent import Agent, AgentStatus
from app.models.agent_prototype import AgentPrototype
from app.models.agent_prototype import AgentStatus as PrototypeStatus
from app.services.knlg_agent_mapping_service import KnlgAgentMappingService

# ==================== Fixtures ====================


@pytest.fixture
def agent_prototype(db_session: Session):
    prototype = AgentPrototype(
        name="svc-test-prototype",
        code="svc_test_pt",
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
        name="svc-test-agent",
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
def service(db_session: Session):
    return KnlgAgentMappingService(db_session)


# ==================== Tests ====================


class TestListMappings:
    def test_list_empty(self, service, test_workspace):
        items, total = service.list_mappings(test_workspace.id)
        assert items == []
        assert total == 0

    def test_list_with_results(self, service, test_workspace, test_agent):
        service.create_mapping(
            workspace_id=test_workspace.id,
            type="expert_interview",
            agent_id=test_agent.id,
        )
        items, total = service.list_mappings(test_workspace.id)
        assert total == 1
        assert items[0].type == "expert_interview"


class TestGetMapping:
    def test_get_existing(self, service, test_workspace, test_agent):
        service.create_mapping(
            workspace_id=test_workspace.id,
            type="expert_interview",
            agent_id=test_agent.id,
        )
        found = service.get_mapping(test_workspace.id, "expert_interview")
        assert found.type == "expert_interview"
        assert found.workspace_id == test_workspace.id

    def test_get_missing_raises_404(self, service, test_workspace):
        with pytest.raises(BusinessException) as exc_info:
            service.get_mapping(test_workspace.id, "nonexistent")
        assert exc_info.value.code == ErrorCode.NOT_FOUND


class TestCreateMapping:
    def test_create_success(self, service, test_workspace, test_agent):
        mapping = service.create_mapping(
            workspace_id=test_workspace.id,
            type="expert_interview",
            agent_id=test_agent.id,
        )
        assert mapping.workspace_id == test_workspace.id
        assert mapping.type == "expert_interview"

    def test_create_duplicate_type_raises_409(self, service, test_workspace, test_agent):
        service.create_mapping(
            workspace_id=test_workspace.id,
            type="expert_interview",
            agent_id=test_agent.id,
        )
        with pytest.raises(BusinessException) as exc_info:
            service.create_mapping(
                workspace_id=test_workspace.id,
                type="expert_interview",
                agent_id=test_agent.id,
            )
        assert exc_info.value.code == ErrorCode.CONFLICT

    def test_create_with_nonexistent_agent_raises_404(self, service, test_workspace):
        with pytest.raises(BusinessException) as exc_info:
            service.create_mapping(
                workspace_id=test_workspace.id,
                type="expert_interview",
                agent_id=99999,
            )
        assert exc_info.value.code == ErrorCode.NOT_FOUND

    def test_create_with_cross_workspace_agent_raises_404(
        self, service, test_workspace, test_user, agent_prototype, db_session, test_org_unit
    ):
        from app.models import MemberRole, Workspace, WorkspaceMember, WorkspaceStatus

        workspace_b = Workspace(
            name="Other WS",
            code="other_ws",
            status=WorkspaceStatus.ACTIVE,
            org_id=test_org_unit.id,
            owner_id=test_user.id,
        )
        db_session.add(workspace_b)
        db_session.flush()
        db_session.add(
            WorkspaceMember(
                workspace_id=workspace_b.id,
                user_id=test_user.id,
                role=MemberRole.OWNER,
            )
        )
        db_session.commit()

        other_agent = Agent(
            name="other-ws-agent",
            prototype_id=agent_prototype.id,
            prototype_version="1.0.0",
            workspace_id=workspace_b.id,
            model="gpt-4",
            skills=[],
            config={},
            status=AgentStatus.ENABLED,
            created_by=test_user.id,
        )
        db_session.add(other_agent)
        db_session.commit()
        db_session.refresh(other_agent)

        with pytest.raises(BusinessException) as exc_info:
            service.create_mapping(
                workspace_id=test_workspace.id,
                type="expert_interview",
                agent_id=other_agent.id,
            )
        assert exc_info.value.code == ErrorCode.NOT_FOUND

    def test_create_with_deleted_agent_raises_404(self, service, db_session, test_workspace, test_agent):
        db_session.refresh(test_agent)
        test_agent.status = AgentStatus.DELETED
        db_session.commit()
        db_session.refresh(test_agent)

        with pytest.raises(BusinessException) as exc_info:
            service.create_mapping(
                workspace_id=test_workspace.id,
                type="expert_interview",
                agent_id=test_agent.id,
            )
        assert exc_info.value.code == ErrorCode.NOT_FOUND


class TestUpdateMapping:
    def test_update_success(self, service, test_workspace, test_agent, db_session, test_user, agent_prototype):
        service.create_mapping(
            workspace_id=test_workspace.id,
            type="expert_interview",
            agent_id=test_agent.id,
        )
        new_agent = Agent(
            name="new-agent",
            prototype_id=agent_prototype.id,
            prototype_version="1.0.0",
            workspace_id=test_workspace.id,
            model="gpt-4",
            skills=[],
            config={},
            status=AgentStatus.ENABLED,
            created_by=test_user.id,
        )
        db_session.add(new_agent)
        db_session.commit()
        db_session.refresh(new_agent)

        updated = service.update_mapping_agent(
            workspace_id=test_workspace.id,
            type="expert_interview",
            new_agent_id=new_agent.id,
        )
        assert updated.agent_id == new_agent.id

    def test_update_nonexistent_raises_404(self, service, test_workspace):
        with pytest.raises(BusinessException) as exc_info:
            service.update_mapping_agent(
                workspace_id=test_workspace.id,
                type="nonexistent",
                new_agent_id=1,
            )
        assert exc_info.value.code == ErrorCode.NOT_FOUND

    def test_update_with_cross_workspace_agent_raises_404(
        self, service, test_workspace, test_agent, db_session, test_user, agent_prototype, test_org_unit
    ):
        from app.models import MemberRole, Workspace, WorkspaceMember, WorkspaceStatus

        workspace_b = Workspace(
            name="WS B",
            code="ws_b",
            status=WorkspaceStatus.ACTIVE,
            org_id=test_org_unit.id,
            owner_id=test_user.id,
        )
        db_session.add(workspace_b)
        db_session.flush()
        db_session.add(
            WorkspaceMember(
                workspace_id=workspace_b.id,
                user_id=test_user.id,
                role=MemberRole.OWNER,
            )
        )
        db_session.commit()

        other_agent = Agent(
            name="other",
            prototype_id=agent_prototype.id,
            prototype_version="1.0.0",
            workspace_id=workspace_b.id,
            model="gpt-4",
            skills=[],
            config={},
            status=AgentStatus.ENABLED,
            created_by=test_user.id,
        )
        db_session.add(other_agent)
        db_session.commit()
        db_session.refresh(other_agent)

        service.create_mapping(
            workspace_id=test_workspace.id,
            type="expert_interview",
            agent_id=test_agent.id,
        )

        with pytest.raises(BusinessException) as exc_info:
            service.update_mapping_agent(
                workspace_id=test_workspace.id,
                type="expert_interview",
                new_agent_id=other_agent.id,
            )
        assert exc_info.value.code == ErrorCode.NOT_FOUND


class TestDeleteMapping:
    def test_delete_success(self, service, test_workspace, test_agent):
        service.create_mapping(
            workspace_id=test_workspace.id,
            type="expert_interview",
            agent_id=test_agent.id,
        )
        service.delete_mapping(test_workspace.id, "expert_interview")
        with pytest.raises(BusinessException) as exc_info:
            service.get_mapping(test_workspace.id, "expert_interview")
        assert exc_info.value.code == ErrorCode.NOT_FOUND

    def test_delete_nonexistent_raises_404(self, service, test_workspace):
        with pytest.raises(BusinessException) as exc_info:
            service.delete_mapping(test_workspace.id, "nonexistent")
        assert exc_info.value.code == ErrorCode.NOT_FOUND
