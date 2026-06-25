"""RustFS storage service for object operations."""

import logging
from dataclasses import dataclass

import boto3
from botocore.exceptions import ClientError

from app.storage.client import get_rustfs_settings, get_s3_client

logger = logging.getLogger(__name__)


@dataclass
class PresignedUrlResult:
    """Result of presigned URL generation."""

    url: str
    storage_key: str
    expires_in: int


class RustFSService:
    """Service for RustFS S3-compatible object storage operations."""

    def __init__(self):
        """Initialize RustFS service."""
        self._client: boto3.client | None = None
        self._settings = get_rustfs_settings()

    @property
    def client(self) -> boto3.client:
        """Get or create S3 client (lazy initialization)."""
        if self._client is None:
            self._client = get_s3_client()
        return self._client

    @property
    def default_bucket(self) -> str:
        """Get default bucket name."""
        return self._settings.RUSTFS_BUCKET

    def create_bucket(self, bucket_name: str | None = None) -> str:
        """Create a new bucket.

        Args:
            bucket_name: Name of the bucket. If None, uses default bucket.

        Returns:
            Name of the created bucket.

        Raises:
            ClientError: If bucket already exists or creation fails.
        """
        bucket = bucket_name or self.default_bucket
        try:
            self.client.create_bucket(Bucket=bucket)
            logger.info(f"Bucket created: {bucket}")
            return bucket
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "")
            if error_code == "BucketAlreadyOwnedByYou":
                logger.info(f"Bucket already exists: {bucket}")
                return bucket
            logger.error(f"Failed to create bucket {bucket}: {e}")
            raise

    def delete_bucket(self, bucket_name: str | None = None) -> str:
        """Delete a bucket.

        Args:
            bucket_name: Name of the bucket. If None, uses default bucket.

        Returns:
            Name of the deleted bucket.

        Raises:
            ClientError: If bucket doesn't exist or deletion fails.
        """
        bucket = bucket_name or self.default_bucket
        try:
            self.client.delete_bucket(Bucket=bucket)
            logger.info(f"Bucket deleted: {bucket}")
            return bucket
        except ClientError as e:
            logger.error(f"Failed to delete bucket {bucket}: {e}")
            raise

    def bucket_exists(self, bucket_name: str | None = None) -> bool:
        """Check if a bucket exists.

        Args:
            bucket_name: Name of the bucket. If None, uses default bucket.

        Returns:
            True if bucket exists, False otherwise.
        """
        bucket = bucket_name or self.default_bucket
        try:
            self.client.head_bucket(Bucket=bucket)
            return True
        except ClientError:
            return False

    def upload_file(
        self,
        file_path: str,
        storage_key: str,
        bucket_name: str | None = None,
    ) -> str:
        """Upload a file to storage.

        Args:
            file_path: Local file path to upload.
            storage_key: Object key (path) in storage.
            bucket_name: Name of the bucket. If None, uses default bucket.

        Returns:
            Storage key of the uploaded file.

        Raises:
            ClientError: If upload fails.
        """
        bucket = bucket_name or self.default_bucket
        try:
            self.client.upload_file(file_path, bucket, storage_key)
            logger.info(f"File uploaded: s3://{bucket}/{storage_key}")
            return storage_key
        except ClientError as e:
            logger.error(f"Failed to upload file {file_path}: {e}")
            raise

    def upload_fileobj(
        self,
        file_obj,
        storage_key: str,
        bucket_name: str | None = None,
        content_type: str | None = None,
    ) -> str:
        """Upload a file-like object to storage.

        Args:
            file_obj: File-like object to upload.
            storage_key: Object key (path) in storage.
            bucket_name: Name of the bucket. If None, uses default bucket.
            content_type: MIME type of the file.

        Returns:
            Storage key of the uploaded file.

        Raises:
            ClientError: If upload fails.
        """
        bucket = bucket_name or self.default_bucket
        extra_args = {}
        if content_type:
            extra_args["ContentType"] = content_type

        try:
            self.client.upload_fileobj(file_obj, bucket, storage_key, ExtraArgs=extra_args)
            logger.info(f"File object uploaded: s3://{bucket}/{storage_key}")
            return storage_key
        except ClientError as e:
            logger.error(f"Failed to upload file object: {e}")
            raise

    def download_file(
        self,
        storage_key: str,
        file_path: str,
        bucket_name: str | None = None,
    ) -> str:
        """Download a file from storage.

        Args:
            storage_key: Object key (path) in storage.
            file_path: Local file path to save.
            bucket_name: Name of the bucket. If None, uses default bucket.

        Returns:
            Local file path.

        Raises:
            ClientError: If download fails.
        """
        bucket = bucket_name or self.default_bucket
        try:
            self.client.download_file(bucket, storage_key, file_path)
            logger.info(f"File downloaded: s3://{bucket}/{storage_key} -> {file_path}")
            return file_path
        except ClientError as e:
            logger.error(f"Failed to download file {storage_key}: {e}")
            raise

    def get_object_bytes(
        self,
        storage_key: str,
        bucket_name: str | None = None,
    ) -> tuple[bytes, str]:
        """Read an object fully into memory and return (body, content_type).

        Suitable for small objects (segment rrweb JSON). For large files,
        prefer download_file(). Raises ClientError on failure.
        """
        bucket = bucket_name or self.default_bucket
        try:
            response = self.client.get_object(Bucket=bucket, Key=storage_key)
            body = response["Body"].read()
            content_type = response.get("ContentType", "application/octet-stream")
            return body, content_type
        except ClientError as e:
            logger.error(f"Failed to read object {storage_key}: {e}")
            raise

    def delete_file(self, storage_key: str, bucket_name: str | None = None) -> str:
        """Delete a file from storage.

        Args:
            storage_key: Object key (path) in storage.
            bucket_name: Name of the bucket. If None, uses default bucket.

        Returns:
            Storage key of the deleted file.

        Raises:
            ClientError: If deletion fails.
        """
        bucket = bucket_name or self.default_bucket
        try:
            self.client.delete_object(Bucket=bucket, Key=storage_key)
            logger.info(f"File deleted: s3://{bucket}/{storage_key}")
            return storage_key
        except ClientError as e:
            logger.error(f"Failed to delete file {storage_key}: {e}")
            raise

    def file_exists(self, storage_key: str, bucket_name: str | None = None) -> bool:
        """Check if a file exists.

        Args:
            storage_key: Object key (path) in storage.
            bucket_name: Name of the bucket. If None, uses default bucket.

        Returns:
            True if file exists, False otherwise.
        """
        bucket = bucket_name or self.default_bucket
        try:
            self.client.head_object(Bucket=bucket, Key=storage_key)
            return True
        except ClientError:
            return False

    def list_objects(
        self,
        prefix: str = "",
        bucket_name: str | None = None,
        max_keys: int = 1000,
    ) -> list[dict]:
        """List objects in a bucket with optional prefix.

        Args:
            prefix: Filter objects by prefix.
            bucket_name: Name of the bucket. If None, uses default bucket.
            max_keys: Maximum number of objects to return.

        Returns:
            List of object metadata dictionaries.
        """
        bucket = bucket_name or self.default_bucket
        try:
            response = self.client.list_objects_v2(
                Bucket=bucket,
                Prefix=prefix,
                MaxKeys=max_keys,
            )
            objects = response.get("Contents", [])
            logger.info(f"Listed {len(objects)} objects in s3://{bucket}/{prefix}")
            return [
                {
                    "key": obj["Key"],
                    "size": obj["Size"],
                    "last_modified": obj["LastModified"].isoformat(),
                    "etag": obj["ETag"].strip('"'),
                }
                for obj in objects
            ]
        except ClientError as e:
            logger.error(f"Failed to list objects: {e}")
            raise

    def generate_presigned_upload_url(
        self,
        storage_key: str,
        bucket_name: str | None = None,
        expires_in: int | None = None,
        content_type: str | None = None,
    ) -> PresignedUrlResult:
        """Generate a presigned URL for uploading.

        Args:
            storage_key: Object key (path) in storage.
            bucket_name: Name of the bucket. If None, uses default bucket.
            expires_in: URL expiration time in seconds.
            content_type: Expected MIME type of the file.

        Returns:
            PresignedUrlResult with URL and metadata.
        """
        bucket = bucket_name or self.default_bucket
        expires = expires_in or self._settings.RUSTFS_PRESIGNED_EXPIRES

        params = {"Bucket": bucket, "Key": storage_key}
        if content_type:
            params["ContentType"] = content_type

        try:
            url = self.client.generate_presigned_url(
                ClientMethod="put_object",
                Params=params,
                ExpiresIn=expires,
            )
            logger.info(f"Generated presigned upload URL for: s3://{bucket}/{storage_key}")
            return PresignedUrlResult(
                url=url,
                storage_key=storage_key,
                expires_in=expires,
            )
        except ClientError as e:
            logger.error(f"Failed to generate presigned upload URL: {e}")
            raise

    def generate_presigned_download_url(
        self,
        storage_key: str,
        bucket_name: str | None = None,
        expires_in: int | None = None,
    ) -> PresignedUrlResult:
        """Generate a presigned URL for downloading.

        Args:
            storage_key: Object key (path) in storage.
            bucket_name: Name of the bucket. If None, uses default bucket.
            expires_in: URL expiration time in seconds.

        Returns:
            PresignedUrlResult with URL and metadata.
        """
        bucket = bucket_name or self.default_bucket
        expires = expires_in or self._settings.RUSTFS_PRESIGNED_EXPIRES

        try:
            url = self.client.generate_presigned_url(
                ClientMethod="get_object",
                Params={"Bucket": bucket, "Key": storage_key},
                ExpiresIn=expires,
            )
            logger.info(f"Generated presigned download URL for: s3://{bucket}/{storage_key}")
            return PresignedUrlResult(
                url=url,
                storage_key=storage_key,
                expires_in=expires,
            )
        except ClientError as e:
            logger.error(f"Failed to generate presigned download URL: {e}")
            raise


# Singleton instance
_rustfs_service: RustFSService | None = None


def get_rustfs_service() -> RustFSService:
    """Get singleton RustFS service instance."""
    global _rustfs_service
    if _rustfs_service is None:
        _rustfs_service = RustFSService()
    return _rustfs_service
