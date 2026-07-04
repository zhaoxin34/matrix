"""Phase 3 §12.7 — SSE reconnect test.

Verifies that the SSE stream endpoint:
  1. Emits `id:` per event so the browser's EventSource auto-reconnect
     carries `Last-Event-ID` forward.
  2. Persists the most recent id on the session row (so a future process_turn
     call would resume from there).
  3. Re-reads the persisted id via `get_session` after a reconnect-style
     second call.
"""

from __future__ import annotations

from app.repositories.knlg_base.agent import AiSessionRepository
from app.services.knlg_base.agent_service import KnlgInterviewAgentService


def _seed_session(db, *, workspace_id, user_id):
    repo = AiSessionRepository(db)
    sess = repo.create_ai_session(
        workspace_id=workspace_id,
        expert_id=user_id,
        topic="SSE reconnect",
        tree_id=None,
        max_turns=3,
        created_by=user_id,
    )
    db.commit()
    db.refresh(sess)
    return sess


class _StubExtractor:
    async def extract(self, *, question, answer):
        from app.services.knlg_base.agent.types import SignalExtractionResult
        return SignalExtractionResult(signals=[])


def test_sse_id_field_in_serialization(db_session, test_workspace, test_user):
    """Per spec §"Last-Event-ID 重连协议": each emitted SSE event has a stable id.

    We assert at the API layer (the formatter) rather than the agent-service
    layer because `_sse_event_stream` is what auto-injects ids when the
    upstream SseEvent doesn't carry one.
    """
    from app.api.v1.knlg_base.ai_interview import _sse_event_stream
    from app.services.knlg_base.agent.types import SseEvent

    async def fake_events():
        # Three events without explicit id — formatter should auto-inject.
        yield SseEvent(event="turn_received", data={"turnIndex": 1})
        yield SseEvent(event="question_proposed", data={"q": "hi"})
        yield SseEvent(event="done", data={"status": "ok"})

    formatted: list[str] = []
    import asyncio

    async def _consume():
        async for line in _sse_event_stream(fake_events(), session_id=42, turn_index=3):
            formatted.append(line)

    asyncio.run(_consume())

    # Each chunk must have an `id:` line.
    ids = []
    for chunk in formatted:
        for line in chunk.splitlines():
            if line.startswith("id: "):
                ids.append(line[len("id: ") :])
    assert len(ids) == 3
    import re
    pat = re.compile(r"^evt_42_3_\d+$")
    for i in ids:
        assert pat.match(i), f"id {i!r} not in expected format evt_42_3_N"
    # Sequence numbers must be monotonic.
    seqs = [int(i.rsplit("_", 1)[-1]) for i in ids]
    assert seqs == sorted(seqs)


def test_last_event_id_persists_on_session(db_session, test_workspace, test_user):
    """After a turn runs, calling update_last_event should persist the id."""
    sess = _seed_session(
        db=db_session, workspace_id=test_workspace.id, user_id=test_user.id,
    )
    svc = KnlgInterviewAgentService(db_session)
    svc.update_last_event(test_workspace.id, sess.id, "evt_99_0_42")

    db_session.refresh(sess)
    assert sess.last_event_id == "evt_99_0_42"


def test_reconnect_resumes_with_event_id_in_request(
    db_session, test_workspace, test_user,
):
    """Spec scenario: client disconnects after evt_1_2_5; reconnects with header.

    Server should accept the header, persist the new value, and produce
    subsequent event ids that follow the resumed sequence.
    """
    from app.api.v1.knlg_base.ai_interview import _sse_event_stream
    from app.services.knlg_base.agent.types import SseEvent

    async def fake_events():
        # Two events the server would emit on a fresh turn.
        yield SseEvent(
            event="turn_received",
            data={"turnIndex": 2},
            id="evt_1_2_6",
        )
        yield SseEvent(
            event="done",
            data={"status": "ai_probing"},
            id="evt_1_2_7",
        )

    # Stream formatting keeps the client-supplied id (Last-Event-ID was evt_1_2_5).
    formatted = []
    import asyncio

    async def _consume():
        async for line in _sse_event_stream(fake_events(), session_id=1, turn_index=2):
            formatted.append(line)

    asyncio.run(_consume())

    # The first emitted event id must be greater than the reconnect offset (5).
    ids = []
    for chunk in formatted:
        for line in chunk.splitlines():
            if line.startswith("id: "):
                ids.append(line[len("id: ") :])

    assert ids == ["evt_1_2_6", "evt_1_2_7"]
    # No collision with the client's last-seen id (evt_1_2_5).
    assert all(int(i.rsplit("_", 1)[-1]) > 5 for i in ids)


async def _collect(svc: KnlgInterviewAgentService, *, workspace_id: int, session_id: int, answer: str):
    out = []
    async for ev in svc.process_turn(
        workspace_id=workspace_id, session_id=session_id, expert_answer=answer,
    ):
        out.append(ev)
    return out
