"""Logging middleware for request/response logging."""

import time
import uuid
from collections.abc import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.logging import get_logger, set_request_id


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for logging HTTP requests and responses."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        logger = get_logger("http")

        # Generate request ID
        request_id = str(uuid.uuid4())[:8]
        set_request_id(request_id)

        # Record start time
        start_time = time.time()

        # Process request - capture exceptions
        try:
            response = await call_next(request)
        except Exception:
            # Log exception with stack trace
            logger.exception(
                f"{request.method} {request.url.path} - Request failed",
                extra={"event": "http_request", "request_id": request_id},
            )
            raise

        # Calculate duration
        duration = time.time() - start_time

        # Log request details based on status code
        log_func = logger.info if response.status_code < 400 else logger.warning

        log_func(
            f"{request.method} {request.url.path} - {response.status_code} - {duration:.3f}s",
            extra={"event": "http_request", "request_id": request_id},
        )

        # Add request ID to response headers
        response.headers["X-Request-ID"] = request_id

        return response
