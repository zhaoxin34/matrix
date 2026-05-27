"""Tests for workspace repository module."""

import pytest
from sqlalchemy.orm import Session

from app.models import MemberRole, OrgUnitType, WorkspaceStatus
from app.repositories import workspace_repository as repo


class TestWorkspaceRepository:
    """Tests for WorkspaceRepository."""

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
        from app.models import User
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
        from app.models import User
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

    def test_generate_code_english(self, db_session: Session):
        """Test generating code for English name."""
        code = repo.generate_code("My Workspace")
        assert code == "myworkspace"

    def test_generate_code_chinese(self, db_session: Session):
        """Test generating code for Chinese name."""
        code = repo.generate_code("我的工作空间")
        assert code == "wo_de_gong_zuo_kong_jian"

    def test_generate_code_mixed(self, db_session: Session):
        """Test generating code for mixed name."""
        code = repo.generate_code("测试 Workspace 123")
        assert code == "ce_shi_workspace123"

    def test_is_code_exists_false(self, db_session: Session, workspace):
        """Test code exists returns False for new code."""
        assert repo.is_code_exists(db_session, "new_code_123") is False

    def test_is_code_exists_true(self, db_session: Session, workspace):
        """Test code exists returns True for existing code."""
        assert repo.is_code_exists(db_session, workspace.code) is True

    def test_is_name_exists_false(self, db_session: Session, workspace):
        """Test name exists returns False for new name."""
        assert repo.is_name_exists(db_session, "新名称", workspace.org_id) is False

    def test_is_name_exists_true(self, db_session: Session, workspace):
        """Test name exists returns True for existing name."""
        assert repo.is_name_exists(db_session, workspace.name, workspace.org_id) is True

    def test_is_name_exists_different_org(self, db_session: Session, workspace, root_org):
        """Test name can exist in different organizations."""
        # Create another org
        from app.repositories import org_unit_repository as org_repo

        new_org = org_repo.create_org_unit(
            db_session,
            name="另一个公司",
            code="ANOTHER_COMPANY",
            type=OrgUnitType.COMPANY,
        )

        # Same name in different org should be allowed
        assert repo.is_name_exists(db_session, workspace.name, new_org.id) is False

    def test_create_workspace_success(self, db_session: Session, root_org, owner_user):
        """Test creating a workspace."""
        workspace, code = repo.create_workspace(
            db_session,
            name="新工作空间",
            org_id=root_org.id,
            owner_id=owner_user.id,
            description="这是一个新工作空间",
        )
        db_session.commit()  # Commit to make changes visible to new queries

        assert workspace is not None
        assert workspace.name == "新工作空间"
        assert workspace.code == code
        assert workspace.org_id == root_org.id
        assert workspace.owner_id == owner_user.id
        assert workspace.status == WorkspaceStatus.ACTIVE
        assert workspace.description == "这是一个新工作空间"

        # Verify owner member was created
        member = repo.get_member_by_workspace_and_user(db_session, workspace.id, owner_user.id)
        assert member is not None
        assert member.role == MemberRole.OWNER

    def test_create_workspace_generates_unique_code(self, db_session: Session, root_org, owner_user):
        """Test that workspace generates unique code on name collision."""
        # Create first workspace
        workspace1, _ = repo.create_workspace(
            db_session,
            name="工作空间",
            org_id=root_org.id,
            owner_id=owner_user.id,
        )

        # Create another with same name - should get different code
        from app.models import User
        from app.services.auth_service import hash_password

        user2 = User(
            phone="13900000003",
            hashed_password=hash_password("password123"),
            username="user2",
            is_active=True,
        )
        db_session.add(user2)
        db_session.commit()
        db_session.refresh(user2)

        workspace2, code2 = repo.create_workspace(
            db_session,
            name="工作空间",
            org_id=root_org.id,
            owner_id=user2.id,
        )

        assert workspace1.code == "gong_zuo_kong_jian"
        assert workspace2.code == "gong_zuo_kong_jian_1"

    def test_get_workspace_by_id(self, db_session: Session, workspace):
        """Test getting workspace by ID."""
        result = repo.get_workspace_by_id(db_session, workspace.id)

        assert result is not None
        assert result.id == workspace.id
        assert result.name == workspace.name

    def test_get_workspace_by_id_not_found(self, db_session: Session):
        """Test getting non-existent workspace."""
        result = repo.get_workspace_by_id(db_session, 99999)

        assert result is None

    def test_get_workspace_by_code(self, db_session: Session, workspace):
        """Test getting workspace by code."""
        result = repo.get_workspace_by_code(db_session, workspace.code)

        assert result is not None
        assert result.code == workspace.code

    def test_get_workspace_by_code_not_found(self, db_session: Session):
        """Test getting workspace with non-existent code."""
        result = repo.get_workspace_by_code(db_session, "non_existent_code")

        assert result is None

    def test_get_workspaces_empty(self, db_session: Session):
        """Test getting workspaces when none exist."""
        workspaces, total = repo.get_workspaces(db_session)

        assert workspaces == []
        assert total == 0

    def test_get_workspaces_with_data(self, db_session: Session, workspace):
        """Test getting workspaces with existing data."""
        workspaces, total = repo.get_workspaces(db_session)

        assert len(workspaces) == 1
        assert total == 1

    def test_get_workspaces_filter_by_org(self, db_session: Session, workspace, root_org):
        """Test filtering workspaces by organization."""
        workspaces, total = repo.get_workspaces(db_session, org_id=root_org.id)

        assert len(workspaces) == 1
        assert total == 1

        # Filter by non-existent org
        workspaces, total = repo.get_workspaces(db_session, org_id=99999)

        assert len(workspaces) == 0
        assert total == 0

    def test_get_workspaces_filter_by_status(self, db_session: Session, workspace):
        """Test filtering workspaces by status."""
        # Active workspace
        workspaces, total = repo.get_workspaces(db_session, status=WorkspaceStatus.ACTIVE)
        assert len(workspaces) == 1

        # Disabled workspace
        workspaces, total = repo.get_workspaces(db_session, status=WorkspaceStatus.DISABLED)
        assert len(workspaces) == 0

    def test_get_workspaces_search(self, db_session: Session, workspace):
        """Test searching workspaces by name."""
        workspaces, total = repo.get_workspaces(db_session, search="测试")
        assert len(workspaces) == 1

        workspaces, total = repo.get_workspaces(db_session, search="不存在")
        assert len(workspaces) == 0

    def test_get_workspaces_pagination(self, db_session: Session, owner_user, root_org, member_user):
        """Test workspaces pagination."""
        # Create multiple workspaces
        for i in range(5):
            repo.create_workspace(
                db_session,
                name=f"工作空间{i}",
                org_id=root_org.id,
                owner_id=owner_user.id,
            )
        db_session.commit()

        # Test first page
        workspaces, total = repo.get_workspaces(db_session, page=1, page_size=2)
        assert len(workspaces) == 2
        assert total == 5

        # Test second page
        workspaces, total = repo.get_workspaces(db_session, page=2, page_size=2)
        assert len(workspaces) == 2
        assert total == 5

        # Test last page
        workspaces, total = repo.get_workspaces(db_session, page=3, page_size=2)
        assert len(workspaces) == 1
        assert total == 5

    def test_get_workspaces_by_user(self, db_session: Session, workspace, owner_user, member_user):
        """Test getting workspaces accessible by a user."""
        # Owner should see the workspace
        workspaces, total = repo.get_workspaces_by_user(db_session, owner_user.id)
        assert len(workspaces) == 1

        # User without membership should see nothing
        workspaces, total = repo.get_workspaces_by_user(db_session, member_user.id)
        assert len(workspaces) == 0

    def test_update_workspace(self, db_session: Session, workspace):
        """Test updating workspace."""
        updated = repo.update_workspace(
            db_session,
            workspace.id,
            name="更新后的名称",
            description="更新后的描述",
        )

        assert updated is not None
        assert updated.name == "更新后的名称"
        assert updated.description == "更新后的描述"

    def test_update_workspace_not_found(self, db_session: Session):
        """Test updating non-existent workspace."""
        updated = repo.update_workspace(db_session, 99999, name="新名称")

        assert updated is None

    def test_update_workspace_status_disable(self, db_session: Session, workspace, owner_user):
        """Test disabling workspace."""
        updated = repo.update_workspace_status(
            db_session,
            workspace.id,
            WorkspaceStatus.DISABLED,
            disabled_by=owner_user.id,
        )

        assert updated is not None
        assert updated.status == WorkspaceStatus.DISABLED
        assert updated.disabled_at is not None
        assert updated.disabled_by == owner_user.id

    def test_update_workspace_status_enable(self, db_session: Session, workspace):
        """Test enabling disabled workspace."""
        # First disable
        repo.update_workspace_status(db_session, workspace.id, WorkspaceStatus.DISABLED)

        # Then enable
        updated = repo.update_workspace_status(
            db_session,
            workspace.id,
            WorkspaceStatus.ACTIVE,
        )

        assert updated is not None
        assert updated.status == WorkspaceStatus.ACTIVE
        assert updated.disabled_at is None
        assert updated.disabled_by is None

    def test_get_member_count(self, db_session: Session, workspace, member_user, owner_user):
        """Test getting member count."""
        # Initially only owner
        count = repo.get_member_count(db_session, workspace.id)
        assert count == 1

        # Add a member
        repo.add_workspace_member(db_session, workspace.id, member_user.id, MemberRole.MEMBER)
        db_session.commit()

        count = repo.get_member_count(db_session, workspace.id)
        assert count == 2

    def test_get_member_by_id(self, db_session: Session, workspace, owner_user):
        """Test getting member by ID."""
        member = repo.get_member_by_workspace_and_user(db_session, workspace.id, owner_user.id)

        assert member is not None
        assert member.workspace_id == workspace.id
        assert member.user_id == owner_user.id

    def test_is_user_member_of_workspace(self, db_session: Session, workspace, owner_user, member_user):
        """Test checking if user is member of workspace."""
        assert repo.is_user_member_of_workspace(db_session, workspace.id, owner_user.id) is True
        assert repo.is_user_member_of_workspace(db_session, workspace.id, member_user.id) is False

    def test_is_user_owner_of_workspace(self, db_session: Session, workspace, owner_user, member_user):
        """Test checking if user is owner of workspace."""
        assert repo.is_user_owner_of_workspace(db_session, workspace.id, owner_user.id) is True
        assert repo.is_user_owner_of_workspace(db_session, workspace.id, member_user.id) is False

    def test_get_member_role(self, db_session: Session, workspace, owner_user, member_user):
        """Test getting member role."""
        role = repo.get_member_role(db_session, workspace.id, owner_user.id)
        assert role == MemberRole.OWNER

        # Add member and check role
        repo.add_workspace_member(db_session, workspace.id, member_user.id, MemberRole.MEMBER)
        db_session.commit()

        role = repo.get_member_role(db_session, workspace.id, member_user.id)
        assert role == MemberRole.MEMBER

    def test_add_workspace_member_success(self, db_session: Session, workspace, member_user):
        """Test adding a member to workspace."""
        member = repo.add_workspace_member(
            db_session,
            workspace.id,
            member_user.id,
            MemberRole.MEMBER,
        )
        db_session.commit()

        assert member is not None
        assert member.workspace_id == workspace.id
        assert member.user_id == member_user.id
        assert member.role == MemberRole.MEMBER

    def test_add_workspace_member_already_member(self, db_session: Session, workspace, owner_user):
        """Test adding owner who is already a member."""
        # Owner is already a member from workspace creation
        # Adding again should return None (already a member)
        result = repo.add_workspace_member(
            db_session,
            workspace.id,
            owner_user.id,
            MemberRole.ADMIN,
        )

        assert result is None  # Returns None for existing member

    def test_update_member_role(self, db_session: Session, workspace, member_user):
        """Test updating member role."""
        # Add member
        repo.add_workspace_member(
            db_session,
            workspace.id,
            member_user.id,
            MemberRole.MEMBER,
        )
        db_session.commit()

        # Get the member record
        member = repo.get_member_by_workspace_and_user(db_session, workspace.id, member_user.id)
        assert member is not None

        # Update role
        updated = repo.update_member_role(db_session, member.id, MemberRole.ADMIN)

        assert updated is not None
        assert updated.role == MemberRole.ADMIN

    def test_update_member_role_owner_not_allowed(self, db_session: Session, workspace, owner_user):
        """Test that owner role cannot be changed."""
        member = repo.get_member_by_workspace_and_user(db_session, workspace.id, owner_user.id)

        updated = repo.update_member_role(db_session, member.id, MemberRole.ADMIN)

        assert updated is None  # Should return None

    def test_remove_workspace_member(self, db_session: Session, workspace, member_user):
        """Test removing a member from workspace."""
        # Add member first
        repo.add_workspace_member(
            db_session,
            workspace.id,
            member_user.id,
            MemberRole.MEMBER,
        )
        db_session.commit()

        # Get the member record
        member = repo.get_member_by_workspace_and_user(db_session, workspace.id, member_user.id)
        assert member is not None

        # Remove member
        result = repo.remove_workspace_member(db_session, member.id)

        assert result is True
        db_session.commit()  # Commit the deletion

        # Verify removed
        member = repo.get_member_by_workspace_and_user(db_session, workspace.id, member_user.id)
        assert member is None

    def test_remove_workspace_member_owner_not_allowed(self, db_session: Session, workspace, owner_user):
        """Test that owner cannot be removed."""
        member = repo.get_member_by_workspace_and_user(db_session, workspace.id, owner_user.id)

        result = repo.remove_workspace_member(db_session, member.id)

        assert result is False  # Should return False

    def test_transfer_ownership(self, db_session: Session, workspace, owner_user, member_user):
        """Test transferring workspace ownership."""
        # Add member first
        repo.add_workspace_member(db_session, workspace.id, member_user.id, MemberRole.MEMBER)
        db_session.commit()

        # Transfer ownership
        result = repo.transfer_ownership(db_session, workspace.id, member_user.id)

        assert result is not None
        workspace, old_owner_member, new_owner_member = result

        assert workspace.owner_id == member_user.id
        assert old_owner_member.role == MemberRole.ADMIN
        assert new_owner_member.role == MemberRole.OWNER

    def test_transfer_ownership_member_becomes_member(self, db_session: Session, workspace, owner_user):
        """Test that transferred ownership creates member record if none exists."""
        from app.models import User
        from app.services.auth_service import hash_password

        new_user = User(
            phone="13900000004",
            hashed_password=hash_password("password123"),
            username="new_owner",
            is_active=True,
        )
        db_session.add(new_user)
        db_session.commit()

        # Transfer to user who is not a member
        result = repo.transfer_ownership(db_session, workspace.id, new_user.id)

        assert result is not None
        workspace, old_owner_member, new_owner_member = result

        assert workspace.owner_id == new_user.id
        assert new_owner_member.role == MemberRole.OWNER
        assert old_owner_member.role == MemberRole.ADMIN

    def test_is_user_exists(self, db_session: Session, owner_user):
        """Test checking if user exists."""
        assert repo.is_user_exists(db_session, owner_user.id) is True
        assert repo.is_user_exists(db_session, 99999) is False

    def test_get_workspace_members(self, db_session: Session, workspace, owner_user, member_user):
        """Test getting workspace members."""
        # Add a member
        repo.add_workspace_member(db_session, workspace.id, member_user.id, MemberRole.MEMBER)
        db_session.commit()

        # Get all members
        members, total = repo.get_workspace_members(db_session, workspace.id)
        assert len(members) == 2
        assert total == 2

        # Filter by role
        members, total = repo.get_workspace_members(db_session, workspace.id, role=MemberRole.OWNER)
        assert len(members) == 1
        assert total == 1

    def test_get_workspace_members_pagination(self, db_session: Session, workspace, owner_user, member_user):
        """Test workspace members pagination."""
        # Add a member
        repo.add_workspace_member(db_session, workspace.id, member_user.id, MemberRole.MEMBER)
        db_session.commit()

        # First page
        members, total = repo.get_workspace_members(db_session, workspace.id, page=1, page_size=1)
        assert len(members) == 1
        assert total == 2

        # Second page
        members, total = repo.get_workspace_members(db_session, workspace.id, page=2, page_size=1)
        assert len(members) == 1
        assert total == 2
