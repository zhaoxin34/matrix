"""Tests for ProjectService."""

from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from app.models.project import ProjectMemberRole, ProjectStatus
from app.schemas.project import (
    OrgProjectCreate,
    ProjectCreate,
    ProjectMemberCreate,
    ProjectMemberUpdate,
    ProjectUpdate,
)
from app.services.project_service import OrgProjectService, ProjectMemberService, ProjectService


class TestProjectService:
    """Test ProjectService class."""

    def test_create_project_success(self, mock_db, sample_user):
        """Test creating a new project successfully."""
        service = ProjectService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_code.return_value = None
        service.member_repo = MagicMock()

        created_project = MagicMock()
        created_project.id = 1
        created_project.name = "测试项目"
        created_project.code = "TEST"
        created_project.description = "测试描述"
        created_project.status = ProjectStatus.active
        service.repo.create.return_value = created_project
        service.repo.find_by_id.return_value = created_project

        data = ProjectCreate(
            name="测试项目",
            code="TEST",
            description="测试描述",
        )

        project = service.create_project(data, creator_user_id=sample_user.id)

        assert project is not None
        assert project.name == "测试项目"
        service.repo.create.assert_called_once()
        service.member_repo.create.assert_called_once()
        mock_db.commit.assert_called_once()

    def test_create_project_duplicate_code(self, mock_db, sample_project):
        """Test creating project with duplicate code raises error."""
        service = ProjectService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_code.return_value = sample_project

        data = ProjectCreate(
            name="重复项目",
            code="TEST",
            description="测试描述",
        )

        with pytest.raises(HTTPException) as exc_info:
            service.create_project(data, creator_user_id=1)

        assert exc_info.value.status_code == 400
        assert "项目代码已存在" in exc_info.value.detail

    def test_get_project_found(self, mock_db, sample_project):
        """Test getting existing project."""
        service = ProjectService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_id.return_value = sample_project

        project = service.get_project(sample_project.id)

        assert project is not None
        assert project.id == sample_project.id
        assert project.name == "测试项目"

    def test_get_project_not_found(self, mock_db):
        """Test getting non-existent project raises error."""
        service = ProjectService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_id.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            service.get_project(9999)

        assert exc_info.value.status_code == 404
        assert "项目不存在" in exc_info.value.detail

    def test_update_project_name(self, mock_db, sample_project):
        """Test updating project name."""
        service = ProjectService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_id.return_value = sample_project
        service.repo.update.return_value = sample_project
        service.repo.find_by_id.side_effect = [sample_project, sample_project]

        data = ProjectUpdate(name="更新后的项目名称")

        service.update_project(sample_project.id, data)

        assert sample_project.name == "更新后的项目名称"
        service.repo.update.assert_called_once()
        mock_db.commit.assert_called_once()

    def test_update_project_description(self, mock_db, sample_project):
        """Test updating project description."""
        service = ProjectService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_id.return_value = sample_project
        service.repo.update.return_value = sample_project

        data = ProjectUpdate(description="更新后的描述")

        service.update_project(sample_project.id, data)

        assert sample_project.description == "更新后的描述"

    def test_update_project_status(self, mock_db, sample_project):
        """Test updating project status."""
        service = ProjectService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_id.return_value = sample_project
        service.repo.update.return_value = sample_project

        data = ProjectUpdate(status=ProjectStatus.archived)

        service.update_project(sample_project.id, data)

        assert sample_project.status == ProjectStatus.archived

    def test_delete_project_success(self, mock_db, sample_project):
        """Test deleting a project."""
        service = ProjectService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_id.return_value = sample_project
        service.repo.delete.return_value = None

        service.delete_project(sample_project.id)

        service.repo.delete.assert_called_once_with(sample_project)
        mock_db.commit.assert_called_once()

    def test_delete_project_not_found(self, mock_db):
        """Test deleting non-existent project raises error."""
        service = ProjectService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_id.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            service.delete_project(9999)

        assert exc_info.value.status_code == 404

    def test_list_projects(self, mock_db, sample_project):
        """Test listing projects with pagination."""
        service = ProjectService(mock_db)
        service.repo = MagicMock()
        service.repo.list.return_value = ([sample_project], 1)

        items, total = service.list_projects(page=1, page_size=20)

        assert items is not None
        assert total == 1
        service.repo.list.assert_called_once_with(page=1, page_size=20, status=None)

    def test_list_projects_with_status_filter(self, mock_db, sample_project):
        """Test listing projects with status filter."""
        service = ProjectService(mock_db)
        service.repo = MagicMock()
        service.repo.list.return_value = ([sample_project], 1)

        items, total = service.list_projects(page=1, page_size=20, status=ProjectStatus.active)

        assert items is not None
        service.repo.list.assert_called_once_with(page=1, page_size=20, status=ProjectStatus.active)


