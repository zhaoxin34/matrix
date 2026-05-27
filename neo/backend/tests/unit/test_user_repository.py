"""Tests for user repository module."""

from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.user_repository import (
    create_user,
    get_user_by_id,
    get_user_by_phone,
    get_users,
    update_user,
    update_user_status,
)
from app.services.auth_service import hash_password


class TestGetUserById:
    """Tests for get_user_by_id repository function."""

    def test_get_existing_user_by_id(self, db_session: Session, test_user: User):
        """Test getting an existing user by ID."""
        user = get_user_by_id(db_session, test_user.id)

        assert user is not None
        assert user.id == test_user.id
        assert user.phone == test_user.phone

    def test_get_nonexistent_user_by_id(self, db_session: Session):
        """Test getting a non-existent user returns None."""
        user = get_user_by_id(db_session, 99999)

        assert user is None

    def test_get_user_by_id_zero(self, db_session: Session):
        """Test getting user with ID 0 returns None."""
        user = get_user_by_id(db_session, 0)

        assert user is None

    def test_get_user_by_id_negative(self, db_session: Session):
        """Test getting user with negative ID returns None."""
        user = get_user_by_id(db_session, -1)

        assert user is None


class TestGetUserByPhone:
    """Tests for get_user_by_phone repository function."""

    def test_get_existing_user_by_phone(self, db_session: Session, test_user: User):
        """Test getting an existing user by phone."""
        user = get_user_by_phone(db_session, test_user.phone)

        assert user is not None
        assert user.id == test_user.id
        assert user.phone == test_user.phone

    def test_get_nonexistent_user_by_phone(self, db_session: Session):
        """Test getting a non-existent user returns None."""
        user = get_user_by_phone(db_session, "99999999999")

        assert user is None

    def test_get_user_by_phone_after_create(self, db_session: Session):
        """Test getting user after creation."""
        phone = "13800138888"
        hashed_password = hash_password("password")

        # Create user via repository
        created_user = create_user(db_session, phone, hashed_password)

        # Retrieve user
        retrieved_user = get_user_by_phone(db_session, phone)

        assert retrieved_user is not None
        assert retrieved_user.id == created_user.id
        assert retrieved_user.phone == phone


class TestCreateUser:
    """Tests for create_user repository function."""

    def test_create_user_success(self, db_session: Session):
        """Test successful user creation via repository."""
        phone = "13800138002"
        hashed_password = hash_password("testpassword")
        username = "newuser"

        user = create_user(db_session, phone, hashed_password, username)

        assert user is not None
        assert user.id is not None
        assert user.phone == phone
        assert user.username == username
        assert user.hashed_password == hashed_password

    def test_create_user_without_optional_fields(self, db_session: Session):
        """Test creating user without optional fields."""
        phone = "13800138003"
        hashed_password = hash_password("password")

        user = create_user(db_session, phone, hashed_password)

        assert user is not None
        assert user.phone == phone
        assert user.username is None
        assert user.email is None

    def test_create_user_with_email(self, db_session: Session):
        """Test creating user with email."""
        phone = "13800138004"
        hashed_password = hash_password("password")
        email = "test@example.com"

        user = create_user(db_session, phone, hashed_password, email=email)

        assert user is not None
        assert user.email == email

    def test_create_user_persisted(self, db_session: Session):
        """Test that created user is persisted to database."""
        phone = "13800138005"
        hashed_password = hash_password("password")

        user = create_user(db_session, phone, hashed_password)

        # Query the database
        db_user = db_session.query(User).filter(User.phone == phone).first()

        assert db_user is not None
        assert db_user.id == user.id

    def test_create_multiple_users_unique_ids(self, db_session: Session):
        """Test that multiple users have unique IDs."""
        user1 = create_user(db_session, "13800138010", hash_password("p1"))
        user2 = create_user(db_session, "13800138011", hash_password("p2"))
        user3 = create_user(db_session, "13800138012", hash_password("p3"))

        assert user1.id != user2.id != user3.id


