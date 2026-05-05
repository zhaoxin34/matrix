"""Application configuration."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Application
    APP_NAME: str = "Analyst API"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = "mysql+pymysql://root:root@localhost:3306/analyst"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8002

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_DIR: str = "logs"


settings = Settings()
