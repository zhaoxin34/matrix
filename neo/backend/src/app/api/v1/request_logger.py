"""Request Logger API endpoints for Chrome extension."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.request_log import RequestLoggerPayload, RequestLoggerResponse
from app.services.request_log_service import RequestLogService

router = APIRouter(prefix="/neo-agents", tags=["neo-agents"])


@router.post(
    "/request-logger",
    response_model=RequestLoggerResponse,
    status_code=status.HTTP_200_OK,
    summary="Receive request log from Chrome extension",
    description="Receives XHR/fetch request logs from the Neo Agent Chrome extension. "
    "Only requests matching a registered embedded site are stored.",
)
def receive_request_log(
    payload: RequestLoggerPayload,
    db: Session = Depends(get_db),
) -> RequestLoggerResponse:
    """Receive and process a request log from Chrome extension.

    This endpoint does NOT require authentication, as it is called directly
    from the Chrome extension which cannot attach JWT tokens.

    The request URL is matched against registered embedded sites.
    If no match is found, the log is silently discarded.
    """
    service = RequestLogService(db)
    result = service.process(payload)

    return RequestLoggerResponse(
        success=result["success"],
        received=result["received"],
        message=result.get("message"),
    )
