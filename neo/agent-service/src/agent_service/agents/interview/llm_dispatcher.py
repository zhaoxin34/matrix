"""LLM Dispatcher - Handles LLM API calls with multi-provider support."""

import httpx


class LLMDispatcher:
    """Dispatcher for LLM API calls with multi-provider support."""

    def __init__(
        self,
        base_url: str,
        api_key: str,
        model: str = "gpt-4o",
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens

    def build_messages(
        self,
        system_prompt: str,
        user_message: str,
        history: list[dict[str, str]] | None = None,
    ) -> list[dict[str, str]]:
        """Build messages array for LLM API."""
        messages = [{"role": "system", "content": system_prompt}]

        # Add conversation history
        if history:
            for msg in history:
                messages.append({"role": msg["role"], "content": msg["content"]})

        # Add current user message
        messages.append({"role": "user", "content": user_message})

        return messages

    def call_openai(self, messages: list[dict[str, str]]) -> str:
        """Call OpenAI-compatible API."""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
        }

        with httpx.Client(timeout=60.0) as client:
            response = client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

        return data["choices"][0]["message"]["content"]

    def call_anthropic(self, messages: list[dict[str, str]]) -> str:
        """Call Anthropic API."""
        # Extract system prompt from messages
        system_prompt = ""
        user_message = ""

        for msg in messages:
            if msg["role"] == "system":
                system_prompt = msg["content"]
            elif msg["role"] == "user":
                user_message = msg["content"]

        headers = {
            "x-api-key": self.api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
        }

        payload = {
            "model": self.model,
            "max_tokens": self.max_tokens,
            "system": system_prompt,
            "messages": [{"role": "user", "content": user_message}],
        }

        with httpx.Client(timeout=60.0) as client:
            response = client.post(
                "https://api.anthropic.com/v1/messages",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

        return data["content"][0]["text"]

    def call(self, messages: list[dict[str, str]], provider: str = "openai") -> str:
        """Call LLM API based on provider."""
        if provider.lower() == "openai" or "openai" in self.base_url.lower():
            return self.call_openai(messages)
        elif provider.lower() == "anthropic":
            return self.call_anthropic(messages)
        else:
            # Default to OpenAI-compatible
            return self.call_openai(messages)


class InterviewLLMDispatcher(LLMDispatcher):
    """LLM Dispatcher specifically for interview agent."""

    def generate_question(self, system_prompt: str, context: str) -> str:
        """Generate next question based on context."""
        messages = self.build_messages(system_prompt, context)
        return self.call(messages)

    def generate_followup(self, system_prompt: str, question: str, answer: str) -> str:
        """Generate follow-up question based on previous answer."""
        user_message = f"问题: {question}\n回答: {answer}\n\n请根据以上问答，生成一个追问问题。"
        messages = self.build_messages(system_prompt, user_message)
        return self.call(messages)

    def extract_tags(self, system_prompt: str, text: str) -> list[str]:
        """Extract tags from answer text."""
        user_message = f"从以下文本中提取关键标签（返回 JSON 数组格式）：\n\n{text}"
        messages = self.build_messages(system_prompt, user_message)
        result = self.call(messages)
        # Parse JSON result
        try:
            import json

            return json.loads(result)
        except Exception:
            return []

    def assess_confidence(self, system_prompt: str, question: str, answer: str) -> float:
        """Assess confidence score for the answer."""
        user_message = f"评估以下回答的质量（返回 0-1 之间的数字）：\n\n问题: {question}\n回答: {answer}"
        messages = self.build_messages(system_prompt, user_message)
        result = self.call(messages)
        # Try to parse numeric result
        try:
            return float(result.strip())
        except Exception:
            return 0.5
