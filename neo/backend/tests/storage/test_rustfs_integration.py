"""Integration tests for RustFS storage service.

These tests require a running RustFS instance.
Run with: pytest tests/storage/test_rustfs_integration.py -v --integration

Environment variables:
- RUSTFS_ENDPOINT: RustFS server URL (default: http://localhost:9000)
- RUSTFS_ACCESS_KEY: Access key (default: rustfsadmin)
- RUSTFS_SECRET_KEY: Secret key (default: rustfsadmin123)
- RUSTFS_BUCKET: Test bucket name (default: test-neo-integration)
"""

import os
import tempfile
from datetime import datetime

import pytest

# Skip integration tests unless explicitly requested
pytestmark = pytest.mark.skipif(
    not os.environ.get("RUN_INTEGRATION_TESTS"),
    reason="Integration tests require RUN_INTEGRATION_TESTS=1 and running RustFS instance",
)


@pytest.fixture(scope="module")
def rustfs_service():
    """Get RustFS service instance."""
    from app.storage.service import RustFSService

    return RustFSService()


@pytest.fixture(scope="module")
def test_bucket(rustfs_service):
    """Create and return a test bucket name."""
    bucket_name = os.environ.get("RUSTFS_BUCKET", "test-neo-integration")

    # Ensure bucket exists
    try:
        rustfs_service.create_bucket(bucket_name)
    except Exception:
        pass  # Bucket may already exist

    yield bucket_name

    # Cleanup: delete all objects in bucket
    try:
        objects = rustfs_service.list_objects(bucket_name=bucket_name)
        for obj in objects:
            rustfs_service.delete_file(obj["key"], bucket_name)

        # Delete the bucket
        rustfs_service.delete_bucket(bucket_name)
    except Exception:
        pass  # Cleanup failures are acceptable


class TestRustFSIntegration:
    """Integration test cases for RustFSService with real RustFS."""

    def test_connection(self, rustfs_service, test_bucket):
        """Test basic connection to RustFS."""
        # This will raise if connection fails
        assert rustfs_service.bucket_exists(test_bucket)

    def test_create_and_delete_bucket(self, rustfs_service):
        """Test creating and deleting a bucket."""
        bucket_name = f"test-bucket-{datetime.now().strftime('%Y%m%d%H%M%S')}"

        # Create bucket
        result = rustfs_service.create_bucket(bucket_name)
        assert result == bucket_name
        assert rustfs_service.bucket_exists(bucket_name)

        # Delete bucket
        result = rustfs_service.delete_bucket(bucket_name)
        assert result == bucket_name
        assert not rustfs_service.bucket_exists(bucket_name)

    def test_upload_and_download_file(self, rustfs_service, test_bucket):
        """Test uploading and downloading a file."""
        # Create a temporary test file
        with tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".txt") as f:
            test_content = f"Integration test content at {datetime.now().isoformat()}"
            f.write(test_content)
            temp_path = f.name

        try:
            storage_key = f"test/{datetime.now().strftime('%Y%m%d')}/uploaded-file.txt"

            # Upload
            result = rustfs_service.upload_file(temp_path, storage_key, test_bucket)
            assert result == storage_key
            assert rustfs_service.file_exists(storage_key, test_bucket)

            # Download
            download_path = temp_path + ".downloaded"
            rustfs_service.download_file(storage_key, download_path, test_bucket)

            with open(download_path, "r") as f:
                downloaded_content = f.read()

            assert downloaded_content == test_content

        finally:
            # Cleanup
            if os.path.exists(temp_path):
                os.unlink(temp_path)
            download_path = temp_path + ".downloaded"
            if os.path.exists(download_path):
                os.unlink(download_path)
            try:
                rustfs_service.delete_file(storage_key, test_bucket)
            except Exception:
                pass

    def test_delete_file(self, rustfs_service, test_bucket):
        """Test deleting a file."""
        # Create a temporary test file
        with tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".txt") as f:
            f.write("Test file for deletion")
            temp_path = f.name

        try:
            storage_key = f"test/{datetime.now().strftime('%Y%m%d')}/file-to-delete.txt"

            # Upload
            rustfs_service.upload_file(temp_path, storage_key, test_bucket)
            assert rustfs_service.file_exists(storage_key, test_bucket)

            # Delete
            result = rustfs_service.delete_file(storage_key, test_bucket)
            assert result == storage_key
            assert not rustfs_service.file_exists(storage_key, test_bucket)

        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)

    def test_list_objects(self, rustfs_service, test_bucket):
        """Test listing objects in a bucket."""
        # Upload multiple test files
        storage_keys = []
        with tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".txt") as f:
            f.write("Test file 1")
            temp_path = f.name

        try:
            for i in range(3):
                storage_key = f"test/list-test/file-{i}.txt"
                rustfs_service.upload_file(temp_path, storage_key, test_bucket)
                storage_keys.append(storage_key)

            # List objects
            objects = rustfs_service.list_objects("test/list-test/", test_bucket)

            assert len(objects) == 3
            for obj in objects:
                assert obj["key"].startswith("test/list-test/")
                assert obj["size"] > 0

        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
            for key in storage_keys:
                try:
                    rustfs_service.delete_file(key, test_bucket)
                except Exception:
                    pass

    def test_presigned_upload_url(self, rustfs_service, test_bucket):
        """Test generating presigned upload URL."""
        storage_key = f"test/{datetime.now().strftime('%Y%m%d')}/presigned-upload.txt"

        result = rustfs_service.generate_presigned_upload_url(
            storage_key,
            test_bucket,
            expires_in=3600,
            content_type="text/plain",
        )

        assert result.url.startswith("http://")
        assert result.storage_key == storage_key
        assert result.expires_in == 3600

        # Cleanup
        rustfs_service.delete_file(storage_key, test_bucket)

    def test_presigned_download_url(self, rustfs_service, test_bucket):
        """Test generating presigned download URL."""
        # First upload a file
        with tempfile.NamedTemporaryFile(mode="w", delete=False, suffix=".txt") as f:
            f.write("Test content for download URL")
            temp_path = f.name

        storage_key = f"test/{datetime.now().strftime('%Y%m%d')}/presigned-download.txt"

        try:
            rustfs_service.upload_file(temp_path, storage_key, test_bucket)

            # Generate download URL
            result = rustfs_service.generate_presigned_download_url(
                storage_key,
                test_bucket,
                expires_in=7200,
            )

            assert result.url.startswith("http://")
            assert result.storage_key == storage_key
            assert result.expires_in == 7200

        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
            try:
                rustfs_service.delete_file(storage_key, test_bucket)
            except Exception:
                pass
