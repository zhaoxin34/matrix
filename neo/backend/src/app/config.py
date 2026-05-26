"""Application configuration."""

import secrets

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Application
    APP_NAME: str = "Neo Agent API"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = "mysql+pymysql://root:root@localhost:3306/neo_agent"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Security
    JWT_SECRET_KEY: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440  # 24 hours

    # AI Providers
    OPENAI_API_KEY: str = ""
    CLAUDE_API_KEY: str = ""

    # AI Rate Limiting
    AI_RATE_LIMIT_REQUESTS: int = 100
    AI_RATE_LIMIT_WINDOW: int = 60

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"  # json | plain
    LOG_OUTPUT: str = "both"  # console | file | both
    LOG_DIR: str = "logs"
    LOG_FILE: str = "app.log"
    LOG_MAX_BYTES: int = 10485760  # 10MB
    LOG_BACKUP_COUNT: int = 5
    LOG_RETENTION_DAYS: int = 7  # Auto-delete logs older than this many days

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # JWT_SECRET_KEY validation
        if self.JWT_SECRET_KEY == "your-secret-key-change-in-production":
            if self.DEBUG:
                # Auto-generate for development
                self.JWT_SECRET_KEY = secrets.token_urlsafe(32)
            else:
                raise ValueError(
                    "JWT_SECRET_KEY must be set to a secure value in production. "
                    "Set JWT_SECRET_KEY environment variable or set DEBUG=true for development."
                )


settings = Settings()
