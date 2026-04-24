"""User service."""

from sqlalchemy.orm import Session

from app.repositories.user_repo import UserRepository


class UserService:
    """User business logic."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = UserRepository(db)

    def get_user_by_id(self, user_id: int):
        return self.repo.find_by_id(user_id)

    def list_users(self, keyword: str | None = None, skip: int = 0, limit: int = 50):
        return self.repo.list_users(keyword=keyword, skip=skip, limit=limit)