class TestProjectMemberService:
    """Test ProjectMemberService class."""

    def test_add_member_success(self, mock_db, sample_project, sample_user):
        """Test adding a member to project successfully."""
        service = ProjectMemberService(mock_db)
        service.repo = MagicMock()
        service.project_repo = MagicMock()
        service.project_repo.find_by_id.return_value = sample_project
        service.repo.find_by_project_and_user.return_value = None

        created_member = MagicMock()
        created_member.id = 1
        created_member.project_id = sample_project.id
        created_member.user_id = sample_user.id
        created_member.role = ProjectMemberRole.member
        service.repo.create.return_value = created_member

        data = ProjectMemberCreate(user_id=sample_user.id, role=ProjectMemberRole.member)

        member = service.add_member(sample_project.id, data)

        assert member is not None
        service.repo.create.assert_called_once()
        mock_db.commit.assert_called_once()

    def test_add_member_project_not_found(self, mock_db):
        """Test adding member to non-existent project raises error."""
        service = ProjectMemberService(mock_db)
        service.repo = MagicMock()
        service.project_repo = MagicMock()
        service.project_repo.find_by_id.return_value = None

        data = ProjectMemberCreate(user_id=1, role=ProjectMemberRole.member)

        with pytest.raises(HTTPException) as exc_info:
            service.add_member(9999, data)

        assert exc_info.value.status_code == 404
        assert "项目不存在" in exc_info.value.detail

    def test_add_member_already_exists(self, mock_db, sample_project, sample_project_member):
        """Test adding member that already exists raises error."""
        service = ProjectMemberService(mock_db)
        service.repo = MagicMock()
        service.project_repo = MagicMock()
        service.project_repo.find_by_id.return_value = sample_project
        service.repo.find_by_project_and_user.return_value = sample_project_member

        data = ProjectMemberCreate(user_id=sample_project_member.user_id, role=ProjectMemberRole.member)

        with pytest.raises(HTTPException) as exc_info:
            service.add_member(sample_project.id, data)

        assert exc_info.value.status_code == 400
        assert "用户已是项目成员" in exc_info.value.detail

    def test_remove_member_success(self, mock_db, sample_project, sample_project_member):
        """Test removing a member from project successfully."""
        service = ProjectMemberService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_project_and_user.return_value = sample_project_member
        service.repo.count_admins.return_value = 2  # More than one admin

        service.remove_member(sample_project.id, sample_project_member.user_id)

        service.repo.delete.assert_called_once_with(sample_project_member)
        mock_db.commit.assert_called_once()

    def test_remove_member_not_found(self, mock_db):
        """Test removing non-existent member raises error."""
        service = ProjectMemberService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_project_and_user.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            service.remove_member(1, 9999)

        assert exc_info.value.status_code == 404
        assert "成员不存在" in exc_info.value.detail

    def test_remove_last_admin_raises_error(self, mock_db, sample_project, sample_project_member):
        """Test removing last admin raises error."""
        service = ProjectMemberService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_project_and_user.return_value = sample_project_member
        service.repo.count_admins.return_value = 1  # Only one admin

        with pytest.raises(HTTPException) as exc_info:
            service.remove_member(sample_project.id, sample_project_member.user_id)

        assert exc_info.value.status_code == 400
        assert "不能移除最后一个管理员" in exc_info.value.detail

    def test_update_member_role_success(self, mock_db, sample_project, sample_project_member):
        """Test updating member role successfully."""
        service = ProjectMemberService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_project_and_user.return_value = sample_project_member
        service.repo.count_admins.return_value = 2
        service.repo.update_role.return_value = sample_project_member

        data = ProjectMemberUpdate(role=ProjectMemberRole.member)

        member = service.update_member_role(sample_project.id, sample_project_member.user_id, data)

        assert member is not None
        service.repo.update_role.assert_called_once()

    def test_update_member_role_not_found(self, mock_db):
        """Test updating non-existent member raises error."""
        service = ProjectMemberService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_project_and_user.return_value = None

        data = ProjectMemberUpdate(role=ProjectMemberRole.admin)

        with pytest.raises(HTTPException) as exc_info:
            service.update_member_role(1, 9999, data)

        assert exc_info.value.status_code == 404
        assert "成员不存在" in exc_info.value.detail

    def test_update_last_admin_to_member_raises_error(self, mock_db, sample_project, sample_project_member):
        """Test demoting last admin raises error."""
        service = ProjectMemberService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_project_and_user.return_value = sample_project_member
        service.repo.count_admins.return_value = 1

        data = ProjectMemberUpdate(role=ProjectMemberRole.member)

        with pytest.raises(HTTPException) as exc_info:
            service.update_member_role(sample_project.id, sample_project_member.user_id, data)

        assert exc_info.value.status_code == 400
        assert "不能降级最后一个管理员" in exc_info.value.detail

    def test_list_members(self, mock_db, sample_project, sample_project_member):
        """Test listing project members."""
        service = ProjectMemberService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_project.return_value = [sample_project_member]

        members = service.list_members(sample_project.id)

        assert members is not None
        assert len(members) == 1
        service.repo.find_by_project.assert_called_once_with(sample_project.id)


