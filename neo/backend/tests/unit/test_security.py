"""Tests for security module (JWT token operations)."""

from datetime import timedelta

import pytest

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
)


class TestCreateAccessToken:
    """Tests for create_access_token function."""

    def test_create_access_token_returns_string(self):
        """Test that create_access_token returns a JWT string."""
        user_id = 1
        token = create_access_token(user_id)
        
        assert isinstance(token, str)
        assert len(token) > 0
        # JWT has 3 parts separated by dots
        assert token.count(".") == 2

    def test_create_access_token_with_custom_user_id(self):
        """Test access token creation with various user IDs."""
        user_id = 12345
        token = create_access_token(user_id)
        payload = decode_token(token)
        
        assert payload is not None
        assert payload["sub"] == str(user_id)
        assert payload["type"] == "access"

    def test_create_access_token_with_string_user_id(self):
        """Test access token creation with string user ID."""
        user_id = "user_abc_123"
        token = create_access_token(user_id)
        payload = decode_token(token)
        
        assert payload is not None
        assert payload["sub"] == user_id

    def test_create_access_token_with_custom_expires_delta(self):
        """Test access token creation with custom expiration time."""
        user_id = 1
        custom_delta = timedelta(hours=2)
        token = create_access_token(user_id, expires_delta=custom_delta)
        payload = decode_token(token)
        
        assert payload is not None
        assert "exp" in payload
        assert payload["type"] == "access"

    def test_create_access_token_has_required_claims(self):
        """Test that access token contains all required claims."""
        user_id = 42
        token = create_access_token(user_id)
        payload = decode_token(token)
        
        assert payload is not None
        assert "sub" in payload
        assert "exp" in payload
        assert "iat" in payload
        assert "type" in payload
        assert payload["type"] == "access"


class TestCreateRefreshToken:
    """Tests for create_refresh_token function."""

    def test_create_refresh_token_returns_string(self):
        """Test that create_refresh_token returns a JWT string."""
        user_id = 1
        token = create_refresh_token(user_id)
        
        assert isinstance(token, str)
        assert len(token) > 0
        assert token.count(".") == 2

    def test_create_refresh_token_contains_correct_type(self):
        """Test that refresh token has correct type claim."""
        user_id = 1
        token = create_refresh_token(user_id)
        payload = decode_token(token)
        
        assert payload is not None
        assert payload["type"] == "refresh"
        assert payload["sub"] == str(user_id)

    def test_create_refresh_token_has_longer_expiration(self):
        """Test that refresh token has longer expiration than access token."""
        user_id = 1
        access_token = create_access_token(user_id)
        refresh_token = create_refresh_token(user_id)
        
        access_payload = decode_token(access_token)
        refresh_payload = decode_token(refresh_token)
        
        assert access_payload is not None
        assert refresh_payload is not None
        # Refresh token should have longer expiration (7 days vs default 24 hours)
        assert refresh_payload["exp"] > access_payload["exp"]


class TestDecodeToken:
    """Tests for decode_token function."""

    def test_decode_valid_token_returns_payload(self):
        """Test decoding a valid token returns the payload."""
        user_id = 1
        token = create_access_token(user_id)
        payload = decode_token(token)
        
        assert payload is not None
        assert isinstance(payload, dict)
        assert "sub" in payload
        assert payload["sub"] == str(user_id)

    def test_decode_invalid_token_returns_none(self):
        """Test decoding an invalid token returns None."""
        invalid_token = "invalid.token.here"
        payload = decode_token(invalid_token)
        
        assert payload is None

    def test_decode_malformed_token_returns_none(self):
        """Test decoding a malformed token returns None."""
        malformed_token = "not-a-jwt-at-all"
        payload = decode_token(malformed_token)
        
        assert payload is None

    def test_decode_empty_string_returns_none(self):
        """Test decoding an empty string returns None."""
        payload = decode_token("")
        
        assert payload is None

    def test_decode_token_with_wrong_secret_returns_none(self):
        """Test decoding a token signed with different secret returns None."""
        import os
        from jose import jwt
        
        # Create token with different secret
        original_secret = os.environ.get("JWT_SECRET_KEY", "")
        try:
            os.environ["JWT_SECRET_KEY"] = "different-secret-key"
            # Need to reload config to use new secret
            from importlib import reload
            import app.config
            reload(app.config)
            
            token = jwt.encode(
                {"sub": "1", "exp": 9999999999},
                "different-secret-key",
                algorithm="HS256"
            )
            payload = decode_token(token)
            
            assert payload is None
        finally:
            # Restore original secret
            os.environ["JWT_SECRET_KEY"] = original_secret
            import app.config
            reload(app.config)

    def test_decode_token_extracts_all_claims(self):
        """Test that all expected claims are extracted from token."""
        user_id = 99
        token = create_access_token(user_id)
        payload = decode_token(token)
        
        assert payload is not None
        assert payload["sub"] == "99"
        assert "exp" in payload
        assert "iat" in payload
        assert "type" in payload

    def test_decode_token_without_expiration(self):
        """Test decoding a token without expiration claim."""
        from jose import jwt
        from app.config import settings
        
        # Create token without expiration
        token = jwt.encode(
            {"sub": "1", "iat": 9999999999},
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )
        payload = decode_token(token)
        
        assert payload is not None
        assert payload["sub"] == "1"

    def test_decode_expired_token_returns_none(self):
        """Test decoding an expired token returns None."""
        from app.config import settings
        
        # Create an already expired token
        expired_token = create_access_token(
            user_id=1,
            expires_delta=timedelta(seconds=-1)  # Already expired
        )
        payload = decode_token(expired_token)
        
        assert payload is None


class TestTokenRoundTrip:
    """Integration tests for token creation and decoding."""

    def test_access_token_roundtrip(self):
        """Test that creating and decoding access token preserves data."""
        user_id = 42
        token = create_access_token(user_id)
        payload = decode_token(token)
        
        assert payload is not None
        assert payload["sub"] == str(user_id)
        assert payload["type"] == "access"

    def test_refresh_token_roundtrip(self):
        """Test that creating and decoding refresh token preserves data."""
        user_id = 42
        token = create_refresh_token(user_id)
        payload = decode_token(token)
        
        assert payload is not None
        assert payload["sub"] == str(user_id)
        assert payload["type"] == "refresh"

    def test_multiple_tokens_created_with_delay_are_unique(self):
        """Test that tokens created with time delay produce different tokens.
        
        JWT iat claims have second precision, so we need to sleep at least 1 second
        to ensure different timestamps.
        """
        import time
        
        user_id = 1
        token1 = create_access_token(user_id)
        # JWT iat is in seconds, so need at least 1 second delay
        time.sleep(1.1)
        token2 = create_access_token(user_id)
        
        # Tokens should be different due to different iat timestamps
        assert token1 != token2
        
        # But both should decode to same user_id
        payload1 = decode_token(token1)
        payload2 = decode_token(token2)
        
        assert payload1 is not None
        assert payload2 is not None
        assert payload1["sub"] == payload2["sub"] == str(user_id)
        # iat should be different
        assert payload1["iat"] != payload2["iat"]