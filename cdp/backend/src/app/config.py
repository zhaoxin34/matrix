"""Application configuration."""

import secrets

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Application
    APP_NAME: str = "CDP API"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = "mysql+pymysql://root:root@localhost:3306/cdp"

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8001

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"           # json | plain
    LOG_OUTPUT: str = "both"           # console | file | both
    LOG_DIR: str = "logs"
    LOG_FILE: str = "app.log"
    LOG_MAX_BYTES: int = 10485760      # 10MB
    LOG_BACKUP_COUNT: int = 5

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
