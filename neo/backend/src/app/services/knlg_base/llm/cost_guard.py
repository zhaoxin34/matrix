"""Phase 3 LLM Cost Guard — Redis-based rate limiting."""

from __future__ import annotations

from app.services.knlg_base.llm.exceptions import KnlgLlmRateLimitError


class KnlgLlmCostGuard:
    """Per-user per-hour rate limiter via Redis INCR + EXPIRE."""

    DEFAULT_LIMIT = 100  # calls per user per hour
    WINDOW_SECONDS = 3600
    KEY_PREFIX = "ratelimit:user"

    def __init__(self, redis_client=None, limit: int = DEFAULT_LIMIT):
        self.redis = redis_client
        self.limit = limit

    def _get_redis(self):
        if self.redis is None:
            from app.core.cache import get_redis

            self.redis = get_redis()
        return self.redis

    def check_and_increment(self, user_id: int) -> int:
        """Increment the user's call count; raise if over limit. Returns new count."""
        redis = self._get_redis()
        key = f"{self.KEY_PREFIX}:{user_id}:hour"
        try:
            pipe = redis.pipeline()
            pipe.incr(key)
            pipe.expire(key, self.WINDOW_SECONDS)
            count, _ = pipe.execute()
        except Exception:
            # If Redis is down, fail open (allow call) to avoid blocking business
            return 0
        count = int(count)
        if count > self.limit:
            raise KnlgLlmRateLimitError(f"User {user_id} exceeded rate limit ({self.limit}/hour); current={count}")
        return count

    def get_current(self, user_id: int) -> int:
        """Get current count without incrementing (for diagnostics)."""
        redis = self._get_redis()
        key = f"{self.KEY_PREFIX}:{user_id}:hour"
        try:
            val = redis.get(key)
            return int(val) if val else 0
        except Exception:
            return 0

    def reset(self, user_id: int) -> None:
        """Reset a user's counter (admin operation)."""
        redis = self._get_redis()
        key = f"{self.KEY_PREFIX}:{user_id}:hour"
        redis.delete(key)
