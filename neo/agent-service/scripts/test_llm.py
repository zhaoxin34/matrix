#!/usr/bin/env python3
"""Test script for LLM integration."""

import sys

sys.path.insert(0, "src")

from agent_service.agents.interview.llm_dispatcher import LLMDispatcher
from agent_service.config import settings


def test_llm_connection():
    """Test LLM connection and basic functionality."""
    print(f"Using provider: {settings.llm_provider}")

    # Configure based on provider
    if settings.llm_provider == "openai":
        base_url = settings.openai_base_url
        api_key = settings.openai_api_key
        model = settings.openai_model
    elif settings.llm_provider in ("anthropic", "minimax"):
        base_url = settings.anthropic_base_url
        api_key = settings.anthropic_api_key
        model = settings.anthropic_model
    else:
        raise ValueError(f"Unknown provider: {settings.llm_provider}")

    print(f"Base URL: {base_url}")
    print(f"Model: {model}")

    dispatcher = LLMDispatcher(
        base_url=base_url,
        api_key=api_key,
        model=model,
        temperature=0.7,
        max_tokens=4096,
    )

    # Test 1: Simple completion
    print("\n=== Test 1: Simple completion ===")
    system_prompt = "你是一个专业的访谈助手，擅长通过提问引导专家分享知识和经验。"
    user_message = "请用一句话介绍你自己。"

    messages = dispatcher.build_messages(system_prompt, user_message)

    if settings.llm_provider in ("anthropic", "minimax"):
        response = dispatcher.call_anthropic(messages)
    else:
        response = dispatcher.call_openai(messages)

    print(f"Response: {response}")

    # Test 2: Interview follow-up generation
    print("\n=== Test 2: Interview follow-up generation ===")
    system_prompt = """你是一个专业的访谈助手，擅长通过提问引导专家分享知识和经验。
请根据用户的回答，提出一个追问问题。"""
    user_message = "问题: 请介绍一下您的销售经验\n回答: 我有10年的B2B销售经验，主要做企业软件销售，年销售额超过500万。"

    messages = dispatcher.build_messages(system_prompt, user_message)

    if settings.llm_provider in ("anthropic", "minimax"):
        response = dispatcher.call_anthropic(messages)
    else:
        response = dispatcher.call_openai(messages)

    print(f"Follow-up question: {response}")

    print("\n✅ All tests passed!")
    return True


if __name__ == "__main__":
    # Check if API key is set
    if settings.llm_provider in ("anthropic", "minimax") and not settings.anthropic_api_key:
        print("❌ Error: ANTHROPIC_API_KEY is not set!")
        print("Please set your API key in the .env file:")
        print("  ANTHROPIC_API_KEY=your-api-key")
        sys.exit(1)

    test_llm_connection()
