"""Project repository."""

from typing import Optional

from sqlalchemy.orm import Session, selectinload

from app.models.project import Project, ProjectMember, OrgProject


class ProjectRepository:
    """Project data access layer."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, project: Project) -> Project:
        self.db.add(project)
        self.db.flush()
        self.db.refresh(project)
        return project

    def find_by_id(self, project_id: int) -> Optional[Project]:
        return self.db.query(Project).filter(Project.id == project_id).first()

    def find_by_code(self, code: str) -> Optional[Project]:
        return self.db.query(Project).filter(Project.code == code).first()

    def update(self, project: Project) -> Project:
        self.db.flush()
        self.db.refresh(project)
        return project

    def delete(self, project: Project) -> None:
        self.db.delete(project)
        self.db.flush()

    def list(self, page: int = 1, page_size: int = 20, status=None) -> tuple[list[Project], int]:
        q = self.db.query(Project)
        if status:
            q = q.filter(Project.status == status)
        total = q.count()
        items = q.offset((page - 1) * page_size).limit(page_size).all()
        return items, total


class ProjectMemberRepository:
    """Project member data access layer."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, member: ProjectMember) -> ProjectMember:
        self.db.add(member)
        self.db.flush()
        self.db.refresh(member)
        return member

    def find_by_project_and_user(self, project_id: int, user_id: int) -> Optional[ProjectMember]:
        return (
            self.db.query(ProjectMember)
            .filter(ProjectMember.project_id == project_id, ProjectMember.user_id == user_id)
            .first()
        )

    def find_by_project(self, project_id: int) -> list[ProjectMember]:
        return (
            self.db.query(ProjectMember)
            .options(selectinload(ProjectMember.user))
            .filter(ProjectMember.project_id == project_id)
            .all()
        )

    def find_by_user_id(self, user_id: int) -> list[ProjectMember]:
        return (
            self.db.query(ProjectMember)
            .options(selectinload(ProjectMember.project))
            .filter(ProjectMember.user_id == user_id)
            .all()
        )

    def update_role(self, member: ProjectMember, role) -> ProjectMember:
        member.role = role
        self.db.flush()
        self.db.refresh(member)
        return member

    def delete(self, member: ProjectMember) -> None:
        self.db.delete(member)
        self.db.flush()

    def count_admins(self, project_id: int) -> int:
        from app.models.project import ProjectMemberRole
        return (
            self.db.query(ProjectMember)
            .filter(ProjectMember.project_id == project_id, ProjectMember.role == ProjectMemberRole.admin)
            .count()
        )


class OrgProjectRepository:
    """Organization-Project association data access layer."""

    def __init__(self, db: Session):
        self.db = db

    def create(self, assoc: OrgProject) -> OrgProject:
        self.db.add(assoc)
        self.db.flush()
        self.db.refresh(assoc)
        return assoc

    def find_by_org_and_project(self, org_id: int, project_id: int) -> Optional[OrgProject]:
        return (
            self.db.query(OrgProject)
            .filter(OrgProject.org_id == org_id, OrgProject.project_id == project_id)
            .first()
        )

    def find_by_project(self, project_id: int) -> list[OrgProject]:
        return (
            self.db.query(OrgProject)
            .options(selectinload(OrgProject.organization))
            .filter(OrgProject.project_id == project_id)
            .all()
        )

    def delete(self, assoc: OrgProject) -> None:
        self.db.delete(assoc)
        self.db.flush()