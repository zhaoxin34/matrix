"""Unit tests for auth service."""

import os
import sys
from datetime import UTC, datetime, timedelta
from unittest.mock import patch

import pytest

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

# Set test environment before importing app modules
os.environ["SECRET_KEY"] = "test-secret-key-for-testing-only"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "30"
os.environ["REFRESH_TOKEN_EXPIRE_DAYS"] = "7"

from app.schemas.auth import PasswordResetConfirm, PasswordResetRequest, SMSCodeRequest, SMSCodeVerify, UserLogin
from app.services.auth_service import (
    AuthService,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)


class TestPasswordHashing:
    """Tests for password hashing functions.

    Note: These tests use real bcrypt via passlib. If bcrypt version compatibility
    causes issues (ValueError about 72 bytes), these tests will fail with a library-level
    error. This indicates a passlib/bcrypt version mismatch in the environment, not a code bug.
    """

    def test_hash_password(self):
        """Verify password hashing works and produces different hashes."""
        password = "ShortPass1"
        hash1 = hash_password(password)
        hash2 = hash_password(password)

        # Hash should not be empty
        assert hash1
        # Same password should produce different hashes (due to salt)
        assert hash1 != hash2
        # Hashes should be bcrypt-like format
        assert hash1.startswith("$2b$")

    def test_verify_password_correct(self):
        """Verify correct password matches hash."""
        password = "ShortPass1"
        hashed = hash_password(password)

        assert verify_password(password, hashed) is True

    def test_verify_password_incorrect(self):
        """Verify incorrect password does not match hash."""
        password = "ShortPass1"
        hashed = hash_password(password)

        assert verify_password("WrongPass1", hashed) is False


class TestJWTTokens:
    """Tests for JWT token functions."""

    def test_create_access_token(self):
        """Verify JWT access token is created with correct structure."""
        user_id = 1
        token = create_access_token(user_id)

        assert token
        assert isinstance(token, str)
        # Decode and verify structure
        payload = decode_token(token)
        assert payload is not None
        # sub is encoded as string per JWT RFC 7519
        assert payload["sub"] == str(user_id)
        assert payload["type"] == "access"
        assert "exp" in payload
        assert "iat" in payload

    def test_create_refresh_token(self):
        """Verify JWT refresh token is created."""
        user_id = 1
        token = create_refresh_token(user_id)

        assert token
        assert isinstance(token, str)
        payload = decode_token(token)
        assert payload is not None
        # sub is encoded as string per JWT RFC 7519
        assert payload["sub"] == str(user_id)
        assert payload["type"] == "refresh"

    def test_decode_token_valid(self):
        """Verify valid tokens decode correctly."""
        user_id = 42
        token = create_access_token(user_id)

        payload = decode_token(token)
        assert payload is not None
        # sub is encoded as string per JWT RFC 7519
        assert payload["sub"] == str(user_id)
        assert payload["type"] == "access"

    def test_decode_token_invalid(self):
        """Verify invalid tokens return None."""
        assert decode_token("invalid.token.here") is None
        assert decode_token("") is None


