"""Application configuration."""

import secrets

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Application
    APP_NAME: str = "E-commerce API"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = "mysql+pymysql://root:password@localhost:3306/ecommerce"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # SECRET_KEY validation
        if self.SECRET_KEY == "your-secret-key-change-in-production":
            if self.DEBUG:
                # Auto-generate for development
                self.SECRET_KEY = secrets.token_urlsafe(32)
            else:
                raise ValueError(
                    "SECRET_KEY must be set to a secure value in production. "
                    "Set SECRET_KEY environment variable or set DEBUG=true for development."
                )


settings = Settings()