class TestGetUsers:
    """Tests for get_users repository function."""

    def test_get_users_empty_database(self, db_session: Session):
        """Test getting users from empty database."""
        users, total = get_users(db_session)

        assert users == []
        assert total == 0

    def test_get_users_with_data(self, db_session: Session):
        """Test getting users when data exists."""
        # Create multiple users
        for i in range(5):
            create_user(db_session, f"13800138{str(i).zfill(2)}", hash_password("p"))

        users, total = get_users(db_session)

        assert len(users) == 5
        assert total == 5

    def test_get_users_pagination_default(self, db_session: Session):
        """Test pagination with default values."""
        # Create 25 users
        for i in range(25):
            create_user(db_session, f"1380013{str(i).zfill(4)}", hash_password("p"))

        users, total = get_users(db_session)

        # Default page_size is 20
        assert len(users) == 20
        assert total == 25

    def test_get_users_pagination_custom(self, db_session: Session):
        """Test pagination with custom page and page_size."""
        # Create 10 users
        for i in range(10):
            create_user(db_session, f"1380013{str(i).zfill(4)}", hash_password("p"))

        # Get first page
        users, total = get_users(db_session, page=1, page_size=3)
        assert len(users) == 3
        assert total == 10

        # Get second page
        users, total = get_users(db_session, page=2, page_size=3)
        assert len(users) == 3
        assert total == 10

    def test_get_users_search_by_username(self, db_session: Session):
        """Test searching users by username."""
        # Create users with different usernames
        create_user(db_session, "13800138001", hash_password("p"), username="alice")
        create_user(db_session, "13800138002", hash_password("p"), username="bob")
        create_user(db_session, "13800138003", hash_password("p"), username="alice_smith")

        # Search for "alice"
        users, total = get_users(db_session, search="alice")

        assert total == 2
        assert all("alice" in (u.username or "").lower() for u in users)

    def test_get_users_search_by_phone(self, db_session: Session):
        """Test searching users by phone."""
        create_user(db_session, "13800138001", hash_password("p"))
        create_user(db_session, "13800138002", hash_password("p"))
        create_user(db_session, "13800138003", hash_password("p"))

        # Search for exact phone number
        users, total = get_users(db_session, search="13800138001")

        assert total == 1
        assert users[0].phone == "13800138001"

        # Search for prefix that matches all phones
        users2, total2 = get_users(db_session, search="138001")

        assert total2 == 3  # All phones start with 138001

        # Search with unique suffix - only first user has 8001 at the end
        users3, total3 = get_users(db_session, search="13800138001")

        assert total3 == 1
        assert users3[0].phone == "13800138001"

    def test_get_users_search_nonexistent(self, db_session: Session):
        """Test searching for non-existent users."""
        create_user(db_session, "13800138001", hash_password("p"))

        users, total = get_users(db_session, search="nonexistent")

        assert users == []
        assert total == 0

    def test_get_users_order_by_created_at_desc(self, db_session: Session):
        """Test that users are ordered by created_at descending."""
        # Create users
        user1 = create_user(db_session, "13800138001", hash_password("p"))
        _ = create_user(db_session, "13800138002", hash_password("p"))
        user3 = create_user(db_session, "13800138003", hash_password("p"))

        users, _ = get_users(db_session)

        # Most recently created should be first
        assert users[0].id == user3.id
        assert users[2].id == user1.id

    def test_get_users_page_beyond_data(self, db_session: Session):
        """Test getting page beyond available data."""
        create_user(db_session, "13800138001", hash_password("p"))

        users, total = get_users(db_session, page=10, page_size=20)

        assert users == []
        assert total == 1


class TestUpdateUser:
    """Tests for update_user repository function."""

    def test_update_user_username(self, db_session: Session, test_user: User):
        """Test updating user username."""
        new_username = "updated_username"

        updated = update_user(db_session, test_user.id, username=new_username)

        assert updated is not None
        assert updated.username == new_username

    def test_update_user_email(self, db_session: Session, test_user: User):
        """Test updating user email."""
        new_email = "updated@example.com"

        updated = update_user(db_session, test_user.id, email=new_email)

        assert updated is not None
        assert updated.email == new_email

    def test_update_user_both_fields(self, db_session: Session, test_user: User):
        """Test updating both username and email."""
        new_username = "new_username"
        new_email = "new@example.com"

        updated = update_user(db_session, test_user.id, username=new_username, email=new_email)

        assert updated is not None
        assert updated.username == new_username
        assert updated.email == new_email

    def test_update_user_nonexistent(self, db_session: Session):
        """Test updating non-existent user returns None."""
        updated = update_user(db_session, 99999, username="test")

        assert updated is None

    def test_update_user_partial(self, db_session: Session, test_user: User):
        """Test partial update - only username."""
        original_email = test_user.email

        updated = update_user(db_session, test_user.id, username="new_name")

        assert updated is not None
        assert updated.username == "new_name"
        # Email should remain unchanged
        assert updated.email == original_email


class TestUpdateUserStatus:
    """Tests for update_user_status repository function."""

    def test_deactivate_user(self, db_session: Session, test_user: User):
        """Test deactivating a user."""
        assert test_user.is_active is True

        updated = update_user_status(db_session, test_user.id, is_active=False)

        assert updated is not None
        assert updated.is_active is False

    def test_activate_user(self, db_session: Session, test_user_inactive: User):
        """Test activating an inactive user."""
        assert test_user_inactive.is_active is False

        updated = update_user_status(db_session, test_user_inactive.id, is_active=True)

        assert updated is not None
        assert updated.is_active is True

    def test_update_status_nonexistent_user(self, db_session: Session):
        """Test updating status of non-existent user returns None."""
        updated = update_user_status(db_session, 99999, is_active=True)

        assert updated is None


class TestUserRepositoryIntegration:
    """Integration tests for user repository."""

    def test_full_crud_lifecycle(self, db_session: Session):
        """Test complete CRUD lifecycle."""
        phone = "13800139999"
        hashed_password = hash_password("password")

        # Create
        user = create_user(db_session, phone, hashed_password, username="initial")
        user_id = user.id
        assert user is not None

        # Read by ID
        retrieved = get_user_by_id(db_session, user_id)
        assert retrieved is not None
        assert retrieved.username == "initial"

        # Read by phone
        by_phone = get_user_by_phone(db_session, phone)
        assert by_phone is not None
        assert by_phone.id == user_id

        # Update
        updated = update_user(db_session, user_id, username="updated", email="test@example.com")
        assert updated is not None
        assert updated.username == "updated"
        assert updated.email == "test@example.com"

        # Update status
        deactivated = update_user_status(db_session, user_id, is_active=False)
        assert deactivated is not None
        assert deactivated.is_active is False

    def test_list_and_search(self, db_session: Session):
        """Test listing and searching users."""
        # Create users with various attributes
        create_user(db_session, "13800138001", hash_password("p"), username="alice")
        create_user(db_session, "13800138002", hash_password("p"), username="bob")
        create_user(db_session, "13800138003", hash_password("p"), username="charlie")

        # List all
        all_users, total = get_users(db_session)
        assert total == 3

        # Search
        alice_users, _ = get_users(db_session, search="alice")
        assert len(alice_users) == 1
        assert alice_users[0].username == "alice"
