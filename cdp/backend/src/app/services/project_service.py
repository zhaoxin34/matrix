"""Project service."""

from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core import error_codes as codes
from app.core.error_codes import get_error_message
from app.models.project import OrgProject, Project, ProjectMember, ProjectMemberRole, ProjectStatus
from app.repositories.org_unit_repo import OrgUnitRepository
from app.repositories.project_repo import OrgProjectRepository, ProjectMemberRepository, ProjectRepository
from app.repositories.user_repo import UserRepository
from app.schemas.project import (
    OrgProjectCreate,
    ProjectCreate,
    ProjectMemberCreate,
    ProjectMemberUpdate,
    ProjectUpdate,
)


class ProjectService:
    """Project business logic."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = ProjectRepository(db)
        self.member_repo = ProjectMemberRepository(db)
        self.org_repo = OrgProjectRepository(db)

    def create_project(self, data: ProjectCreate, creator_user_id: int) -> Project:
        # Check code uniqueness
        if self.repo.find_by_code(data.code):
            raise HTTPException(
                status_code=codes.ERR_PROJECT_CODE_EXISTS, detail=get_error_message(codes.ERR_PROJECT_CODE_EXISTS)
            )

        project = Project(
            name=data.name,
            code=data.code,
            description=data.description,
            status=ProjectStatus.active,
        )
        project = self.repo.create(project)

        # Add creator as admin
        member = ProjectMember(
            project_id=project.id,
            user_id=creator_user_id,
            role=ProjectMemberRole.admin,
        )
        self.member_repo.create(member)

        self.db.commit()
        proj = self.repo.find_by_id(project.id)
        assert proj is not None, "Project should exist after creation"
        return proj

    def get_project(self, project_id: int) -> Project:
        project = self.repo.find_by_id(project_id)
        if not project:
            raise HTTPException(
                status_code=codes.ERR_PROJECT_NOT_FOUND, detail=get_error_message(codes.ERR_PROJECT_NOT_FOUND)
            )
        return project

    def update_project(self, project_id: int, data: ProjectUpdate) -> Project:
        project = self.get_project(project_id)

        if data.name is not None:
            project.name = data.name
        if data.description is not None:
            project.description = data.description
        if data.status is not None:
            project.status = ProjectStatus(data.status.value)

        self.repo.update(project)
        self.db.commit()
        proj = self.repo.find_by_id(project_id)
        assert proj is not None, "Project should exist after update"
        return proj

    def delete_project(self, project_id: int) -> None:
        project = self.get_project(project_id)
        self.repo.delete(project)
        self.db.commit()

    def list_projects(self, page: int = 1, page_size: int = 20, status: Optional[ProjectStatus] = None) -> tuple:
        items, total = self.repo.list(page=page, page_size=page_size, status=status)
        return items, total


class ProjectMemberService:
    """Project member business logic."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = ProjectMemberRepository(db)
        self.project_repo = ProjectRepository(db)
        self.user_repo = UserRepository(db)

    def add_member(self, project_id: int, data: ProjectMemberCreate) -> ProjectMember:
        # Verify project exists
        project = self.project_repo.find_by_id(project_id)
        if not project:
            raise HTTPException(
                status_code=codes.ERR_PROJECT_NOT_FOUND, detail=get_error_message(codes.ERR_PROJECT_NOT_FOUND)
            )

        # Check if user exists
        user = self.user_repo.find_by_id(data.user_id)
        if not user:
            raise HTTPException(
                status_code=codes.ERR_USER_NOT_FOUND, detail=get_error_message(codes.ERR_USER_NOT_FOUND)
            )

        # Check if already exists
        existing = self.repo.find_by_project_and_user(project_id, data.user_id)
        if existing:
            raise HTTPException(
                status_code=codes.ERR_PROJECT_MEMBER_EXISTS, detail=get_error_message(codes.ERR_PROJECT_MEMBER_EXISTS)
            )

        member = ProjectMember(
            project_id=project_id,
            user_id=data.user_id,
            role=data.role,
        )
        member = self.repo.create(member)
        self.db.commit()
        return member

    def remove_member(self, project_id: int, user_id: int) -> None:
        member = self.repo.find_by_project_and_user(project_id, user_id)
        if not member:
            raise HTTPException(
                status_code=codes.ERR_PROJECT_MEMBER_NOT_FOUND,
                detail=get_error_message(codes.ERR_PROJECT_MEMBER_NOT_FOUND),
            )

        # Check if last admin - spec says SHOULD allow this operation
        if member.role == ProjectMemberRole.admin:
            admin_count = self.repo.count_admins(project_id)
            if admin_count <= 1:
                raise HTTPException(
                    status_code=codes.ERR_CANNOT_REMOVE_LAST_ADMIN,
                    detail=get_error_message(codes.ERR_CANNOT_REMOVE_LAST_ADMIN),
                )

        self.repo.delete(member)
        self.db.commit()

    def update_member_role(self, project_id: int, user_id: int, data: ProjectMemberUpdate) -> ProjectMember:
        member = self.repo.find_by_project_and_user(project_id, user_id)
        if not member:
            raise HTTPException(
                status_code=codes.ERR_PROJECT_MEMBER_NOT_FOUND,
                detail=get_error_message(codes.ERR_PROJECT_MEMBER_NOT_FOUND),
            )

        # Check if demoting last admin - spec says SHOULD allow this operation
        if member.role == ProjectMemberRole.admin and data.role == ProjectMemberRole.member:
            admin_count = self.repo.count_admins(project_id)
            if admin_count <= 1:
                raise HTTPException(
                    status_code=codes.ERR_CANNOT_DEMOTE_LAST_ADMIN,
                    detail=get_error_message(codes.ERR_CANNOT_DEMOTE_LAST_ADMIN),
                )

        self.repo.update_role(member, data.role)
        self.db.commit()
        return member

    def list_members(self, project_id: int) -> list[ProjectMember]:
        return self.repo.find_by_project(project_id)


