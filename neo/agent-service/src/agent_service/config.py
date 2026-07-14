"""Configuration for agent-service."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    # Backend API
    backend_base_url: str = "http://localhost:8000"
    backend_api_key: str = ""

    # Interview Agent defaults
    default_model_provider: str = "openai"
    default_model: str = "gpt-4o"
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
