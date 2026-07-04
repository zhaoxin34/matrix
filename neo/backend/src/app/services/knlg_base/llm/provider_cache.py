"""Phase 3 provider config cache.

Per spec llm-gateway §"Provider / Model / Prompt 配置（DB 管理）":
non-engineers manage provider / model / prompt config via admin UI;
≤ 30 s the change is visible cluster-wide.

Approach: a thin Redis-backed read-through cache (`provider:{id}` keys,
TTL 300 s). On provider add/update the corresponding key is invalidated
in a single `DEL` — admins see the change instantly on the next request.
"""

from __future__ import annotations

import json
from typing import Any

from app.core.cache import get_redis

PROVIDER_CACHE_TTL_SECONDS = 300
PROVIDER_KEY_PREFIX = "provider:"


def _key(provider_id: int) -> str:
    return f"{PROVIDER_KEY_PREFIX}{provider_id}"


def get_cached_provider(provider_id: int) -> dict[str, Any] | None:
    """Return cached provider config or None on miss / Redis outage."""
    try:
        raw = get_redis().get(_key(provider_id))
    except Exception:
        return None
    if not raw:
        return None
    try:
        return json.loads(raw)
    except (TypeError, ValueError):
        return None


def set_cached_provider(provider_id: int, payload: dict[str, Any]) -> None:
    """Store provider config with TTL=300s. Silently ignored on Redis outage."""
    try:
        get_redis().setex(
            _key(provider_id),
            PROVIDER_CACHE_TTL_SECONDS,
            json.dumps(payload, default=str),
        )
    except Exception:
        return None


def invalidate_provider(provider_id: int) -> None:
    """Drop cached config for one provider. Called on admin save."""
    try:
        get_redis().delete(_key(provider_id))
    except Exception:
        return None


def invalidate_all() -> int:
    """Drop all `provider:*` keys. Returns count deleted (or 0 if Redis down)."""
    try:
        client = get_redis()
        cursor = 0
        deleted = 0
        while True:
            cursor, keys = client.scan(cursor=cursor, match=f"{PROVIDER_KEY_PREFIX}*", count=200)
            if keys:
                count: int = client.delete(*keys)  # type: ignore[assignment]
                deleted += count
            if cursor == 0:
                break
        return deleted
    except Exception:
        return 0
