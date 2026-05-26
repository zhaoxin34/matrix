"""User repository."""

from sqlalchemy.orm import Session

from app.models.user import User


def get_user_by_id(db: Session, user_id: int) -> User | None:
    """Get user by ID."""
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_phone(db: Session, phone: str) -> User | None:
    """Get user by phone number."""
    return db.query(User).filter(User.phone == phone).first()


def get_users(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
) -> tuple[list[User], int]:
    """Get paginated user list with optional search.

    Returns:
        Tuple of (users, total_count)
    """
    query = db.query(User)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter((User.username.ilike(search_pattern)) | (User.phone.ilike(search_pattern)))

    total = query.count()
    users = query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return users, total


def create_user(
    db: Session,
    phone: str,
    hashed_password: str,
    username: str | None = None,
    email: str | None = None,
) -> User:
    """Create a new user."""
    user = User(
        phone=phone,
        hashed_password=hashed_password,
        username=username,
        email=email,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user(
    db: Session,
    user_id: int,
    username: str | None = None,
    email: str | None = None,
) -> User | None:
    """Update user profile."""
    user = get_user_by_id(db, user_id)
    if not user:
        return None

    if username is not None:
        user.username = username
    if email is not None:
        user.email = email

    db.commit()
    db.refresh(user)
    return user


def update_user_status(db: Session, user_id: int, is_active: bool) -> User | None:
    """Update user active status."""
    user = get_user_by_id(db, user_id)
    if not user:
        return None

    user.is_active = is_active
    db.commit()
    db.refresh(user)
    return user