class OrgProjectService:
    """Organization-Project association business logic."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = OrgProjectRepository(db)
        self.project_repo = ProjectRepository(db)
        self.org_repo = OrgUnitRepository(db)

    def associate_org(self, project_id: int, data: OrgProjectCreate) -> OrgProject:
        # Verify project exists
        project = self.project_repo.find_by_id(project_id)
        if not project:
            raise HTTPException(
                status_code=codes.ERR_PROJECT_NOT_FOUND, detail=get_error_message(codes.ERR_PROJECT_NOT_FOUND)
            )

        # Check if org exists
        org = self.org_repo.find_by_id(data.org_id)
        if not org:
            raise HTTPException(status_code=codes.ERR_ORG_NOT_FOUND, detail=get_error_message(codes.ERR_ORG_NOT_FOUND))

        # Check if already associated
        existing = self.repo.find_by_org_and_project(data.org_id, project_id)
        if existing:
            raise HTTPException(
                status_code=codes.ERR_ORG_ASSOCIATION_EXISTS, detail=get_error_message(codes.ERR_ORG_ASSOCIATION_EXISTS)
            )

        assoc = OrgProject(
            org_id=data.org_id,
            project_id=project_id,
        )
        assoc = self.repo.create(assoc)
        self.db.commit()
        return assoc

    def disassociate_org(self, project_id: int, org_id: int) -> None:
        assoc = self.repo.find_by_org_and_project(org_id, project_id)
        if not assoc:
            raise HTTPException(
                status_code=codes.ERR_ORG_ASSOCIATION_NOT_FOUND,
                detail=get_error_message(codes.ERR_ORG_ASSOCIATION_NOT_FOUND),
            )

        self.repo.delete(assoc)
        self.db.commit()

    def list_project_orgs(self, project_id: int) -> list[OrgProject]:
        return self.repo.find_by_project(project_id)
