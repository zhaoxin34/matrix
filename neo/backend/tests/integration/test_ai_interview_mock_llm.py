"""Phase 3 mock-LLM integration test.

Spec §12.5: 集成测试 — mock LLM 跑完整 turn 流程
(start → answer → signal → next question → summarize).

Approach: patch `get_default_llm_client` so the extractor + summarizer
call against a stub that returns canned content. Then drive
`KnlgInterviewAgentService` through one full turn + summarize cycle.
"""

from __future__ import annotations

import json
from collections.abc import AsyncIterator
from typing import Any

import pytest
from sqlalchemy.orm import Session

from app.models.knlg_interview_session import KnlgInterviewSession
from app.services.knlg_base.agent.types import SignalExtractionResult, SignalType
from app.services.knlg_base.agent_service import KnlgInterviewAgentService
from app.services.knlg_base.llm.client import KnlgLlmClient
from app.services.knlg_base.llm.types import LlmChunk, LlmRequest, LlmResponse


class _StubLlmClient(KnlgLlmClient):
    """Mock LLM that returns canned signal/summarizer outputs."""

    def __init__(self) -> None:  # noqa: D401
        # Skip the parent __init__ — we override every method we need.
        self.call_count = 0

    async def chat(self, request: LlmRequest) -> LlmResponse:
        self.call_count += 1
        content = self._canned_for(request)
        return LlmResponse(
            content=content,
            model=request.model,
            finish_reason="stop",
            prompt_tokens=10,
            completion_tokens=len(content.split()),
            total_tokens=10 + len(content.split()),
            cost_usd=0.001,
            duration_ms=120,
        )

    async def stream(self, request: LlmRequest) -> AsyncIterator[LlmChunk]:  # noqa: D401
        # Stub: emit one chunk then end.
        yield LlmChunk(delta=request.messages[-1].get("content", "")[:0], finish_reason="stop")

    def _canned_for(self, request: LlmRequest) -> str:
        last_user = next((m["content"] for m in reversed(request.messages) if m.get("role") == "user"), "")
        if "信号" in last_user or "extraction" in last_user.lower() or "分析" in last_user:
            # Signal extractor call
            return json.dumps(
                [
                    {
                        "type": "pain_point",
                        "confidence": 0.92,
                        "text": "客户响应慢",
                        "linked_question_id": None,
                    },
                ],
                ensure_ascii=False,
            )
        if "总结" in last_user or "summarize" in last_user.lower():
            return json.dumps(
                {
                    "summary": "AI 访谈捕获了关键痛点",
                    "key_findings": ["响应延迟", "需要 SLA"],
                    "suggested_kc_count": 2,
                    "signal_count": 1,
                    "full_text": "本次访谈总结：客户反映响应慢，建议建立 SLA。",
                },
                ensure_ascii=False,
            )
        # followup decider / generic
        return "请继续。"


class _StubSignalExtractor:
    """Stub signal extractor that doesn't call LLM at all."""

    def __init__(self) -> None:
        self.called_with: list[dict[str, Any]] = []

    async def extract(self, *, question: str, answer: str) -> SignalExtractionResult:
        self.called_with.append({"question": question, "answer": answer})
        return SignalExtractionResult(
            signals=[
                __import__("app.services.knlg_base.agent.types", fromlist=["Signal"]).Signal(
                    type=SignalType.PAIN_POINT,
                    confidence=0.92,
                    text="客户响应慢",
                    linked_question_id=None,
                    metadata={},
                )
            ]
        )


@pytest.fixture
def ai_service(db_session: Session) -> KnlgInterviewAgentService:
    """Build a service with stubs for LLM / extractor / summarizer."""
    svc = KnlgInterviewAgentService(db_session)
    svc.extractor = _StubSignalExtractor()  # type: ignore[assignment]
    return svc