class TestAuthService:
    """Tests for AuthService class with mocked password functions."""

    @pytest.fixture
    def mock_passwords(self):
        """Mock password hashing for AuthService tests."""
        with (
            patch("app.services.auth_service.hash_password") as mock_hash,
            patch("app.services.auth_service.verify_password") as mock_verify,
        ):
            # Configure mock to hash passwords but also track calls
            mock_hash.side_effect = lambda p: f"hashed_{p}"
            mock_verify.side_effect = lambda p, h: h == f"hashed_{p}"
            yield {"hash": mock_hash, "verify": mock_verify}

    def test_authenticate_success(self, mock_db, sample_user, mock_passwords):
        """Mock db + user, verify tokens returned."""
        # Setup mock to return our sample user
        mock_db.query.return_value.filter.return_value.first.return_value = sample_user

        service = AuthService(mock_db)
        login_data = UserLogin(phone="13800138000", password="Test1234")

        result = service.authenticate(login_data)

        assert result.access_token
        assert result.refresh_token
        assert result.token_type == "bearer"

    def test_authenticate_wrong_password(self, mock_db, sample_user, mock_passwords):
        """Verify ValueError raised for wrong password."""
        mock_db.query.return_value.filter.return_value.first.return_value = sample_user

        service = AuthService(mock_db)
        login_data = UserLogin(phone="13800138000", password="WrongPassword")

        with pytest.raises(ValueError, match="手机号或密码错误"):
            service.authenticate(login_data)

    def test_authenticate_user_not_found(self, mock_db):
        """Verify ValueError raised when user not found."""
        mock_db.query.return_value.filter.return_value.first.return_value = None

        service = AuthService(mock_db)
        login_data = UserLogin(phone="13900139000", password="Test1234")

        with pytest.raises(ValueError, match="手机号或密码错误"):
            service.authenticate(login_data)

    def test_authenticate_account_locked(self, mock_db, sample_user):
        """Verify lock check works."""
        # Set lock time to future
        sample_user.locked_until = datetime.now(UTC) + timedelta(minutes=15)
        mock_db.query.return_value.filter.return_value.first.return_value = sample_user

        service = AuthService(mock_db)
        login_data = UserLogin(phone="13800138000", password="Test1234")

        with pytest.raises(ValueError, match="账号已锁定"):
            service.authenticate(login_data)

    def test_authenticate_increments_failed_attempts(self, mock_db, sample_user, mock_passwords):
        """Verify failed attempts tracked."""
        sample_user.failed_login_attempts = 3
        mock_db.query.return_value.filter.return_value.first.return_value = sample_user

        service = AuthService(mock_db)
        login_data = UserLogin(phone="13800138000", password="WrongPassword")

        with pytest.raises(ValueError):
            service.authenticate(login_data)

        # Verify failed attempts were incremented
        assert sample_user.failed_login_attempts == 4
        mock_db.commit.assert_called()

    def test_authenticate_locks_after_five_attempts(self, mock_db, sample_user, mock_passwords):
        """Verify account is locked after 5 failed attempts."""
        sample_user.failed_login_attempts = 4
        mock_db.query.return_value.filter.return_value.first.return_value = sample_user

        service = AuthService(mock_db)
        login_data = UserLogin(phone="13800138000", password="WrongPassword")

        with pytest.raises(ValueError):
            service.authenticate(login_data)

        # Should be locked now
        assert sample_user.locked_until is not None
        assert sample_user.locked_until > datetime.now(UTC)
        # Failed attempts should be reset
        assert sample_user.failed_login_attempts == 0

    def test_refresh_access_token(self, mock_db, sample_user):
        """Verify refresh token exchange works."""
        # Create a valid refresh token
        refresh_token = create_refresh_token(sample_user.id)
        mock_db.query.return_value.filter.return_value.first.return_value = sample_user

        service = AuthService(mock_db)
        result = service.refresh_access_token(refresh_token)

        assert result.access_token
        assert result.refresh_token
        assert result.token_type == "bearer"

    def test_refresh_access_token_invalid(self, mock_db):
        """Verify invalid refresh token raises error."""
        service = AuthService(mock_db)

        with pytest.raises(ValueError, match="无效的刷新令牌"):
            service.refresh_access_token("invalid.token")

    def test_refresh_access_token_wrong_type(self, mock_db):
        """Verify access token used as refresh raises error."""
        access_token = create_access_token(1)
        service = AuthService(mock_db)

        with pytest.raises(ValueError, match="无效的令牌类型"):
            service.refresh_access_token(access_token)


class TestPasswordReset:
    """Tests for password reset functionality with mocked passwords."""

    @pytest.fixture
    def mock_passwords(self):
        """Mock password hashing for password reset tests."""
        with (
            patch("app.services.auth_service.hash_password") as mock_hash,
            patch("app.services.auth_service.verify_password") as mock_verify,
        ):
            mock_hash.side_effect = lambda p: f"hashed_{p}"
            mock_verify.side_effect = lambda p, h: h == f"hashed_{p}"
            yield {"hash": mock_hash, "verify": mock_verify}

    def test_request_password_reset(self, mock_db, sample_user):
        """Verify password reset code is generated."""
        mock_db.query.return_value.filter.return_value.first.return_value = sample_user

        service = AuthService(mock_db)
        data = PasswordResetRequest(phone="13800138000")

        result = service.request_password_reset(data)

        assert result is True
        assert sample_user.sms_code is not None
        assert len(sample_user.sms_code) == 6
        assert sample_user.sms_code_expires_at is not None
        mock_db.commit.assert_called()

    def test_reset_password(self, mock_db, sample_user, mock_passwords):
        """Verify password reset with valid code."""
        # Set up valid SMS code
        sample_user.sms_code = "123456"
        sample_user.sms_code_expires_at = datetime.now(UTC) + timedelta(minutes=5)
        sample_user.password_history = None
        mock_db.query.return_value.filter.return_value.first.return_value = sample_user

        service = AuthService(mock_db)
        data = PasswordResetConfirm(phone="13800138000", code="123456", new_password="NewPassword123")

        result = service.reset_password(data)

        assert result is True
        assert sample_user.hashed_password is not None
        assert sample_user.sms_code is None
        mock_db.commit.assert_called()

    def test_reset_password_invalid_code(self, mock_db, sample_user):
        """Verify invalid code raises error."""
        sample_user.sms_code = "123456"
        sample_user.sms_code_expires_at = datetime.now(UTC) + timedelta(minutes=5)
        mock_db.query.return_value.filter.return_value.first.return_value = sample_user

        service = AuthService(mock_db)
        data = PasswordResetConfirm(phone="13800138000", code="000000", new_password="NewPassword123")

        with pytest.raises(ValueError, match="验证码错误"):
            service.reset_password(data)

    def test_reset_password_expired_code(self, mock_db, sample_user):
        """Verify expired code raises error."""
        sample_user.sms_code = "123456"
        sample_user.sms_code_expires_at = datetime.now(UTC) - timedelta(minutes=1)
        mock_db.query.return_value.filter.return_value.first.return_value = sample_user

        service = AuthService(mock_db)
        data = PasswordResetConfirm(phone="13800138000", code="123456", new_password="NewPassword123")

        with pytest.raises(ValueError, match="验证码已过期"):
            service.reset_password(data)


