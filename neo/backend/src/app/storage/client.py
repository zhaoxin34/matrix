"""RustFS S3-compatible storage client configuration."""

import logging
from functools import lru_cache

import boto3
from botocore.client import Config
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)


class RustFSSettings(BaseSettings):
    """RustFS configuration settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # RustFS Server
    RUSTFS_ENDPOINT: str = "http://localhost:9000"
    RUSTFS_ACCESS_KEY: str = "rustfsadmin"
    RUSTFS_SECRET_KEY: str = "rustfsadmin123"
    RUSTFS_REGION: str = "us-east-1"
    RUSTFS_BUCKET: str = "neo-agent"

    # Presigned URL expiration (seconds)
    RUSTFS_PRESIGNED_EXPIRES: int = 3600

    # Multipart upload threshold (bytes)
    RUSTFS_MULTIPART_THRESHOLD: int = 10 * 1024 * 1024  # 10MB


@lru_cache
def get_rustfs_settings() -> RustFSSettings:
    """Get cached RustFS settings."""
    return RustFSSettings()


def get_s3_client() -> boto3.client:
    """Create and return an S3 client configured for RustFS.

    Returns:
        boto3 S3 client configured for RustFS
    """
    settings = get_rustfs_settings()

    client = boto3.client(
        "s3",
        endpoint_url=settings.RUSTFS_ENDPOINT,
        aws_access_key_id=settings.RUSTFS_ACCESS_KEY,
        aws_secret_access_key=settings.RUSTFS_SECRET_KEY,
        config=Config(
            signature_version="s3v4",
            s3={"addressing_style": "path"},
        ),
        region_name=settings.RUSTFS_REGION,
    )

    logger.info(f"RustFS client initialized: {settings.RUSTFS_ENDPOINT}")
    return client
