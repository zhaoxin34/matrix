"""Rate limiting configuration."""

from functools import wraps

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import settings

# Shared limiter instance
limiter = Limiter(key_func=get_remote_address)


def conditional_limit(limit_value: str):
    """Conditional rate limit decorator - disables if RATE_LIMIT_ENABLED is False."""
    if not settings.RATE_LIMIT_ENABLED:
        return lambda x: x  # No-op decorator
    return limiter.limit(limit_value)