class TestSMSCode:
    """Tests for SMS code functionality."""

    def test_send_sms_code(self, mock_db, sample_user):
        """Verify SMS code is sent."""
        mock_db.query.return_value.filter.return_value.first.return_value = sample_user

        service = AuthService(mock_db)
        data = SMSCodeRequest(phone="13800138000")

        result = service.send_sms_code(data)

        assert result is True
        assert sample_user.sms_code is not None
        assert len(sample_user.sms_code) == 6

    def test_verify_sms_code_valid(self, mock_db, sample_user):
        """Verify valid SMS code verification."""
        sample_user.sms_code = "123456"
        sample_user.sms_code_expires_at = datetime.now(UTC) + timedelta(minutes=5)
        mock_db.query.return_value.filter.return_value.first.return_value = sample_user

        service = AuthService(mock_db)
        data = SMSCodeVerify(phone="13800138000", code="123456")

        result = service.verify_sms_code(data)

        assert result is True

    def test_verify_sms_code_invalid(self, mock_db, sample_user):
        """Verify invalid code returns False."""
        sample_user.sms_code = "123456"
        sample_user.sms_code_expires_at = datetime.now(UTC) + timedelta(minutes=5)
        mock_db.query.return_value.filter.return_value.first.return_value = sample_user

        service = AuthService(mock_db)
        data = SMSCodeVerify(phone="13800138000", code="000000")

        result = service.verify_sms_code(data)

        assert result is False

    def test_verify_sms_code_expired(self, mock_db, sample_user):
        """Verify expired code returns False."""
        sample_user.sms_code = "123456"
        sample_user.sms_code_expires_at = datetime.now(UTC) - timedelta(minutes=1)
        mock_db.query.return_value.filter.return_value.first.return_value = sample_user

        service = AuthService(mock_db)
        data = SMSCodeVerify(phone="13800138000", code="123456")

        result = service.verify_sms_code(data)

        assert result is False


class TestGetCurrentUser:
    """Tests for get_current_user method."""

    def test_get_current_user_valid_token(self, mock_db, sample_user):
        """Verify valid access token returns user."""
        token = create_access_token(sample_user.id)
        mock_db.query.return_value.filter.return_value.first.return_value = sample_user

        service = AuthService(mock_db)
        user = service.get_current_user(token)

        assert user is not None
        assert user.id == sample_user.id

    def test_get_current_user_invalid_token(self, mock_db):
        """Verify invalid token returns None."""
        service = AuthService(mock_db)
        user = service.get_current_user("invalid.token")

        assert user is None

    def test_get_current_user_refresh_token(self, mock_db, sample_user):
        """Verify refresh token does not grant access."""
        token = create_refresh_token(sample_user.id)
        service = AuthService(mock_db)

        user = service.get_current_user(token)

        assert user is None


class TestLogout:
    """Tests for logout functionality."""

    def test_logout_valid_token(self, mock_db, sample_user):
        """Verify logout with valid token."""
        token = create_refresh_token(sample_user.id)
        service = AuthService(mock_db)

        result = service.logout(token)

        assert result is True

    def test_logout_invalid_token(self, mock_db):
        """Verify logout with invalid token returns False."""
        service = AuthService(mock_db)

        result = service.logout("invalid.token")

        assert result is False
