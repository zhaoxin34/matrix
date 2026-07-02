"""Phase 3 AI Interview API endpoints (SSE + REST)."""

from __future__ import annotations

import json
from collections.abc import AsyncIterator

from fastapi import APIRouter, Depends, Header
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.knlg_base.ai_interview import (
    AiSessionCreate,
    AiSessionDetailResponse,
    AiSessionListResponse,
    AiSessionResponse,
)
from app.schemas.response import ApiResponse
from app.services.knlg_base.agent_service import KnlgInterviewAgentService

router = APIRouter(prefix="/interview/ai", tags=["knlg-base.ai-interview"])


def get_service(db: Session = Depends(get_db)) -> KnlgInterviewAgentService:
    return KnlgInterviewAgentService(db)


@router.post("/sessions", response_model=ApiResponse[AiSessionResponse])
def create_session(
    workspace_code: str,
    data: AiSessionCreate,
    service: KnlgInterviewAgentService = Depends(get_service),
    current_user: User = Depends(get_current_user),
):
    """Start a new AI interview session (mode='ai_agent')."""
    sess = service.start_session(
        workspace_id=service._get_workspace_id(workspace_code),
        expert_id=current_user.id,
        topic=data.topic,
        tree_id=data.tree_id,
        max_turns=data.max_turns,
        created_by=current_user.id,
    )
    return ApiResponse.success(AiSessionResponse.model_validate(sess))


@router.get("/sessions/{session_id}", response_model=ApiResponse[AiSessionDetailResponse])
def get_session(
    workspace_code: str,
    session_id: int,
    service: KnlgInterviewAgentService = Depends(get_service),
    current_user: User = Depends(get_current_user),
):
    sess = service.get_session(service._get_workspace_id(workspace_code), session_id)
    return ApiResponse.success(AiSessionDetailResponse.model_validate(sess))


@router.get("/sessions", response_model=ApiResponse[AiSessionListResponse])
def list_sessions(
    workspace_code: str,
    page: int = 1,
    page_size: int = 20,
    status: str | None = None,
    service: KnlgInterviewAgentService = Depends(get_service),
    current_user: User = Depends(get_current_user),
):
    items, total = service.list_sessions(service._get_workspace_id(workspace_code), page, page_size, status)
    return ApiResponse.success(
        AiSessionListResponse(
            items=[AiSessionResponse.model_validate(s) for s in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=(total + page_size - 1) // page_size if page_size else 0,
        )
    )


@router.post("/sessions/{session_id}/pause")
def pause_session(
    workspace_code: str,
    session_id: int,
    service: KnlgInterviewAgentService = Depends(get_service),
    current_user: User = Depends(get_current_user),
):
    sess = service.pause(service._get_workspace_id(workspace_code), session_id)
    return ApiResponse.success(AiSessionResponse.model_validate(sess))


@router.post("/sessions/{session_id}/abandon")
def abandon_session(
    workspace_code: str,
    session_id: int,
    service: KnlgInterviewAgentService = Depends(get_service),
    current_user: User = Depends(get_current_user),
):
    sess = service.abandon(service._get_workspace_id(workspace_code), session_id)
    return ApiResponse.success(AiSessionResponse.model_validate(sess))


async def _sse_event_stream(events: AsyncIterator) -> AsyncIterator[str]:
    """Format events as SSE."""
    async for ev in events:
        data = json.dumps(ev.data, ensure_ascii=False)
        line = f"event: {ev.event}\n"
        if ev.id:
            line += f"id: {ev.id}\n"
        line += f"data: {data}\n\n"
        yield line


@router.get("/sessions/{session_id}/stream")
async def stream_turn(
    workspace_code: str,
    session_id: int,
    answer: str = "",
    last_event_id: str | None = Header(None, alias="Last-Event-ID"),
    service: KnlgInterviewAgentService = Depends(get_service),
    current_user: User = Depends(get_current_user),
):
    """SSE stream for AI interview. Optional `answer` query for resume pattern.

    Phase 3 MVP: stream emits SSE events for the next question or summary.
    """
    ws_id = service._get_workspace_id(workspace_code)
    if last_event_id:
        service.update_last_event(ws_id, session_id, last_event_id)
    events = service.process_turn(workspace_id=ws_id, session_id=session_id, expert_answer=answer)
    return StreamingResponse(_sse_event_stream(events), media_type="text/event-stream")
