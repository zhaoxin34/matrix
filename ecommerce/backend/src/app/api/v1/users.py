"""Users API routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate
from app.services.user_service import UserService

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def get_current_user_handler(current_user: User = Depends(get_current_user)) -> UserResponse:
    """Get current user profile."""
    return current_user


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)) -> UserResponse:
    """Get user by ID."""
    service = UserService(db)
    return service.get_by_id(user_id)


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int, user_data: UserUpdate, db: Session = Depends(get_db)
) -> UserResponse:
    """Update user by ID."""
    service = UserService(db)
    return service.update(user_id, user_data)


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)) -> dict:
    """Delete user by ID."""
    service = UserService(db)
    service.delete(user_id)
    return {"message": "User deleted successfully"}
