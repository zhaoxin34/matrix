"""Phase 3 AI Interview Summarizer."""

from __future__ import annotations

from app.services.knlg_base.agent.types import InterviewSummary, SignalType
from app.services.knlg_base.llm.client import get_default_llm_client
from app.services.knlg_base.llm.types import LlmRequest

SUMMARY_PROMPT = """你是一个知识提炼助手。基于以下 AI 访谈问答记录，生成结构化总结。

输出 JSON:
{{
  "key_findings": ["<要点1>", "<要点2>", ...],
  "suggested_kc_count": <建议生成的知识卡数量>,
  "full_text": "<Markdown 格式的完整总结>"
}}

专家主题: {topic}
问答记录:
{turns}
信号统计: pain_point={pain}, opportunity={opp}, counter_example={ce}, boundary={bd}, key_metric={km}

只输出 JSON。
"""


class InterviewSummarizer:
    """Generate AI summary for a completed interview session."""

    def __init__(self, llm_client=None, model: str = "openai/gpt-4o"):
        self.client = llm_client or get_default_llm_client()
        self.model = model

    async def summarize(
        self,
        *,
        topic: str,
        turns: list[dict],
        signal_counts: dict | None = None,
    ) -> InterviewSummary:
        signal_counts = signal_counts or {}
        prompt = SUMMARY_PROMPT.format(
            topic=topic,
            turns=self._format_turns(turns),
            pain=signal_counts.get(SignalType.PAIN_POINT.value, 0),
            opp=signal_counts.get(SignalType.OPPORTUNITY.value, 0),
            ce=signal_counts.get(SignalType.COUNTER_EXAMPLE.value, 0),
            bd=signal_counts.get(SignalType.BOUNDARY.value, 0),
            km=signal_counts.get(SignalType.KEY_METRIC.value, 0),
        )
        try:
            resp = await self.client.chat(
                LlmRequest(
                    model=self.model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.5,
                )
            )
            data = self._parse(resp.content)
            return InterviewSummary(
                key_findings=data.get("key_findings", []),
                suggested_kc_count=int(data.get("suggested_kc_count", 0)),
                signal_count=sum(signal_counts.values()),
                full_text=data.get("full_text", resp.content),
            )
        except Exception:
            # Fallback: trivial summary
            return InterviewSummary(
                key_findings=[],
                suggested_kc_count=0,
                signal_count=sum(signal_counts.values()),
                full_text=f"Topic: {topic}\n\n{len(turns)} turns processed.",
            )

    @staticmethod
    def _format_turns(turns: list[dict]) -> str:
        lines = []
        for i, t in enumerate(turns, 1):
            q = t.get("question", "")
            a = t.get("answer", "")
            lines.append(f"[Turn {i}] Q: {q}\n        A: {a}")
        return "\n".join(lines) if lines else "(no turns)"

    @staticmethod
    def _parse(content: str) -> dict:
        import json
        import re

        content = re.sub(r"```(?:json)?\s*", "", content or "")
        content = content.replace("```", "").strip()
        start = content.find("{")
        end = content.rfind("}")
        if start == -1 or end == -1:
            return {}
        try:
            return json.loads(content[start : end + 1])
        except json.JSONDecodeError:
            return {}
