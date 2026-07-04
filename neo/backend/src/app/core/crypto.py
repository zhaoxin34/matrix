"""Phase 3 API key encryption (Fernet).

Per spec llm-gateway §"API Key 加密存储":
all `knlg_llm_provider.api_key` values are Fernet-encrypted at rest using
`KNLG_LLM_KEY_ENCRYPTION_KEY` env (master key, 32-byte url-safe base64).
Plaintext MUST NOT appear in DB queries or logs.

Usage::

    cipher = get_api_key_cipher()
    encrypted = cipher.encrypt("sk-abc")
    plaintext = cipher.decrypt(encrypted)
"""

from __future__ import annotations

import os
from functools import lru_cache

from cryptography.fernet import Fernet, InvalidToken


class ApiKeyCipher:
    """Fernet-based symmetric encryptor for provider API keys."""

    SCHEME = "fernet-v1"

    def __init__(self, master_key: str) -> None:
        if not master_key:
            raise ValueError(
                "KNLG_LLM_KEY_ENCRYPTION_KEY is empty; "
                "generate one with: `python -c 'from cryptography.fernet "
                "import Fernet; print(Fernet.generate_key().decode())'`",
            )
        try:
            key_bytes = master_key.encode("ascii")
            self._fernet = Fernet(key_bytes)
        except (ValueError, TypeError) as exc:
            raise ValueError(
                "Invalid KNLG_LLM_KEY_ENCRYPTION_KEY; must be a Fernet key "
                "(44 url-safe base64 chars). Generate with: "
                "python -c 'from cryptography.fernet import Fernet; "
                "print(Fernet.generate_key().decode())'"
            ) from exc

    def encrypt(self, plaintext: str) -> str:
        """Return Fernet ciphertext tokens prefixed with scheme marker."""
        if not plaintext:
            return ""
        token = self._fernet.encrypt(plaintext.encode("utf-8")).decode("ascii")
        return f"{self.SCHEME}:{token}"

    def decrypt(self, ciphertext: str) -> str:
        """Return decrypted plaintext. Tolerates legacy un-encrypted values."""
        if not ciphertext:
            return ""
        if not ciphertext.startswith(f"{self.SCHEME}:"):
            # Legacy plaintext value — return as-is to avoid service outage
            # during a key-rotation window. New values always get encrypted.
            return ciphertext
        token = ciphertext.split(":", 1)[1].encode("ascii")
        try:
            return self._fernet.decrypt(token).decode("utf-8")
        except InvalidToken as exc:
            raise ValueError("Cannot decrypt api_key; check KNLG_LLM_KEY_ENCRYPTION_KEY") from exc


@lru_cache(maxsize=1)
def get_api_key_cipher() -> ApiKeyCipher:
    """Return a process-wide cipher instance."""
    return ApiKeyCipher(os.environ.get("KNLG_LLM_KEY_ENCRYPTION_KEY", ""))


def is_encrypted(value: str) -> bool:
    """True iff the value already has the scheme prefix."""
    return bool(value) and value.startswith(f"{ApiKeyCipher.SCHEME}:")
