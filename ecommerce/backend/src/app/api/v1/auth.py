"""Authentication API routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.user import TokenResponse, UserCreate, UserLogin
from app.services.user_service import UserService

router = APIRouter()


@router.post("/register", response_model=TokenResponse)
def register(user_data: UserCreate, db: Session = Depends(get_db)) -> TokenResponse:
    """Register a new user."""
    service = UserService(db)
    user = service.create(user_data)
    return service.authenticate(
        UserLogin(username=user.username, password=user_data.password)
    )


@router.post("/login", response_model=TokenResponse)
def login(login_data: UserLogin, db: Session = Depends(get_db)) -> TokenResponse:
    """Login with username and password."""
    service = UserService(db)
    return service.authenticate(login_data)
