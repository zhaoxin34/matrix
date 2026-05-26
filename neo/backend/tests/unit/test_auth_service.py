"""Tests for auth service module."""

import pytest
from sqlalchemy.orm import Session

from app.models.user import User
from app.services.auth_service import (
    authenticate_user,
    create_user,
    get_user_by_id,
    get_user_by_phone,
    hash_password,
    verify_password,
)


class TestHashPassword:
    """Tests for hash_password function."""

    def test_hash_password_returns_string(self):
        """Test that hash_password returns a string."""
        password = "mysecretpassword"
        hashed = hash_password(password)
        
        assert isinstance(hashed, str)
        assert len(hashed) > 0

    def test_hash_password_produces_different_hash_each_time(self):
        """Test that hashing same password produces different hashes (due to salt)."""
        password = "mysecretpassword"
        hash1 = hash_password(password)
        hash2 = hash_password(password)
        
        # Due to random salt, hashes should be different
        assert hash1 != hash2

    def test_hash_password_produces_valid_bcrypt_hash(self):
        """Test that hash is a valid bcrypt hash format."""
        password = "testpassword123"
        hashed = hash_password(password)
        
        # Bcrypt hashes start with $2a$, $2b$, or $2y$
        assert hashed.startswith("$2")

    def test_hash_password_preserves_password_in_verification(self):
        """Test that hashed password can be verified with original password."""
        password = "testpassword123"
        hashed = hash_password(password)
        is_valid = verify_password(password, hashed)
        
        assert is_valid is True

    def test_hash_password_empty_string(self):
        """Test hashing an empty string."""
        password = ""
        hashed = hash_password(password)
        
        assert isinstance(hashed, str)
        assert verify_password(password, hashed) is True

    def test_hash_password_unicode_characters(self):
        """Test hashing password with unicode characters."""
        password = "密码测试123"
        hashed = hash_password(password)
        
        assert verify_password(password, hashed) is True


class TestVerifyPassword:
    """Tests for verify_password function."""

    def test_verify_password_correct_password(self):
        """Test verifying correct password returns True."""
        password = "abcd1234"
        hashed = hash_password(password)
        
        result = verify_password(password, hashed)
        
        assert result is True

    def test_verify_password_incorrect_password(self):
        """Test verifying incorrect password returns False."""
        password = "abcd1234"
        wrong_password = "wrongpassword"
        hashed = hash_password(password)
        
        result = verify_password(wrong_password, hashed)
        
        assert result is False

    def test_verify_password_case_sensitive(self):
        """Test that password verification is case sensitive."""
        password = "Password123"
        hashed = hash_password(password)
        
        assert verify_password("Password123", hashed) is True
        assert verify_password("password123", hashed) is False
        assert verify_password("PASSWORD123", hashed) is False

    def test_verify_password_special_characters(self):
        """Test verifying password with special characters."""
        password = "P@$$w0rd!#%^&*()"
        hashed = hash_password(password)
        
        assert verify_password(password, hashed) is True
        assert verify_password("wrong", hashed) is False

    def test_verify_password_with_wrong_hash(self):
        """Test verifying against wrong hash returns False."""
        password = "correctpassword"
        wrong_hash = hash_password("someotherpassword")
        
        result = verify_password(password, wrong_hash)
        
        assert result is False

    def test_verify_password_empty_password(self):
        """Test verifying empty password."""
        password = ""
        hashed = hash_password(password)
        
        assert verify_password(password, hashed) is True
        assert verify_password("notempty", hashed) is False


class TestCreateUser:
    """Tests for create_user function."""

    def test_create_user_success(self, db_session: Session):
        """Test successful user creation."""
        phone = "13800138002"
        password = "testpassword123"
        username = "testuser"
        
        user = create_user(db_session, phone, password, username)
        
        assert user is not None
        assert user.id is not None
        assert user.phone == phone
        assert user.username == username
        assert user.hashed_password is not None
        assert user.hashed_password != password  # Password should be hashed
        assert user.is_active is True
        assert user.is_admin is False

    def test_create_user_password_is_hashed(self, db_session: Session):
        """Test that user creation properly hashes the password."""
        password = "secretpassword"
        user = create_user(db_session, "13800138003", password)
        
        # Password should not be stored in plain text
        assert user.hashed_password != password
        # But should be verifiable
        assert verify_password(password, user.hashed_password) is True

    def test_create_user_without_username(self, db_session: Session):
        """Test creating user without username."""
        phone = "13800138004"
        password = "testpassword"
        
        user = create_user(db_session, phone, password, username=None)
        
        assert user is not None
        assert user.phone == phone
        assert user.username is None

    def test_create_user_persisted_to_database(self, db_session: Session):
        """Test that created user is persisted to database."""
        phone = "13800138005"
        password = "testpassword"
        
        user = create_user(db_session, phone, password)
        
        # Query the database for the user
        db_user = db_session.query(User).filter(User.phone == phone).first()
        
        assert db_user is not None
        assert db_user.id == user.id
        assert db_user.phone == phone

    def test_create_multiple_users_have_unique_ids(self, db_session: Session):
        """Test that multiple users have unique IDs."""
        user1 = create_user(db_session, "13800138010", "password1")
        user2 = create_user(db_session, "13800138011", "password2")
        user3 = create_user(db_session, "13800138012", "password3")
        
        assert user1.id != user2.id != user3.id


