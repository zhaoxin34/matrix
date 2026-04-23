"""Tests for AuthService."""

import pytest
from unittest.mock import MagicMock, patch
from datetime import timedelta

from app.services.auth_service import (
    AuthService,
    verify_password,
    hash_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.models.user import User
from app.schemas.auth import UserLogin, UserRegister


class TestPasswordFunctions:
    """Test password utility functions."""

    def test_hash_password(self):
        """Test password hashing."""
        password = "testpassword123"
        hashed = hash_password(password)

        assert hashed is not None
        assert hashed != password
        assert len(hashed) > 0

    def test_verify_password_correct(self):
        """Test password verification with correct password."""
        password = "testpassword123"
        hashed = hash_password(password)

        assert verify_password(password, hashed) is True

    def test_verify_password_wrong(self):
        """Test password verification with wrong password."""
        password = "testpassword123"
        hashed = hash_password(password)

        assert verify_password("wrongpassword", hashed) is False

    def test_create_access_token(self, mock_settings):
        """Test access token creation."""
        with patch("app.services.auth_service.settings", mock_settings):
            token = create_access_token(user_id=1)

        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0

    def test_create_access_token_with_custom_expiry(self, mock_settings):
        """Test access token creation with custom expiry."""
        with patch("app.services.auth_service.settings", mock_settings):
            token = create_access_token(user_id=1, expires_delta=timedelta(hours=1))

        assert token is not None
        assert isinstance(token, str)

    def test_create_refresh_token(self, mock_settings):
        """Test refresh token creation."""
        with patch("app.services.auth_service.settings", mock_settings):
            token = create_refresh_token(user_id=1)

        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0

    def test_decode_token_valid(self, mock_settings):
        """Test decoding valid token."""
        with patch("app.services.auth_service.settings", mock_settings):
            token = create_access_token(user_id=1)
            payload = decode_token(token)

        assert payload is not None
        assert payload["sub"] == "1"
        assert payload["type"] == "access"

    def test_decode_token_invalid(self, mock_settings):
        """Test decoding invalid token returns None."""
        with patch("app.services.auth_service.settings", mock_settings):
            result = decode_token("invalid.token.here")

        assert result is None


class TestAuthService:
    """Test AuthService class."""

    def test_get_user_by_username_found(self, mock_db, sample_user):
        """Test getting user by username when user exists."""
        mock_db.query.return_value.filter.return_value.first.return_value = sample_user
        service = AuthService(mock_db)
        user = service.get_user_by_username("testuser")

        assert user is not None
        assert user.id == sample_user.id
        assert user.username == "testuser"

    def test_get_user_by_username_not_found(self, mock_db):
        """Test getting user by username when user does not exist."""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        service = AuthService(mock_db)
        user = service.get_user_by_username("nonexistent")

        assert user is None

    def test_get_user_by_email(self, mock_db, sample_user):
        """Test getting user by email."""
        mock_db.query.return_value.filter.return_value.first.return_value = sample_user
        service = AuthService(mock_db)
        user = service.get_user_by_email("test@example.com")

        assert user is not None
        assert user.email == "test@example.com"

    def test_get_user_by_phone(self, mock_db, sample_user):
        """Test getting user by phone."""
        mock_db.query.return_value.filter.return_value.first.return_value = sample_user
        service = AuthService(mock_db)
        user = service.get_user_by_phone("13800138000")

        assert user is not None
        assert user.phone == "13800138000"

    def test_get_user_by_id(self, mock_db, sample_user):
        """Test getting user by ID."""
        mock_db.query.return_value.filter.return_value.first.return_value = sample_user
        service = AuthService(mock_db)
        user = service.get_user_by_id(1)

        assert user is not None
        assert user.id == 1

    def test_create_user(self, mock_db):
        """Test creating a new user."""
        service = AuthService(mock_db)
        user_data = UserRegister(
            username="newuser",
            email="new@example.com",
            phone="13900000000",
            password="password123",
        )

        mock_db.add = MagicMock()
        mock_db.commit = MagicMock()
        mock_db.refresh = MagicMock()

        service.create_user(user_data)

        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()

    def test_authenticate_success(self, mock_db, sample_user):
        """Test successful authentication."""
        service = AuthService(mock_db)
        login_data = UserLogin(phone="13800138000", password="password123")

        mock_db.query.return_value.filter.return_value.first.return_value = sample_user

        with patch("app.services.auth_service.verify_password", return_value=True):
            with patch("app.services.auth_service.create_access_token", return_value="access_token"):
                with patch("app.services.auth_service.create_refresh_token", return_value="refresh_token"):
                    response = service.authenticate(login_data)

        assert response is not None
        assert response.access_token == "access_token"
        assert response.refresh_token == "refresh_token"

    def test_authenticate_wrong_password(self, mock_db, sample_user):
        """Test authentication with wrong password raises error."""
        service = AuthService(mock_db)
        login_data = UserLogin(phone="13800138000", password="wrongpassword")

        mock_db.query.return_value.filter.return_value.first.return_value = sample_user

        with patch("app.services.auth_service.verify_password", return_value=False):
            with pytest.raises(ValueError, match="用户名或密码错误"):
                service.authenticate(login_data)

    def test_authenticate_user_not_found(self, mock_db):
        """Test authentication with non-existent user raises error."""
        service = AuthService(mock_db)
        login_data = UserLogin(phone="13999999999", password="password123")

        mock_db.query.return_value.filter.return_value.first.return_value = None

        with pytest.raises(ValueError, match="用户名或密码错误"):
            service.authenticate(login_data)

    def test_get_current_user_valid_token(self, mock_db, sample_user, mock_settings):
        """Test getting current user with valid token."""
        service = AuthService(mock_db)

        with patch("app.services.auth_service.settings", mock_settings):
            with patch("app.services.auth_service.decode_token") as mock_decode:
                mock_decode.return_value = {"sub": "1", "type": "access"}
                mock_db.query.return_value.filter.return_value.first.return_value = sample_user
                user = service.get_current_user("valid_token")

        assert user is not None
        assert user.id == 1

    def test_get_current_user_invalid_token(self, mock_db, mock_settings):
        """Test getting current user with invalid token returns None."""
        service = AuthService(mock_db)

        with patch("app.services.auth_service.settings", mock_settings):
            with patch("app.services.auth_service.decode_token", return_value=None):
                user = service.get_current_user("invalid_token")

        assert user is None

    def test_get_current_user_wrong_token_type(self, mock_db, mock_settings):
        """Test getting current user with wrong token type returns None."""
        service = AuthService(mock_db)

        with patch("app.services.auth_service.settings", mock_settings):
            with patch("app.services.auth_service.decode_token") as mock_decode:
                mock_decode.return_value = {"sub": "1", "type": "refresh"}
                user = service.get_current_user("refresh_token")

        assert user is None

    def test_logout(self, mock_db, mock_settings):
        """Test logout returns True."""
        service = AuthService(mock_db)

        with patch("app.services.auth_service.settings", mock_settings):
            with patch("app.services.auth_service.decode_token") as mock_decode:
                mock_decode.return_value = {"sub": "1"}
                result = service.logout("valid_token")

        assert result is True