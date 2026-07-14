"""Configuration for agent-service."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    # Backend API
    backend_base_url: str = "http://localhost:8000"
    backend_api_key: str = ""

    # LLM Provider - 支持 openai / anthropic / minimax
    llm_provider: str = "minimax"  # or "openai" / "anthropic"

    # OpenAI settings
    openai_api_key: str = ""
    openai_base_url: str = "https://api.openai.com/v1"  # 支持代理
    openai_model: str = "gpt-4o"

    # Anthropic/Minimax settings (Minimax uses Anthropic-compatible API)
    anthropic_api_key: str = ""
    anthropic_base_url: str = "https://api.anthropic.com"
    anthropic_model: str = "MiniMax-M2.7"

    # Interview Agent defaults
    default_temperature: float = 0.7
    default_max_tokens: int = 4096

    # Interview settings
    max_followup_depth: int = 5
    interview_timeout_minutes: int = 30

    # Server
    host: str = "0.0.0.0"
    port: int = 8001

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