class TestGetUserByPhone:
    """Tests for get_user_by_phone function."""

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
        password = "testpassword"
        
        # Create user
        created_user = create_user(db_session, phone, password)
        
        # Retrieve user
        retrieved_user = get_user_by_phone(db_session, phone)
        
        assert retrieved_user is not None
        assert retrieved_user.id == created_user.id
        assert retrieved_user.phone == phone


class TestGetUserById:
    """Tests for get_user_by_id function."""

    def test_get_existing_user_by_id(self, db_session: Session, test_user: User):
        """Test getting an existing user by ID."""
        user = get_user_by_id(db_session, test_user.id)
        
        assert user is not None
        assert user.id == test_user.id
        assert user.phone == test_user.phone

    def test_get_nonexistent_user_by_id(self, db_session: Session):
        """Test getting a non-existent user by ID returns None."""
        user = get_user_by_id(db_session, 99999)
        
        assert user is None

    def test_get_user_by_id_with_zero(self, db_session: Session):
        """Test getting user with ID 0 returns None."""
        user = get_user_by_id(db_session, 0)
        
        assert user is None

    def test_get_user_by_id_with_negative(self, db_session: Session):
        """Test getting user with negative ID returns None."""
        user = get_user_by_id(db_session, -1)
        
        assert user is None


class TestAuthenticateUser:
    """Tests for authenticate_user function."""

    def test_authenticate_valid_user(self, db_session: Session, test_user: User):
        """Test authenticating with valid credentials."""
        user = authenticate_user(db_session, test_user.phone, "abcd1234")
        
        assert user is not None
        assert user.id == test_user.id
        assert user.phone == test_user.phone

    def test_authenticate_wrong_password(self, db_session: Session, test_user: User):
        """Test authenticating with wrong password returns None."""
        user = authenticate_user(db_session, test_user.phone, "wrongpassword")
        
        assert user is None

    def test_authenticate_nonexistent_user(self, db_session: Session):
        """Test authenticating non-existent user returns None."""
        user = authenticate_user(db_session, "99999999999", "anypassword")
        
        assert user is None

    def test_authenticate_with_empty_password(self, db_session: Session):
        """Test authenticating with empty password."""
        phone = "13800138999"
        password = ""
        
        # Create user with empty password
        create_user(db_session, phone, password)
        
        # Should be able to authenticate with empty password
        user = authenticate_user(db_session, phone, password)
        
        assert user is not None

    def test_authenticate_inactive_user(self, db_session: Session, test_user_inactive: User):
        """Test that authentication still works for inactive user (auth only, not permission check)."""
        # Note: This test documents current behavior
        # The authenticate_user function doesn't check is_active
        user = authenticate_user(db_session, test_user_inactive.phone, "abcd1234")
        
        # Currently auth succeeds even for inactive users
        # This might need to be changed based on business requirements
        assert user is not None
        assert user.is_active is False

    def test_authenticate_password_case_sensitive(self, db_session: Session):
        """Test that password authentication is case sensitive."""
        phone = "13800139000"
        password = "MyPassword123"
        
        create_user(db_session, phone, password)
        
        assert authenticate_user(db_session, phone, "MyPassword123") is not None
        assert authenticate_user(db_session, phone, "mypassword123") is None
        assert authenticate_user(db_session, phone, "MYPASSWORD123") is None


class TestAuthServiceIntegration:
    """Integration tests for auth service."""

    def test_full_user_lifecycle(self, db_session: Session):
        """Test complete user lifecycle: create, get, authenticate."""
        phone = "13800139999"
        password = "complex_password_123"
        username = "integrationuser"
        
        # Create user
        user = create_user(db_session, phone, password, username)
        assert user is not None
        assert user.id is not None
        
        # Get user by phone
        retrieved = get_user_by_phone(db_session, phone)
        assert retrieved is not None
        assert retrieved.id == user.id
        
        # Get user by ID
        by_id = get_user_by_id(db_session, user.id)
        assert by_id is not None
        assert by_id.phone == phone
        
        # Authenticate user
        authed = authenticate_user(db_session, phone, password)
        assert authed is not None
        assert authed.id == user.id
        
        # Wrong password should fail
        assert authenticate_user(db_session, phone, "wrong") is None

    def test_password_verification_after_hashing(self):
        """Test that passwords can be verified after being hashed."""
        password = "secure_password_!@#$"
        
        hashed = hash_password(password)
        
        assert verify_password(password, hashed) is True
        assert verify_password(password + "x", hashed) is False