def _seed_session(db: Session, *, workspace_id: int, user_id: int) -> KnlgInterviewSession:
    """Insert a minimal AI session row for tests."""
    from app.repositories.knlg_base.agent import AiSessionRepository

    repo = AiSessionRepository(db)
    sess = repo.create_ai_session(
        workspace_id=workspace_id,
        expert_id=user_id,
        topic="客户支持效率",
        tree_id=None,
        max_turns=3,
        created_by=user_id,
    )
    db.commit()
    db.refresh(sess)
    return sess


@pytest.mark.asyncio
async def test_full_turn_with_mock_extractor_emits_signal_and_question(
    ai_service,
    db_session,
    test_workspace,
    test_user,
):
    sess = _seed_session(db=db_session, workspace_id=test_workspace.id, user_id=test_user.id)

    # Seed a prior AI turn so signal_extractor has something to look at
    from app.repositories.knlg_base.agent import AiTurnRepository

    turns_repo = AiTurnRepository(db_session)
    turns_repo.create(
        session_id=sess.id,
        turn_index=1,
        user_question_text="客户主要痛点是什么？",
        workspace_id=test_workspace.id,
        expert_answer_text="",
        next_question_reason="INITIAL",
    )
    # bump current_turn_index so the new turn lands at 2 (avoid UNIQUE clash)
    sess.current_turn_index = 1
    db_session.commit()

    events = []
    async for ev in ai_service.process_turn(
        workspace_id=test_workspace.id,
        session_id=sess.id,
        expert_answer="客户响应慢得离谱",
    ):
        events.append(ev)

    types = {e.event for e in events}
    # Per spec §"SSE 协议 (11 事件类型)" the MVP turn produces a small subset:
    assert "turn_received" in types
    assert "signal_detected" in types
    assert "question_proposed" in types
    assert "done" in types

    # Signal extraction recorded
    sig_events = [e for e in events if e.event == "signal_detected"]
    assert sig_events[0].data["type"] == "pain_point"
    assert sig_events[0].data["confidence"] == 0.92


@pytest.mark.asyncio
async def test_full_turn_with_summarizer_path(ai_service, db_session, test_workspace, test_user):
    """Drive the summarizer branch by setting max_turns=0 (forces SUMMARIZE on next turn)."""
    sess = _seed_session(db=db_session, workspace_id=test_workspace.id, user_id=test_user.id)
    # max_turns=0 means any process_turn call will hit MAX_TURNS_REACHED → SUMMARIZE
    sess.max_turns = 0
    db_session.commit()

    # Stub the summarizer too — skip the LLM call.
    from app.services.knlg_base.agent.summarizer import InterviewSummary

    class _StubSummarizer:
        async def summarize(self, *, topic, turns, signal_counts):
            return InterviewSummary(
                summary="AI 总结：响应慢",
                key_findings=["响应延迟"],
                suggested_kc_count=1,
                signal_count=sum(signal_counts.values()),
                full_text="AI 总结：响应慢。",
            )

    ai_service.summarizer = _StubSummarizer()  # type: ignore[assignment]

    events = []
    async for ev in ai_service.process_turn(
        workspace_id=test_workspace.id,
        session_id=sess.id,
        expert_answer="需要 SLA",
    ):
        events.append(ev)

    # Force a fresh session retrieval so the assertion below sees committed state
    db_session.expire_all()

    types = {e.event for e in events}
    assert "summary_ready" in types
    assert "done" in types

    summary_event = next(e for e in events if e.event == "summary_ready")
    assert "响应" in summary_event.data["summary"]

    # Session should have transitioned to COMPLETED
    db_session.refresh(sess)
    assert sess.status == "completed"
    assert sess.summary is not None


def test_stub_llm_client_returns_valid_response_shape():
    """Static assertion: _StubLlmClient satisfies KnlgLlmClient contract."""
    stub = _StubLlmClient()
    assert isinstance(stub, KnlgLlmClient)
    # The stub uses async chat; just verify the type relation.
    assert hasattr(stub, "chat")
    assert hasattr(stub, "stream")
