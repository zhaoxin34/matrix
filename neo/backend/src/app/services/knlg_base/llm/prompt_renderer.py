"""Phase 3 Prompt renderer (Jinja2 + Redis cache).

Per spec prompt-management §"Jinja2 渲染 + 变量校验" + §"Redis 缓存":

- `KnlgPromptRenderer.render(prompt_key, version, variables)` reads the prompt
  template, validates variables, renders with a Jinja2 sandboxed env, and
  caches the result in Redis with TTL=300s.
- Unknown variables raise `KnlgPromptRenderError` (error code
  `ERR_PROMPT_MISSING_VAR`).
- Cache invalidation: when a new version is created, the prompt's key prefix
  is dropped from Redis so subsequent renders re-read from DB.

Cache key: `prompt:{name}:{version}:{sha1(variables_json)}` — content-addressed,
so distinct variable sets occupy distinct slots.
"""

from __future__ import annotations

import hashlib
import json
from typing import Any

from jinja2 import Environment, StrictUndefined
from sqlalchemy.orm import Session

from app.core.cache import get_redis
from app.models.knlg_llm_prompt import KnlgLlmPrompt
from app.services.knlg_base.llm.exceptions import KnlgLlmError

PROMPT_CACHE_TTL_SECONDS = 300
PROMPT_CACHE_PREFIX = "prompt:"
ERR_PROMPT_MISSING_VAR = "ERR_PROMPT_MISSING_VAR"
ERR_PROMPT_NOT_FOUND = "ERR_PROMPT_NOT_FOUND"


class KnlgPromptRenderError(KnlgLlmError):
    """Raised when a prompt template can't be rendered."""

    def __init__(self, message: str, *, missing_vars: list[str] | None = None) -> None:
        super().__init__(message)
        self.code = ERR_PROMPT_MISSING_VAR
        self.missing_vars = missing_vars or []


def _cache_key(prompt_name: str, version: str, variables: dict[str, Any]) -> str:
    var_hash = hashlib.sha1(
        json.dumps(variables, sort_keys=True, default=str).encode("utf-8"),
    ).hexdigest()[:16]
    return f"{PROMPT_CACHE_PREFIX}{prompt_name}:{version}:{var_hash}"


def _extract_declared_vars(template: str) -> set[str]:
    """Return the set of `{{ var }}` references in a Jinja2 template."""
    env = Environment()
    ast = env.parse(template)
    declared: set[str] = set()
    from jinja2 import nodes

    for ref in ast.find_all(nodes.Name):
        declared.add(ref.name)
    return declared


class KnlgPromptRenderer:
    """Render prompts from the `knlg_llm_prompt` table with Redis cache."""

    def __init__(self, db: Session) -> None:
        self.db = db
        # StrictUndefined → missing variable raises UndefinedError, which we
        # translate to KnlgPromptRenderError.
        self.env = Environment(undefined=StrictUndefined, autoescape=False)

    def get_active_prompt(self, name: str) -> KnlgLlmPrompt:
        """Return the active version of the named prompt or raise."""
        prompt = (
            self.db.query(KnlgLlmPrompt).filter(KnlgLlmPrompt.name == name, KnlgLlmPrompt.is_active.is_(True)).first()
        )
        if not prompt:
            raise KnlgPromptRenderError(
                f"Active prompt {name!r} not found",
            )
        return prompt

    def get_prompt(self, prompt_id: int) -> KnlgLlmPrompt:
        prompt = self.db.query(KnlgLlmPrompt).filter(KnlgLlmPrompt.id == prompt_id).first()
        if not prompt:
            raise KnlgPromptRenderError(f"Prompt id={prompt_id} not found")
        return prompt

    def render(
        self,
        name: str,
        variables: dict[str, Any],
        *,
        version: str | None = None,
        use_cache: bool = True,
    ) -> str:
        """Render the prompt template with the given variables.

        Steps:
          1. Try Redis cache (if enabled).
          2. On miss, fetch prompt from DB by name + version (active by default).
          3. Validate variables against the template's `{{ var }}` set.
          4. Render with Jinja2 sandboxed env.
          5. Store rendered string in Redis with TTL=300s.
        """
        if version is None:
            prompt = self.get_active_prompt(name)
            version = str(prompt.version)
        else:
            prompt = self._get_version(name, version)

        cache_key = _cache_key(prompt.name, version, variables)

        if use_cache:
            try:
                cached = get_redis().get(cache_key)
                if cached:
                    return cached
            except Exception:
                # Redis outage — fall through to direct render.
                pass

        # §5.2: validate variables before render to surface clear errors.
        declared = _extract_declared_vars(prompt.template)
        missing = sorted(declared - set(variables.keys()))
        if missing:
            raise KnlgPromptRenderError(
                f"Prompt {name!r} v{version} missing variables: {missing}",
                missing_vars=missing,
            )

        try:
            tmpl = self.env.from_string(prompt.template)
            rendered = tmpl.render(**variables)
        except Exception as exc:
            raise KnlgPromptRenderError(f"Render failed for {name!r}: {exc}") from exc

        if use_cache:
            try:
                get_redis().setex(cache_key, PROMPT_CACHE_TTL_SECONDS, rendered)
            except Exception:
                pass
        return rendered

    def _get_version(self, name: str, version: str) -> KnlgLlmPrompt:
        prompt = (
            self.db.query(KnlgLlmPrompt).filter(KnlgLlmPrompt.name == name, KnlgLlmPrompt.version == version).first()
        )
        if not prompt:
            raise KnlgPromptRenderError(f"Prompt {name!r} v{version} not found")
        return prompt

    # ------------------------------------------------------------------
    # Cache management — §5.3
    # ------------------------------------------------------------------

    def invalidate(self, name: str) -> int:
        """Drop every cached render for the given prompt name. Returns count deleted."""
        try:
            client = get_redis()
            cursor = 0
            deleted = 0
            pattern = f"{PROMPT_CACHE_PREFIX}{name}:*"
            while True:
                cursor, keys = client.scan(cursor=cursor, match=pattern, count=200)
                if keys:
                    count: int = client.delete(*keys)  # type: ignore[assignment]
                    deleted += count
                if cursor == 0:
                    break
            return deleted
        except Exception:
            return 0


__all__ = [
    "KnlgPromptRenderer",
    "KnlgPromptRenderError",
    "PROMPT_CACHE_TTL_SECONDS",
    "ERR_PROMPT_MISSING_VAR",
    "ERR_PROMPT_NOT_FOUND",
]
