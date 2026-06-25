"""Base AI Provider interface."""

from abc import ABC, abstractmethod
from typing import Any


class BaseProvider(ABC):
    """Abstract base class for AI providers."""

    name: str

    @abstractmethod
    async def chat(self, messages: list[dict[str, Any]], **kwargs) -> str:
        """Send chat request to AI provider.

        Args:
            messages: List of message dictionaries with 'role' and 'content'
            **kwargs: Additional parameters

        Returns:
            Response text from AI
        """

    @abstractmethod
    async def explain(self, content: str, context: dict[str, Any] | None = None, **kwargs) -> str:
        """Explain or analyze content using AI.

        Args:
            content: Content to explain
            context: Additional context
            **kwargs: Additional parameters

        Returns:
            Explanation text
        """
