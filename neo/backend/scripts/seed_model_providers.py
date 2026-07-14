#!/usr/bin/env python3
"""Seed script to create default Model Providers and Models.

Usage:
    cd backend
    uv run python -m scripts.seed_model_providers
"""

from app.database import get_db
from app.models.model_config import ModelConfig
from app.models.model_provider import ApiType, ModelProvider


def seed_model_providers():
    """Create default model providers and models."""
    db = next(get_db())

    try:
        # Check if providers already exist
        existing = db.query(ModelProvider).filter(ModelProvider.code == "openai").first()
        if existing:
            print("Providers already exist, skipping...")
            return

        # Create OpenAI Provider
        openai_provider = ModelProvider(
            code="openai",
            name="OpenAI",
            description="OpenAI API provider",
            api_type=ApiType.OPENAI_COMPLETIONS.value,
            base_url="https://api.openai.com/v1",
            api_key_env="OPENAI_API_KEY",
            enabled=True,
            created_by=1,
        )
        db.add(openai_provider)
        db.flush()

        # OpenAI Models
        openai_models = [
            ("gpt-4o", "GPT-4o", 128000, 16384, False),
            ("gpt-4o-mini", "GPT-4o Mini", 128000, 16384, False),
            ("gpt-4-turbo", "GPT-4 Turbo", 128000, 4096, False),
            ("gpt-3.5-turbo", "GPT-3.5 Turbo", 16385, 4096, False),
            ("o1-preview", "o1 Preview", 128000, 32768, True),
            ("o1-mini", "o1 Mini", 65536, 65536, True),
        ]

        for model_id, display_name, context_window, max_tokens, supports_thinking in openai_models:
            model = ModelConfig(
                provider_id=openai_provider.id,
                model_id=model_id,
                display_name=display_name,
                context_window=context_window,
                max_tokens=max_tokens,
                supports_thinking=supports_thinking,
                input_types=["text"],
                enabled=True,
            )
            db.add(model)

        # Create Anthropic Provider
        anthropic_provider = ModelProvider(
            code="anthropic",
            name="Anthropic",
            description="Anthropic Claude API provider",
            api_type=ApiType.ANTHROPIC_MESSAGES.value,
            base_url="https://api.anthropic.com/v1",
            api_key_env="ANTHROPIC_API_KEY",
            enabled=True,
            created_by=1,
        )
        db.add(anthropic_provider)
        db.flush()

        # Anthropic Models
        anthropic_models = [
            ("claude-opus-4-7", "Claude Opus 4 (July 2025)", 200000, 8192, True),
            ("claude-sonnet-4-7", "Claude Sonnet 4 (July 2025)", 200000, 8192, True),
            ("claude-3-5-sonnet-20241022", "Claude 3.5 Sonnet (October 2024)", 200000, 8192, True),
            ("claude-3-opus-20240229", "Claude 3 Opus", 200000, 4096, True),
            ("claude-3-sonnet-20240229", "Claude 3 Sonnet", 200000, 4096, True),
            ("claude-3-haiku-20240307", "Claude 3 Haiku", 200000, 4096, False),
        ]

        for model_id, display_name, context_window, max_tokens, supports_thinking in anthropic_models:
            model = ModelConfig(
                provider_id=anthropic_provider.id,
                model_id=model_id,
                display_name=display_name,
                context_window=context_window,
                max_tokens=max_tokens,
                supports_thinking=supports_thinking,
                input_types=["text", "image"],
                enabled=True,
            )
            db.add(model)

        # Create Ollama Provider (local)
        ollama_provider = ModelProvider(
            code="ollama",
            name="Ollama (Local)",
            description="Ollama local model provider",
            api_type=ApiType.OPENAI_COMPLETIONS.value,
            base_url="http://localhost:11434/v1",
            api_key_env="OLLAMA_API_KEY",
            enabled=True,
            created_by=1,
        )
        db.add(ollama_provider)
        db.flush()

        # Ollama Models
        ollama_models = [
            ("llama3.1:8b", "Llama 3.1 8B", 128000, 8192, False),
            ("llama3.1:70b", "Llama 3.1 70B", 128000, 8192, False),
            ("qwen2.5-coder:7b", "Qwen 2.5 Coder 7B", 32768, 8192, False),
            ("qwen2.5-coder:32b", "Qwen 2.5 Coder 32B", 32768, 8192, False),
            ("codellama:7b", "Code Llama 7B", 16384, 4096, False),
        ]

        for model_id, display_name, context_window, max_tokens, supports_thinking in ollama_models:
            model = ModelConfig(
                provider_id=ollama_provider.id,
                model_id=model_id,
                display_name=display_name,
                context_window=context_window,
                max_tokens=max_tokens,
                supports_thinking=supports_thinking,
                input_types=["text"],
                enabled=True,
            )
            db.add(model)

        db.commit()
        print("✓ Created OpenAI Provider with 6 models")
        print("✓ Created Anthropic Provider with 6 models")
        print("✓ Created Ollama Provider with 5 models")
        print("\nSeeding completed!")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_model_providers()
