"""Redis cache singleton for the backend."""

from __future__ import annotations

import os

import redis

_redis_client: redis.Redis | None = None


def get_redis() -> redis.Redis:
    """Get or create the Redis client singleton."""
    global _redis_client
    if _redis_client is None:
        url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        _redis_client = redis.from_url(url, decode_responses=True)
    return _redis_client


def reset_redis() -> None:
    """Reset the Redis client (for tests)."""
    global _redis_client
    _redis_client = None
