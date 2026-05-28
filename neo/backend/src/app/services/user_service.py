"""User service."""

from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.user_employee_mapping_repository import (
    UserEmployeeMappingRepository,
)
from app.repositories.user_repository import (
    create_user as create_user_repo,
)
from app.repositories.user_repository import (
    get_user_by_id,
    get_user_by_phone,
    get_users_excluding_ids,
)
from app.repositories.user_repository import (
    get_users as get_users_repo,
)
from app.repositories.user_repository import (
    update_user as update_user_repo,
)
from app.repositories.user_repository import (
    update_user_status as update_user_status_repo,
)
from app.services.auth_service import hash_password


def get_user(db: Session, user_id: int) -> User | None:
    """Get user by ID."""
    return get_user_by_id(db, user_id)


def get_users(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
) -> tuple[list[User], int]:
    """Get paginated user list."""
    return get_users_repo(db, page, page_size, search)


def get_unlinked_users(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
) -> tuple[list[User], int]:
    """Get paginated user list for users that are not linked to any employee.

    Returns:
        Tuple of (users, total_count)
    """
    # Get all user IDs that are linked to employees
    linked_user_ids = UserEmployeeMappingRepository.get_linked_user_ids(db)

    # Get users excluding linked ones
    return get_users_excluding_ids(db, linked_user_ids, page, page_size, search)


def get_user_with_link_status(db: Session, user_id: int) -> dict | None:
    """Get user with link status to employee.

    Returns:
        Dict with user info and linked_employee info, or None if user not found.
    """
    user = get_user_by_id(db, user_id)
    if not user:
        return None

    # Check if user is linked to an employee
    mapping = UserEmployeeMappingRepository.get_by_user_id(db, user_id)

    linked_employee = None
    if mapping:
        # Get the linked employee info
        from app.repositories import get_employee_by_id

        employee = get_employee_by_id(db, int(mapping.employee_id))
        if employee:
            linked_employee = {
                "id": employee.id,
                "name": employee.name,
                "employee_no": employee.employee_no,
            }

    return {
        "id": user.id,
        "phone": user.phone,
        "username": user.username,
        "email": user.email,
        "is_admin": user.is_admin,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "linked_employee": linked_employee,
    }


def create_user(
    db: Session,
    phone: str,
    password: str,
    username: str | None = None,
    email: str | None = None,
) -> User:
    """Create a new user with hashed password."""
    hashed = hash_password(password)
    return create_user_repo(db, phone, hashed, username, email)


def update_user(
    db: Session,
    user_id: int,
    username: str | None = None,
    email: str | None = None,
) -> User | None:
    """Update user profile."""
    return update_user_repo(db, user_id, username, email)


def update_user_status(db: Session, user_id: int, is_active: bool) -> User | None:
    """Update user active status."""
    return update_user_status_repo(db, user_id, is_active)


def is_phone_exists(db: Session, phone: str) -> bool:
    """Check if phone number already exists."""
    return get_user_by_phone(db, phone) is not None


def get_user_with_link_status_by_employee_id(db: Session, employee_id: int) -> dict | None:
    """Get user linked to a specific employee.

    Returns:
        Dict with user info or None if no mapping exists.
    """
    # Check if employee is linked to a user
    mapping = UserEmployeeMappingRepository.get_by_employee_id(db, employee_id)
    if not mapping:
        return None

    # Get the linked user info
    user = get_user_by_id(db, mapping.user_id)
    if not user:
        return None

    return {
        "id": user.id,
        "phone": user.phone,
        "username": user.username,
        "email": user.email,
        "is_admin": user.is_admin,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "linked_employee": None,  # Not needed for this use case
    }
