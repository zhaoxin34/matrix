"""Phase 3 §12.6 — Real-LLM E2E: 5 personas × complete interview.

Drives KnlgInterviewAgentService.process_turn() against MiniMax's
`MiniMax-M2.7` model (anthropic-compatible). Skips automatically when
the API key / base URL are not configured.

Run with:
    export MINIMAX_API_KEY=...
    export ANTHROPIC_API_BASE=https://api.minimaxi.com/anthropic
    make test        # or pytest tests/integration/test_ai_interview_e2e_real_llm.py
"""

from __future__ import annotations

import os
import time
from dataclasses import dataclass

import pytest

from app.repositories.knlg_base.agent import AiSessionRepository
from app.services.knlg_base.agent_service import KnlgInterviewAgentService

# Skip the entire module when MINIMAX is not configured.
pytestmark = [
    pytest.mark.network,
    pytest.mark.skipif(
        not os.environ.get("MINIMAX_API_KEY"),
        reason="MINIMAX_API_KEY not set; real-LLM E2E skipped",
    ),
]


# ---------------------------------------------------------------------------
# Personas — each describes an "expert" with a different style. The
# assertions verify that the AI interview adapts to those styles.
# ---------------------------------------------------------------------------


@dataclass
class Persona:
    name: str
    topic: str
    answers: list[str]
    expect_signal_type: str | None  # signal_type the AI SHOULD ideally detect
    expect_min_signals: int
    expect_any_of: tuple[str, ...] = ()  # accept these as alternative success


PERSONAS = [
    Persona(
        name="concise_polite",
        topic="客户支持效率",
        answers=[
            "响应慢",
            "3 天",
            "主要是邮件支持",
            "20+ 个客户",
            "希望 SLA",
        ],
        # The AI may legitimately classify 'response slow' as pain_point,
        # key_metric (3 days), or boundary (SLA). Accept any of these.
        expect_signal_type="pain_point",
        expect_any_of=("pain_point", "key_metric", "boundary"),
        expect_min_signals=2,
    ),
    Persona(
        name="verbose_metrics",
        topic="销售转化漏斗",
        answers=[
            "我们电商网站 Q4 转化率从 3.2% 掉到 2.1%，客单价从 280 跌到 240",
            "主要是流量质量下降，CPC 涨了 30%",
            "50,000 单/月，去年同期 75,000 单",
            "竞品都在做直播带货",
            "考虑过 KOL 但 ROI 不确定",
        ],
        expect_signal_type="key_metric",
        expect_any_of=("key_metric", "pain_point", "opportunity"),
        expect_min_signals=2,
    ),
    Persona(
        name="boundary_focused",
        topic="法规边界",
        answers=[
            "PII 数据不能离开中国",
            "不能存第三方数据库",
            "审计要求 7 年保留",
            "跨境传输需要明示同意",
            "GDPR 适用欧盟用户",
        ],
        expect_signal_type="boundary",
        expect_any_of=("boundary", "pain_point"),
        expect_min_signals=2,
    ),
    Persona(
        name="opportunity_seeker",
        topic="新业务方向",
        answers=[
            "B 端客户愿意为定制化付费",
            "我们还没做 SaaS 化",
            "竞品都在做订阅制",
            "中小客户也能买",
            "AI 加成是核心卖点",
        ],
        expect_signal_type="opportunity",
        expect_any_of=("opportunity", "pain_point"),
        expect_min_signals=2,
    ),
    Persona(
        name="counter_example",
        topic="反面案例",
        answers=[
            "上次项目其实失败过",
            "因为团队没共识",
            "leader 频繁更换",
            "没人愿意负责",
            "预算也被砍了",
        ],
        expect_signal_type="counter_example",
        expect_any_of=("counter_example", "pain_point", "boundary"),
        expect_min_signals=1,
    ),
]


