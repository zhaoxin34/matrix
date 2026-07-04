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

SIGNAL_EXTRACTION_PROMPT = """请提取信号并只返回 JSON 数组，不要任何其他文字。

输入:
- 问题: {question}
- 回答: {answer}

要求输出格式（必须严格遵守）：
[{{"type": "<signal_type>", "confidence": <0-1>, "text": "<原句或概括>", "linked_question_id": null}}]

type 必须是以下之一：pain_point, opportunity, counter_example, boundary, key_metric。
- pain_point: 痛点/抱怨
- opportunity: 商机/增长机会
- counter_example: 反例/边界条件
- boundary: 适用边界
- key_metric: 关键指标/数字
confidence 是 0-1 之间的浮点数。
text 是从回答中提取的原句或概括。
linked_question_id 现在为 null。

示例输入:
- 问题: 客户最讨厌什么？
- 回答: 客户最讨厌我们响应慢，3天才回邮件

示例输出:
[{{"type":"pain_point","confidence":0.92,"text":"响应慢 3天才回邮件","linked_question_id":null}}]

请立即输出 JSON 数组：
"""


class SignalExtractor:
    """LLM-based signal extractor with Pydantic validation + retry."""

    MAX_RETRIES = 2

    def __init__(self, llm_client=None, model: str = "anthropic/MiniMax-M2.7"):
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
                        temperature=0.1,
                        max_tokens=2000,  # reasoning models need headroom
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
