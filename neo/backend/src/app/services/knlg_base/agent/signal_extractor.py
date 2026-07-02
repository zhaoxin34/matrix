"""Phase 3 Signal Extractor (LLM real-time extraction + Pydantic validation)."""

from __future__ import annotations

import json
import re

from app.services.knlg_base.agent.types import (
    Signal,
    SignalExtractionResult,
    SignalType,
)
from app.services.knlg_base.llm.client import get_default_llm_client
from app.services.knlg_base.llm.types import LlmRequest

SIGNAL_EXTRACTION_PROMPT = """你是一个对话分析助手。分析专家回答并提取信号。

信号类型 (5类):
- pain_point: 痛点/抱怨
- opportunity: 商机/增长机会
- counter_example: 反例/边界条件
- boundary: 适用边界
- key_metric: 关键指标/数字

输出 JSON 数组，每个元素含:
{{
  "type": "<signal_type>",
  "confidence": <0-1>,
  "text": "<从回答中提取的原句或概括>",
  "linked_question_id": <int 或 null>
}}

专家问题: {question}
专家回答: {answer}

只输出 JSON 数组，不要其他文字。
"""


class SignalExtractor:
    """LLM-based signal extractor with Pydantic validation + retry."""

    MAX_RETRIES = 2

    def __init__(self, llm_client=None, model: str = "openai/gpt-4o-mini"):
        self.client = llm_client or get_default_llm_client()
        self.model = model

    async def extract(
        self,
        *,
        question: str,
        answer: str,
    ) -> SignalExtractionResult:
        """Extract signals from an expert answer. Returns empty list on failure."""
        prompt = SIGNAL_EXTRACTION_PROMPT.format(question=question, answer=answer)
        for attempt in range(self.MAX_RETRIES + 1):
            try:
                resp = await self.client.chat(
                    LlmRequest(
                        model=self.model,
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.3,
                        user_id=None,  # don't double-count rate limit
                    )
                )
                signals = self._parse(resp.content)
                return SignalExtractionResult(signals=signals)
            except Exception:
                if attempt >= self.MAX_RETRIES:
                    return SignalExtractionResult(signals=[])
                continue
        return SignalExtractionResult(signals=[])

    @staticmethod
    def _parse(content: str) -> list[Signal]:
        """Parse LLM output into validated Signal objects."""
        # Try to find JSON array in content
        json_text = SignalExtractor._extract_json_array(content)
        if not json_text:
            return []
        try:
            raw = json.loads(json_text)
        except json.JSONDecodeError:
            return []
        if not isinstance(raw, list):
            return []
        signals: list[Signal] = []
        for item in raw:
            if not isinstance(item, dict):
                continue
            try:
                signals.append(
                    Signal(
                        type=SignalType(item.get("type", "pain_point")),
                        confidence=float(item.get("confidence", 0.5)),
                        text=str(item.get("text", ""))[:1000],
                        linked_question_id=item.get("linked_question_id"),
                        metadata=item.get("metadata", {}) or {},
                    )
                )
            except Exception:
                continue
        return signals

    @staticmethod
    def _extract_json_array(content: str) -> str | None:
        """Extract JSON array from LLM output (may include prose or code fences)."""
        if not content:
            return None
        # Strip code fences
        content = re.sub(r"```(?:json)?\s*", "", content)
        content = content.replace("```", "").strip()
        # Find first [ and last ]
        start = content.find("[")
        end = content.rfind("]")
        if start == -1 or end == -1 or end <= start:
            return None
        return content[start : end + 1]
