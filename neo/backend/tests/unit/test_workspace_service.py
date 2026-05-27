"""Tests for workspace service module."""

import pytest
from sqlalchemy.orm import Session

from app.models import MemberRole, OrgUnitType, User, WorkspaceStatus
from app.repositories import workspace_repository as repo
from app.schemas.workspace import MemberAdd, MemberUpdate, TransferOwnerRequest, WorkspaceCreate, WorkspaceUpdate
from app.services.workspace_service import workspace_service


class TestWorkspaceService:
    """Tests for WorkspaceService."""

    @pytest.fixture
    def root_org(self, db_session: Session):
        """Create a root organization unit."""
        from app.repositories import org_unit_repository as org_repo

        return org_repo.create_org_unit(
            db_session,
            name="测试公司",
            code="TEST_COMPANY",
            type=OrgUnitType.COMPANY,
        )

    @pytest.fixture
    def owner_user(self, db_session: Session):
        """Create an owner user."""
        from app.services.auth_service import hash_password

        user = User(
            phone="13900000001",
            hashed_password=hash_password("password123"),
            username="owner_user",
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user

    @pytest.fixture
    def member_user(self, db_session: Session):
        """Create a member user."""
        from app.services.auth_service import hash_password

        user = User(
            phone="13900000002",
            hashed_password=hash_password("password123"),
            username="member_user",
            is_active=True,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user

    @pytest.fixture
    def workspace(self, db_session: Session, root_org, owner_user):
        """Create a test workspace with owner."""
        workspace, _ = repo.create_workspace(
            db_session,
            name="测试工作空间",
            org_id=root_org.id,
            owner_id=owner_user.id,
            description="测试描述",
        )
        db_session.commit()
        return workspace

    def test_create_workspace(self, db_session: Session, root_org, owner_user):
        """Test creating a workspace via service."""
        data = WorkspaceCreate(
            name="新服务工作空间",
            org_id=root_org.id,
            description="通过服务创建",
        )

        response, code = workspace_service.create_workspace(
            db=db_session,
            data=data,
            owner_id=owner_user.id,
        )

        assert response is not None
        assert response.name == "新服务工作空间"
        assert response.code == code
        assert response.status == WorkspaceStatus.ACTIVE
        assert response.owner_id == owner_user.id

    def test_get_workspace(self, db_session: Session, workspace):
        """Test getting workspace by ID."""
        response = workspace_service.get_workspace(
            db=db_session,
            workspace_id=workspace.id,
        )

        assert response is not None
        assert response.id == workspace.id
        assert response.name == workspace.name
        assert response.member_count == 1  # Owner is a member

    def test_get_workspace_not_found(self, db_session: Session):
        """Test getting non-existent workspace."""
        response = workspace_service.get_workspace(
            db=db_session,
            workspace_id=99999,
        )

        assert response is None

    def test_get_workspace_by_code(self, db_session: Session, workspace):
        """Test getting workspace by code."""
        response = workspace_service.get_workspace_by_code(
            db=db_session,
            code=workspace.code,
        )

        assert response is not None
        assert response.code == workspace.code
        assert response.member_count == 1

    def test_get_workspace_by_code_not_found(self, db_session: Session):
        """Test getting workspace with non-existent code."""
        response = workspace_service.get_workspace_by_code(
            db=db_session,
            code="non_existent",
        )

        assert response is None

    def test_get_workspaces(self, db_session: Session, workspace, root_org):
        """Test getting workspaces list."""
        response = workspace_service.get_workspaces(
            db=db_session,
            org_id=root_org.id,
        )

        assert response.total == 1
        assert len(response.list) == 1
        assert response.list[0].id == workspace.id

    def test_get_workspaces_with_pagination(self, db_session: Session, workspace):
        """Test workspaces pagination."""
        response = workspace_service.get_workspaces(
            db=db_session,
            page=1,
            page_size=10,
        )

        assert response.total == 1
        assert response.page == 1
        assert response.page_size == 10

    def test_get_workspaces_with_search(self, db_session: Session, workspace):
        """Test workspaces search."""
        response = workspace_service.get_workspaces(
            db=db_session,
            search="测试",
        )

        assert response.total == 1

        response = workspace_service.get_workspaces(
            db=db_session,
            search="不存在",
        )

        assert response.total == 0

    def test_get_workspaces_with_status_filter(self, db_session: Session, workspace):
        """Test workspaces status filter."""
        # Active workspaces
        response = workspace_service.get_workspaces(
            db=db_session,
            status=WorkspaceStatus.ACTIVE,
        )
        assert response.total == 1

        # Disabled workspaces
        response = workspace_service.get_workspaces(
            db=db_session,
            status=WorkspaceStatus.DISABLED,
        )
        assert response.total == 0

    def test_get_user_workspaces(self, db_session: Session, workspace, owner_user, member_user):
        """Test getting user's workspaces."""
        # Owner should see the workspace
        response = workspace_service.get_user_workspaces(
            db=db_session,
            user_id=owner_user.id,
        )
        assert response.total == 1

        # Member user without membership should see nothing
        response = workspace_service.get_user_workspaces(
            db=db_session,
            user_id=member_user.id,
        )
        assert response.total == 0

    def test_update_workspace(self, db_session: Session, workspace):
        """Test updating workspace."""
        data = WorkspaceUpdate(
            name="更新后的名称",
            description="更新后的描述",
        )

        response = workspace_service.update_workspace(
            db=db_session,
            workspace_id=workspace.id,
            data=data,
        )

        assert response is not None
        assert response.name == "更新后的名称"
        assert response.description == "更新后的描述"

    def test_update_workspace_not_found(self, db_session: Session):
        """Test updating non-existent workspace."""
        data = WorkspaceUpdate(name="新名称")

        response = workspace_service.update_workspace(
            db=db_session,
            workspace_id=99999,
            data=data,
        )

        assert response is None

    def test_disable_workspace(self, db_session: Session, workspace, owner_user):
        """Test disabling workspace."""
        response = workspace_service.disable_workspace(
            db=db_session,
            workspace_id=workspace.id,
            disabled_by=owner_user.id,
        )

        assert response is not None
        assert response.status == WorkspaceStatus.DISABLED

    def test_enable_workspace(self, db_session: Session, workspace, owner_user):
        """Test enabling workspace."""
        # First disable
        workspace_service.disable_workspace(
            db=db_session,
            workspace_id=workspace.id,
            disabled_by=owner_user.id,
        )

        # Then enable
        response = workspace_service.enable_workspace(
            db=db_session,
            workspace_id=workspace.id,
        )

        assert response is not None
        assert response.status == WorkspaceStatus.ACTIVE

    def test_transfer_ownership(self, db_session: Session, workspace, owner_user, member_user):
        """Test transferring workspace ownership."""
        # Add member first
        repo.add_workspace_member(db_session, workspace.id, member_user.id, MemberRole.MEMBER)
        db_session.commit()

        data = TransferOwnerRequest(new_owner_id=member_user.id)

        response = workspace_service.transfer_ownership(
            db=db_session,
            workspace_id=workspace.id,
            data=data,
        )

        assert response is not None
        assert response.owner_id == member_user.id

    def test_transfer_ownership_user_not_found(self, db_session: Session, workspace):
        """Test transferring ownership to non-existent user."""
        data = TransferOwnerRequest(new_owner_id=99999)

        response = workspace_service.transfer_ownership(
            db=db_session,
            workspace_id=workspace.id,
            data=data,
        )

        assert response is None

    # ==================== Member Operations ====================

    def test_get_members(self, db_session: Session, workspace, owner_user, member_user):
        """Test getting workspace members."""
        # Add a member
        repo.add_workspace_member(db_session, workspace.id, member_user.id, MemberRole.MEMBER)
        db_session.commit()

        response = workspace_service.get_members(
            db=db_session,
            workspace_id=workspace.id,
        )

        assert response.total == 2
        assert len(response.list) == 2

    def test_get_members_with_role_filter(self, db_session: Session, workspace, owner_user, member_user):
        """Test getting workspace members filtered by role."""
        # Add a member
        repo.add_workspace_member(db_session, workspace.id, member_user.id, MemberRole.MEMBER)
        db_session.commit()

        response = workspace_service.get_members(
            db=db_session,
            workspace_id=workspace.id,
            role=MemberRole.OWNER,
        )

        assert response.total == 1
        assert response.list[0].role == MemberRole.OWNER

    def test_get_members_pagination(self, db_session: Session, workspace, owner_user, member_user):
        """Test getting workspace members with pagination."""
        # Add a member
        repo.add_workspace_member(db_session, workspace.id, member_user.id, MemberRole.MEMBER)
        db_session.commit()

        response = workspace_service.get_members(
            db=db_session,
            workspace_id=workspace.id,
            page=1,
            page_size=1,
        )

        assert response.total == 2
        assert len(response.list) == 1

    def test_add_member(self, db_session: Session, workspace, member_user):
        """Test adding a member to workspace."""
        data = MemberAdd(user_id=member_user.id, role=MemberRole.MEMBER)

        response = workspace_service.add_member(
            db=db_session,
            workspace_id=workspace.id,
            data=data,
        )
        db_session.flush()  # Flush to ensure the member is persisted and has id

        assert response is not None
        assert response.user_id == member_user.id
        assert response.role == MemberRole.MEMBER
        assert response.id is not None

    def test_add_member_user_not_found(self, db_session: Session, workspace):
        """Test adding non-existent user as member."""
        data = MemberAdd(user_id=99999, role=MemberRole.MEMBER)

        response = workspace_service.add_member(
            db=db_session,
            workspace_id=workspace.id,
            data=data,
        )

        assert response is None

    def test_add_member_already_member(self, db_session: Session, workspace, owner_user):
        """Test adding owner who is already a member."""
        data = MemberAdd(user_id=owner_user.id, role=MemberRole.ADMIN)

        response = workspace_service.add_member(
            db=db_session,
            workspace_id=workspace.id,
            data=data,
        )

        assert response is None  # Already a member

    def test_update_member_role(self, db_session: Session, workspace, member_user):
        """Test updating member role."""
        # Add member first
        repo.add_workspace_member(db_session, workspace.id, member_user.id, MemberRole.MEMBER)
        db_session.commit()

        # Get the member
        member = repo.get_member_by_workspace_and_user(db_session, workspace.id, member_user.id)
        assert member is not None

        # Update role
        data = MemberUpdate(role=MemberRole.ADMIN)
        response = workspace_service.update_member_role(
            db=db_session,
            workspace_id=workspace.id,
            member_id=member.id,
            data=data,
        )

        assert response is not None
        assert response.role == MemberRole.ADMIN

    def test_update_member_role_owner_not_allowed(self, db_session: Session, workspace, owner_user):
        """Test that owner role cannot be changed."""
        member = repo.get_member_by_workspace_and_user(db_session, workspace.id, owner_user.id)

        data = MemberUpdate(role=MemberRole.ADMIN)
        response = workspace_service.update_member_role(
            db=db_session,
            workspace_id=workspace.id,
            member_id=member.id,
            data=data,
        )

        assert response is None

    def test_remove_member(self, db_session: Session, workspace, member_user):
        """Test removing a member from workspace."""
        # Add member first
        repo.add_workspace_member(db_session, workspace.id, member_user.id, MemberRole.MEMBER)
        db_session.commit()

        # Get the member
        member = repo.get_member_by_workspace_and_user(db_session, workspace.id, member_user.id)
        assert member is not None

        # Remove member
        result = workspace_service.remove_member(
            db=db_session,
            workspace_id=workspace.id,
            member_id=member.id,
        )

        assert result is True

    def test_remove_member_owner_not_allowed(self, db_session: Session, workspace, owner_user):
        """Test that owner cannot be removed."""
        member = repo.get_member_by_workspace_and_user(db_session, workspace.id, owner_user.id)

        result = workspace_service.remove_member(
            db=db_session,
            workspace_id=workspace.id,
            member_id=member.id,
        )

        assert result is False

    def test_remove_member_wrong_workspace(self, db_session: Session, workspace, member_user, root_org):
        """Test removing member from wrong workspace."""
        # Add member first
        repo.add_workspace_member(db_session, workspace.id, member_user.id, MemberRole.MEMBER)
        db_session.commit()

        # Get the member
        member = repo.get_member_by_workspace_and_user(db_session, workspace.id, member_user.id)

        # Try to remove from different workspace
        # Create another workspace
        workspace2, _ = repo.create_workspace(
            db_session,
            name="第二个工作空间",
            org_id=root_org.id,
            owner_id=member_user.id,
        )
        db_session.commit()

        result = workspace_service.remove_member(
            db=db_session,
            workspace_id=workspace2.id,  # Different workspace
            member_id=member.id,
        )

        assert result is False

    def test_get_member_role(self, db_session: Session, workspace, owner_user, member_user):
        """Test getting member role."""
        # Owner should have OWNER role
        role = workspace_service.get_member_role(
            db=db_session,
            workspace_id=workspace.id,
            user_id=owner_user.id,
        )
        assert role == MemberRole.OWNER

        # Add member and check role
        repo.add_workspace_member(db_session, workspace.id, member_user.id, MemberRole.MEMBER)
        db_session.commit()

        role = workspace_service.get_member_role(
            db=db_session,
            workspace_id=workspace.id,
            user_id=member_user.id,
        )
        assert role == MemberRole.MEMBER

        # Non-member should return None
        from app.services.auth_service import hash_password

        outsider = User(
            phone="13900000005",
            hashed_password=hash_password("password123"),
            username="outsider",
            is_active=True,
        )
        db_session.add(outsider)
        db_session.commit()

        role = workspace_service.get_member_role(
            db=db_session,
            workspace_id=workspace.id,
            user_id=outsider.id,
        )
        assert role is None

    def test_is_owner(self, db_session: Session, workspace, owner_user, member_user):
        """Test checking if user is owner."""
        assert (
            workspace_service.is_owner(
                db=db_session,
                workspace_id=workspace.id,
                user_id=owner_user.id,
            )
            is True
        )

        assert (
            workspace_service.is_owner(
                db=db_session,
                workspace_id=workspace.id,
                user_id=member_user.id,
            )
            is False
        )

    def test_is_member(self, db_session: Session, workspace, owner_user, member_user):
        """Test checking if user is member."""
        # Owner is a member
        assert (
            workspace_service.is_member(
                db=db_session,
                workspace_id=workspace.id,
                user_id=owner_user.id,
            )
            is True
        )

        # Non-member
        assert (
            workspace_service.is_member(
                db=db_session,
                workspace_id=workspace.id,
                user_id=member_user.id,
            )
            is False
        )

        # Add member and check again
        repo.add_workspace_member(db_session, workspace.id, member_user.id, MemberRole.MEMBER)
        db_session.commit()

        assert (
            workspace_service.is_member(
                db=db_session,
                workspace_id=workspace.id,
                user_id=member_user.id,
            )
            is True
        )

    def test_get_members_with_user_info(self, db_session: Session, workspace, owner_user, member_user):
        """Test that member list includes user info."""
        # Add member
        repo.add_workspace_member(db_session, workspace.id, member_user.id, MemberRole.MEMBER)
        db_session.commit()

        response = workspace_service.get_members(
            db=db_session,
            workspace_id=workspace.id,
        )

        # Check that user info is included
        for member in response.list:
            if member.user_id == owner_user.id:
                assert member.username == "owner_user"
                assert member.phone == "13900000001"
            elif member.user_id == member_user.id:
                assert member.username == "member_user"
                assert member.phone == "13900000002"