class TestOrgProjectService:
    """Test OrgProjectService class."""

    def test_associate_org_success(self, mock_db, sample_project, sample_org_unit):
        """Test associating org with project successfully."""
        service = OrgProjectService(mock_db)
        service.repo = MagicMock()
        service.project_repo = MagicMock()
        service.project_repo.find_by_id.return_value = sample_project
        service.repo.find_by_org_and_project.return_value = None

        created_assoc = MagicMock()
        created_assoc.id = 1
        created_assoc.org_id = sample_org_unit.id
        created_assoc.project_id = sample_project.id
        service.repo.create.return_value = created_assoc

        data = OrgProjectCreate(org_id=sample_org_unit.id)

        assoc = service.associate_org(sample_project.id, data)

        assert assoc is not None
        service.repo.create.assert_called_once()
        mock_db.commit.assert_called_once()

    def test_associate_org_project_not_found(self, mock_db):
        """Test associating org with non-existent project raises error."""
        service = OrgProjectService(mock_db)
        service.repo = MagicMock()
        service.project_repo = MagicMock()
        service.project_repo.find_by_id.return_value = None

        data = OrgProjectCreate(org_id=1)

        with pytest.raises(HTTPException) as exc_info:
            service.associate_org(9999, data)

        assert exc_info.value.status_code == 404
        assert "项目不存在" in exc_info.value.detail

    def test_associate_org_already_associated(self, mock_db, sample_project, sample_org_unit, sample_org_project):
        """Test associating already associated org raises error."""
        service = OrgProjectService(mock_db)
        service.repo = MagicMock()
        service.project_repo = MagicMock()
        service.project_repo.find_by_id.return_value = sample_project
        service.repo.find_by_org_and_project.return_value = sample_org_project

        data = OrgProjectCreate(org_id=sample_org_unit.id)

        with pytest.raises(HTTPException) as exc_info:
            service.associate_org(sample_project.id, data)

        assert exc_info.value.status_code == 400
        assert "组织已在项目中关联" in exc_info.value.detail

    def test_disassociate_org_success(self, mock_db, sample_project, sample_org_unit, sample_org_project):
        """Test disassociating org from project successfully."""
        service = OrgProjectService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_org_and_project.return_value = sample_org_project

        service.disassociate_org(sample_project.id, sample_org_unit.id)

        service.repo.delete.assert_called_once_with(sample_org_project)
        mock_db.commit.assert_called_once()

    def test_disassociate_org_not_found(self, mock_db):
        """Test disassociating non-existent association raises error."""
        service = OrgProjectService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_org_and_project.return_value = None

        with pytest.raises(HTTPException) as exc_info:
            service.disassociate_org(1, 9999)

        assert exc_info.value.status_code == 404
        assert "关联不存在" in exc_info.value.detail

    def test_list_project_orgs(self, mock_db, sample_project, sample_org_project):
        """Test listing project organizations."""
        service = OrgProjectService(mock_db)
        service.repo = MagicMock()
        service.repo.find_by_project.return_value = [sample_org_project]

        orgs = service.list_project_orgs(sample_project.id)

        assert orgs is not None
        assert len(orgs) == 1
        service.repo.find_by_project.assert_called_once_with(sample_project.id)
