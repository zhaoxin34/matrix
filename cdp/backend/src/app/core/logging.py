"""Logging configuration with contextvars support."""

import contextvars
import logging
import os
from datetime import datetime, timezone
from logging.handlers import RotatingFileHandler
from typing import Any

# Context variables for request tracking
_request_id_var: contextvars.ContextVar[str | None] = contextvars.ContextVar("request_id", default=None)
_user_id_var: contextvars.ContextVar[int | None] = contextvars.ContextVar("user_id", default=None)
_username_var: contextvars.ContextVar[str | None] = contextvars.ContextVar("username", default=None)


def set_request_id(request_id: str | None) -> None:
    """Set the request ID for the current context."""
    _request_id_var.set(request_id)


def get_request_id() -> str | None:
    """Get the request ID for the current context."""
    return _request_id_var.get()


def set_user_id(user_id: int | None) -> None:
    """Set the user ID for the current context."""
    _user_id_var.set(user_id)


def get_user_id() -> int | None:
    """Get the user ID for the current context."""
    return _user_id_var.get()


def get_username() -> str | None:
    """Get the username for the current context."""
    return _username_var.get()


def set_username(username: str | None) -> None:
    """Set the username for the current context."""
    _username_var.set(username)


class PlainFormatter(logging.Formatter):
    """Human-readable formatter for development."""

    def format(self, record: logging.LogRecord) -> str:
        timestamp = datetime.fromtimestamp(record.created, tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
        level = record.levelname
        logger_name = record.name
        request_id = get_request_id()
        user_id = get_user_id()

        # Format request_id and user_id for display
        request_id_str = f"[{request_id}]" if request_id else "[None]"
        user_id_str = f"[{user_id}]" if user_id is not None else "[None]"

        # Truncate logger name to 27 chars for alignment
        logger_display = logger_name[:27].ljust(27)

        msg = record.getMessage()

        # Include stack trace if exception info is present
        if record.exc_info:
            exc_text = self.formatException(record.exc_info)
            return f"{timestamp} | {level:<8} | {logger_display} | {request_id_str} | {user_id_str} | {msg}\n{exc_text}"

        return f"{timestamp} | {level:<8} | {logger_display} | {request_id_str} | {user_id_str} | {msg}"


class JSONFormatter(logging.Formatter):
    """JSON formatter for production."""

    def format(self, record: logging.LogRecord) -> str:
        log_data: dict[str, Any] = {
            "timestamp": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": get_request_id(),
            "user_id": get_user_id(),
            "username": get_username(),
        }

        # Add extra fields if present
        if hasattr(record, "event"):
            log_data["event"] = record.event

        return str(log_data)


def setup_logging() -> None:
    """Configure root logger with console and/or file output."""
    from app.config import settings

    # Determine formatter based on LOG_FORMAT setting
    if settings.LOG_FORMAT == "plain":
        formatter: logging.Formatter = PlainFormatter()
    else:
        formatter = JSONFormatter()

    # Determine log level
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    # Root logger configuration
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)

    # Avoid duplicate handlers
    if root_logger.handlers:
        root_logger.handlers.clear()

    # Add handlers based on LOG_OUTPUT setting
    output = settings.LOG_OUTPUT.lower()
    if output in ("console", "both"):
        console_handler = logging.StreamHandler()
        console_handler.setLevel(log_level)
        console_handler.setFormatter(formatter)
        root_logger.addHandler(console_handler)

    if output in ("file", "both"):
        # Ensure log directory exists (relative to backend directory)
        # __file__ is at src/app/core/logging.py, so we need 4 levels up to reach backend/
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        log_dir = os.path.join(backend_dir, settings.LOG_DIR)
        os.makedirs(log_dir, exist_ok=True)

        log_file = os.path.join(log_dir, settings.LOG_FILE)
        file_handler = RotatingFileHandler(
            filename=log_file,
            maxBytes=settings.LOG_MAX_BYTES,
            backupCount=settings.LOG_BACKUP_COUNT,
            encoding="utf-8",
        )
        file_handler.setLevel(log_level)
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)


def get_logger(name: str) -> logging.Logger:
    """Get a logger with the given name."""
    return logging.getLogger(name)