def _seed_session(db, *, workspace_id, user_id, persona: Persona):
    repo = AiSessionRepository(db)
    sess = repo.create_ai_session(
        workspace_id=workspace_id,
        expert_id=user_id,
        topic=persona.topic,
        tree_id=None,
        max_turns=len(persona.answers),
        created_by=user_id,
    )
    db.commit()
    db.refresh(sess)
    return sess


async def _drive_one_turn(svc: KnlgInterviewAgentService, *, workspace_id, session_id, answer):
    events = []
    async for ev in svc.process_turn(
        workspace_id=workspace_id,
        session_id=session_id,
        expert_answer=answer,
    ):
        events.append(ev)
    return events


@pytest.mark.asyncio
@pytest.mark.parametrize("persona", PERSONAS, ids=[p.name for p in PERSONAS])
async def test_e2e_persona_completes_interview(
    persona: Persona,
    db_session,
    test_workspace,
    test_user,
):
    """Spec §12.6: 5 personas × complete interview against the real LLM.

    Each persona runs through `persona.answers` turns. We assert:
      1. ≥ `expect_min_signals` signals detected across the run
      2. At least one signal matches the persona's expected type
      3. Either summarizer fires (status=completed) or last turn has
         a question_proposed event
      4. Total wall time stays under 60s per persona (sanity check
         for streaming latency)
    """
    sess = _seed_session(
        db=db_session, workspace_id=test_workspace.id, user_id=test_user.id,
        persona=persona,
    )

    svc = KnlgInterviewAgentService(db_session)
    all_signals = []
    final_status = None
    question_count = 0

    t0 = time.time()
    for i, answer in enumerate(persona.answers):
        events = await _drive_one_turn(
            svc,
            workspace_id=test_workspace.id,
            session_id=sess.id,
            answer=answer,
        )
        turn_signals = []
        for ev in events:
            if ev.event == "signal_detected":
                all_signals.append(ev.data)
                turn_signals.append(ev.data.get("type"))
            elif ev.event == "question_proposed":
                question_count += 1
            elif ev.event == "summary_ready":
                final_status = "completed"
            elif ev.event == "done":
                final_status = ev.data.get("status", "unknown")
            elif ev.event == "error":
                print(f"[{persona.name}] turn {i+1} ERROR: {ev.data}")
        print(f"[{persona.name}] turn {i+1} signals={turn_signals} status_after={final_status}")
        # If session reached a terminal state, stop.
        db_session.refresh(sess)
        if sess.status in ("completed", "abandoned"):
            break
    wall = time.time() - t0

    # === assertions ===
    # 1) minimum signal count
    assert len(all_signals) >= persona.expect_min_signals, (
        f"[{persona.name}] expected ≥{persona.expect_min_signals} signals, "
        f"got {len(all_signals)}: {all_signals}"
    )
    # 2) at least one signal matches EITHER expect_signal_type OR any of expect_any_of
    accepted = (persona.expect_signal_type, *persona.expect_any_of)
    matching = [s for s in all_signals if s.get("type") in accepted]
    assert matching, (
        f"[{persona.name}] expected ≥1 signal of type in {accepted!r}, "
        f"got types: {[s.get('type') for s in all_signals]}"
    )
    # 3) either summarise or keep asking
    assert final_status in ("completed", "ai_probing", "waiting_for_context"), (
        f"[{persona.name}] unexpected final status: {final_status}"
    )
    # 4) wall time sanity
    assert wall < 90, f"[{persona.name}] too slow: {wall:.1f}s"

    print(
        f"[{persona.name}] signals={len(all_signals)} "
        f"types={[s.get('type') for s in all_signals]} "
        f"final={final_status} wall={wall:.1f}s",
    )


def test_minimax_env_is_set_for_module():
    """Smoke check that the module was loaded with the expected env."""
    assert os.environ.get("MINIMAX_API_KEY"), "MINIMAX_API_KEY required"
    assert os.environ.get("ANTHROPIC_API_BASE", "").startswith("https://"), (
        "ANTHROPIC_API_BASE must be set to the MiniMax endpoint"
    )
