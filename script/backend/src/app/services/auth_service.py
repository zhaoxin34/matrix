"""Authentication service."""

import json
import random
from datetime import UTC, datetime, timedelta
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import settings
from app.models.user import User
from app.schemas.auth import (
    PasswordResetConfirm,
    PasswordResetRequest,
    SMSCodeRequest,
    SMSCodeVerify,
    TokenResponse,
    UserLogin,
    UserRegister,
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


def create_access_token(user_id: int, expires_delta: timedelta | None = None) -> str:
    """Create JWT access token."""
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    expire = datetime.now(UTC) + expires_delta
    payload = {
        "sub": str(user_id),
        "exp": expire,
        "iat": datetime.now(UTC),
        "type": "access",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(user_id: int) -> str:
    """Create JWT refresh token."""
    expires_delta = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    expire = datetime.now(UTC) + expires_delta
    payload = {
        "sub": str(user_id),
        "exp": expire,
        "iat": datetime.now(UTC),
        "type": "refresh",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict[str, Any] | None:
    """Decode and validate JWT token."""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None


class AuthService:
    """Authentication service."""

    def __init__(self, db: Session):
        self.db = db

    def get_user_by_phone(self, phone: str) -> User | None:
        """Get user by phone number."""
        return self.db.query(User).filter(User.phone == phone).first()

    def get_user_by_id(self, user_id: int) -> User | None:
        """Get user by ID."""
        return self.db.query(User).filter(User.id == user_id).first()

    def create_user(self, user_data: UserRegister) -> User:
        """Create a new user with hashed password."""
        hashed_pw = hash_password(user_data.password)
        user = User(
            username=user_data.username,
            phone=user_data.phone,
            email=user_data.email,
            hashed_password=hashed_pw,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def authenticate(self, login_data: UserLogin) -> TokenResponse:
        """Authenticate user and return tokens."""
        user = self.get_user_by_phone(login_data.phone)
        if not user:
            raise ValueError("手机号或密码错误")

        # Check if account is locked
        if user.locked_until and user.locked_until > datetime.now(UTC):
            raise ValueError(f"账号已锁定，请于 {user.locked_until.strftime('%H:%M')} 后重试")

        if not verify_password(login_data.password, user.hashed_password):
            # Track failed attempts
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= 5:
                user.locked_until = datetime.now(UTC) + timedelta(minutes=15)
                user.failed_login_attempts = 0
            self.db.commit()
            raise ValueError("手机号或密码错误")

        # Reset failed attempts on successful login
        user.failed_login_attempts = 0
        user.locked_until = None
        self.db.commit()

        return self._create_tokens_for_user(user)

    def _create_tokens_for_user(self, user: User) -> TokenResponse:
        """Create access and refresh tokens for user."""
        access_token = create_access_token(user.id)
        refresh_token = create_refresh_token(user.id)
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
        )

    def refresh_access_token(self, refresh_token: str) -> TokenResponse:
        """Refresh access token using refresh token."""
        payload = decode_token(refresh_token)
        if not payload:
            raise ValueError("无效的刷新令牌")

        if payload.get("type") != "refresh":
            raise ValueError("无效的令牌类型")

        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("无效的令牌")

        user = self.get_user_by_id(int(user_id))
        if not user:
            raise ValueError("用户不存在")

        return self._create_tokens_for_user(user)

    def logout(self, refresh_token: str) -> bool:
        """Logout user (invalidate refresh token)."""
        # For simplicity, we just validate the token exists
        # In production, you'd add it to a blacklist
        payload = decode_token(refresh_token)
        return payload is not None

    def request_password_reset(self, data: PasswordResetRequest) -> bool:
        """Generate password reset code."""
        user = self.get_user_by_phone(data.phone)
        if not user:
            # Don't reveal if phone exists
            return True

        # Generate 6-digit code
        code = "".join([str(random.randint(0, 9)) for _ in range(6)])
        user.sms_code = code
        user.sms_code_expires_at = datetime.now(UTC) + timedelta(minutes=5)
        self.db.commit()

        # In production, send SMS here
        print(f"[SMS Mock] Code for {data.phone}: {code}")
        return True

    def reset_password(self, data: PasswordResetConfirm) -> bool:
        """Reset password with verification code."""
        user = self.get_user_by_phone(data.phone)
        if not user:
            raise ValueError("无效的请求")

        # Verify code
        if not user.sms_code or user.sms_code != data.code:
            raise ValueError("验证码错误")

        if not user.sms_code_expires_at or user.sms_code_expires_at < datetime.now(UTC):
            raise ValueError("验证码已过期")

        # Check password history
        if user.password_history:
            history = json.loads(user.password_history)
            for old_hash in history[-5:]:
                if verify_password(data.new_password, old_hash):
                    raise ValueError("不能使用最近使用过的密码")

        # Save old password to history
        old_history = json.loads(user.password_history) if user.password_history else []
        old_history.append(user.hashed_password)
        if len(old_history) > 5:
            old_history = old_history[-5:]
        user.password_history = json.dumps(old_history)

        # Update password
        user.hashed_password = hash_password(data.new_password)
        user.sms_code = None
        user.sms_code_expires_at = None
        user.password_reset_token = None
        self.db.commit()
        return True

    def send_sms_code(self, data: SMSCodeRequest) -> bool:
        """Send SMS verification code."""
        user = self.get_user_by_phone(data.phone)
        if not user:
            raise ValueError("用户不存在")

        # Rate limit: 5 per hour
        if user.sms_code_expires_at and user.sms_code_expires_at > datetime.now(UTC):
            # Check if we recently sent one
            pass  # In production, check Redis for rate limiting

        code = "".join([str(random.randint(0, 9)) for _ in range(6)])
        user.sms_code = code
        user.sms_code_expires_at = datetime.now(UTC) + timedelta(minutes=5)
        self.db.commit()

        print(f"[SMS Mock] Code for {data.phone}: {code}")
        return True

    def verify_sms_code(self, data: SMSCodeVerify) -> bool:
        """Verify SMS code."""
        user = self.get_user_by_phone(data.phone)
        if not user:
            return False

        if not user.sms_code or user.sms_code != data.code:
            return False

        if not user.sms_code_expires_at or user.sms_code_expires_at < datetime.now(UTC):
            return False

        return True

    def get_current_user(self, token: str) -> User | None:
        """Get current user from JWT token."""
        payload = decode_token(token)
        if not payload:
            return None

        if payload.get("type") != "access":
            return None

        user_id = payload.get("sub")
        if not user_id:
            return None

        return self.get_user_by_id(int(user_id))
