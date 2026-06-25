"""Tests for RustFS storage service."""

import os
import tempfile
from unittest.mock import MagicMock, patch

import pytest
from botocore.exceptions import ClientError

from app.storage.service import PresignedUrlResult, RustFSService


class TestRustFSService:
    """Test cases for RustFSService."""

    @pytest.fixture
    def service(self):
        """Create a RustFS service instance with mocked client."""
        with patch("app.storage.service.get_s3_client") as mock_get_client:
            mock_client = MagicMock()
            mock_get_client.return_value = mock_client

            service = RustFSService()
            service._client = mock_client
            return service

    @pytest.fixture
    def temp_file(self):
        """Create a temporary test file."""
        with tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".txt") as f:
            f.write("test content")
            temp_path = f.name
        yield temp_path
        if os.path.exists(temp_path):
            os.unlink(temp_path)

    # ===== Bucket Operations =====

    def test_create_bucket_success(self, service):
        """Test creating a new bucket successfully."""
        service.client.create_bucket = MagicMock()

        result = service.create_bucket("test-bucket")

        assert result == "test-bucket"
        service.client.create_bucket.assert_called_once_with(Bucket="test-bucket")

    def test_create_bucket_already_exists(self, service):
        """Test creating a bucket that already exists."""
        service.client.create_bucket = MagicMock(
            side_effect=ClientError({"Error": {"Code": "BucketAlreadyOwnedByYou"}}, "CreateBucket"),
        )

        result = service.create_bucket("test-bucket")

        assert result == "test-bucket"

    def test_create_bucket_uses_default(self, service):
        """Test creating bucket uses default bucket when none specified."""
        service.client.create_bucket = MagicMock()

        result = service.create_bucket()

        assert result == service.default_bucket
        service.client.create_bucket.assert_called_once_with(Bucket=service.default_bucket)

    def test_create_bucket_error(self, service):
        """Test creating bucket fails with error."""
        service.client.create_bucket = MagicMock(
            side_effect=ClientError({"Error": {"Code": "InternalError", "Message": "Server error"}}, "CreateBucket"),
        )

        with pytest.raises(ClientError):
            service.create_bucket("test-bucket")

    def test_delete_bucket_success(self, service):
        """Test deleting a bucket successfully."""
        service.client.delete_bucket = MagicMock()

        result = service.delete_bucket("test-bucket")

        assert result == "test-bucket"
        service.client.delete_bucket.assert_called_once_with(Bucket="test-bucket")

    def test_delete_bucket_error(self, service):
        """Test deleting bucket fails with error."""
        service.client.delete_bucket = MagicMock(
            side_effect=ClientError({"Error": {"Code": "NoSuchBucket", "Message": "Bucket not found"}}, "DeleteBucket"),
        )

        with pytest.raises(ClientError):
            service.delete_bucket("test-bucket")

    def test_bucket_exists_true(self, service):
        """Test checking if bucket exists returns True."""
        service.client.head_bucket = MagicMock()

        result = service.bucket_exists("test-bucket")

        assert result is True

    def test_bucket_exists_false(self, service):
        """Test checking if bucket exists returns False."""
        service.client.head_bucket = MagicMock(
            side_effect=ClientError({"Error": {"Code": "404", "Message": "Not found"}}, "HeadBucket"),
        )

        result = service.bucket_exists("test-bucket")

        assert result is False

    # ===== File Operations =====

    def test_upload_file_success(self, service, temp_file):
        """Test uploading a file successfully."""
        service.client.upload_file = MagicMock()

        result = service.upload_file(temp_file, "remote/path/file.txt", "test-bucket")

        assert result == "remote/path/file.txt"
        service.client.upload_file.assert_called_once_with(temp_file, "test-bucket", "remote/path/file.txt")

    def test_upload_file_error(self, service, temp_file):
        """Test uploading file fails with error."""
        service.client.upload_file = MagicMock(
            side_effect=ClientError({"Error": {"Code": "AccessDenied", "Message": "Access denied"}}, "PutObject"),
        )

        with pytest.raises(ClientError):
            service.upload_file(temp_file, "remote/path/file.txt")

    def test_upload_fileobj_success(self, service):
        """Test uploading a file object successfully."""
        service.client.upload_fileobj = MagicMock()

        file_obj = MagicMock()
        result = service.upload_fileobj(file_obj, "remote/path/file.txt", "test-bucket", "text/plain")

        assert result == "remote/path/file.txt"
        service.client.upload_fileobj.assert_called_once_with(
            file_obj,
            "test-bucket",
            "remote/path/file.txt",
            ExtraArgs={"ContentType": "text/plain"},
        )

    def test_download_file_success(self, service):
        """Test downloading a file successfully."""
        service.client.download_file = MagicMock()

        result = service.download_file("remote/path/file.txt", "/tmp/downloaded.txt", "test-bucket")

        assert result == "/tmp/downloaded.txt"
        service.client.download_file.assert_called_once_with(
            "test-bucket",
            "remote/path/file.txt",
            "/tmp/downloaded.txt",
        )

    def test_download_file_error(self, service):
        """Test downloading file fails with error."""
        service.client.download_file = MagicMock(
            side_effect=ClientError({"Error": {"Code": "NoSuchKey", "Message": "Key not found"}}, "GetObject"),
        )

        with pytest.raises(ClientError):
            service.download_file("remote/path/file.txt", "/tmp/downloaded.txt")

    def test_delete_file_success(self, service):
        """Test deleting a file successfully."""
        service.client.delete_object = MagicMock()

        result = service.delete_file("remote/path/file.txt", "test-bucket")

        assert result == "remote/path/file.txt"
        service.client.delete_object.assert_called_once_with(Bucket="test-bucket", Key="remote/path/file.txt")

    def test_delete_file_error(self, service):
        """Test deleting file fails with error."""
        service.client.delete_object = MagicMock(
            side_effect=ClientError({"Error": {"Code": "NoSuchKey", "Message": "Key not found"}}, "DeleteObject"),
        )

        with pytest.raises(ClientError):
            service.delete_file("remote/path/file.txt")

    def test_file_exists_true(self, service):
        """Test checking if file exists returns True."""
        service.client.head_object = MagicMock()

        result = service.file_exists("remote/path/file.txt")

        assert result is True

    def test_file_exists_false(self, service):
        """Test checking if file exists returns False."""
        service.client.head_object = MagicMock(
            side_effect=ClientError({"Error": {"Code": "404", "Message": "Not found"}}, "HeadObject"),
        )

        result = service.file_exists("remote/path/file.txt")

        assert result is False

    # ===== List Objects =====

    def test_list_objects_success(self, service):
        """Test listing objects successfully."""
        from datetime import datetime

        service.client.list_objects_v2 = MagicMock(
            return_value={
                "Contents": [
                    {
                        "Key": "file1.txt",
                        "Size": 100,
                        "LastModified": datetime(2024, 1, 1, 12, 0, 0),
                        "ETag": '"abc123"',
                    },
                    {
                        "Key": "file2.txt",
                        "Size": 200,
                        "LastModified": datetime(2024, 1, 2, 12, 0, 0),
                        "ETag": '"def456"',
                    },
                ],
            },
        )

        result = service.list_objects("prefix/")

        assert len(result) == 2
        assert result[0]["key"] == "file1.txt"
        assert result[0]["size"] == 100
        assert result[0]["etag"] == "abc123"
        service.client.list_objects_v2.assert_called_once_with(
            Bucket=service.default_bucket,
            Prefix="prefix/",
            MaxKeys=1000,
        )

    def test_list_objects_empty(self, service):
        """Test listing objects when bucket is empty."""
        service.client.list_objects_v2 = MagicMock(return_value={})

        result = service.list_objects()

        assert result == []

    # ===== Presigned URLs =====

    def test_generate_presigned_upload_url_success(self, service):
        """Test generating presigned upload URL."""
        service.client.generate_presigned_url = MagicMock(return_value="https://s3.example.com/presigned-url")

        result = service.generate_presigned_upload_url(
            "remote/path/file.txt",
            "test-bucket",
            expires_in=3600,
            content_type="application/json",
        )

        assert isinstance(result, PresignedUrlResult)
        assert result.url == "https://s3.example.com/presigned-url"
        assert result.storage_key == "remote/path/file.txt"
        assert result.expires_in == 3600

    def test_generate_presigned_download_url_success(self, service):
        """Test generating presigned download URL."""
        service.client.generate_presigned_url = MagicMock(return_value="https://s3.example.com/presigned-url")

        result = service.generate_presigned_download_url(
            "remote/path/file.txt",
            "test-bucket",
            expires_in=7200,
        )

        assert isinstance(result, PresignedUrlResult)
        assert result.url == "https://s3.example.com/presigned-url"
        assert result.expires_in == 7200

    def test_generate_presigned_url_error(self, service):
        """Test generating presigned URL fails with error."""
        service.client.generate_presigned_url = MagicMock(
            side_effect=ClientError(
                {"Error": {"Code": "InvalidAccessKeyId", "Message": "Invalid key"}},
                "GeneratePresignedUrl",
            ),
        )

        with pytest.raises(ClientError):
            service.generate_presigned_upload_url("remote/path/file.txt")


class TestPresignedUrlResult:
    """Test cases for PresignedUrlResult dataclass."""

    def test_dataclass_fields(self):
        """Test PresignedUrlResult has expected fields."""
        result = PresignedUrlResult(
            url="https://example.com/url",
            storage_key="path/to/file.txt",
            expires_in=3600,
        )

        assert result.url == "https://example.com/url"
        assert result.storage_key == "path/to/file.txt"
        assert result.expires_in == 3600

    def test_dataclass_repr(self):
        """Test PresignedUrlResult string representation."""
        result = PresignedUrlResult(
            url="https://example.com/url",
            storage_key="path/to/file.txt",
            expires_in=3600,
        )

        repr_str = repr(result)
        assert "PresignedUrlResult" in repr_str
        assert "storage_key=" in repr_str
