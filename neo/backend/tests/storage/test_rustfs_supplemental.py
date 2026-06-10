"""Supplemental integration tests for RustFSService.

These tests run against a real RustFS instance and complement
`test_rustfs_integration.py` by covering scenarios that are awkward
to mock:

- Large file upload (forces the SDK's multipart path)
- Concurrent upload / delete
- head_bucket error handling for missing buckets
- list_objects pagination (max_keys < total count)

Run with:
    RUN_INTEGRATION_TESTS=1 pytest tests/storage/test_rustfs_supplemental.py -v
"""

import os
import tempfile
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime

import pytest
from botocore.exceptions import ClientError

# Skip unless explicitly enabled
pytestmark = pytest.mark.skipif(
    not os.environ.get("RUN_INTEGRATION_TESTS"),
    reason="Integration tests require RUN_INTEGRATION_TESTS=1 and running RustFS instance",
)


# ==================== Fixtures ====================


@pytest.fixture(scope="module")
def rustfs_service():
    from app.storage.service import RustFSService

    return RustFSService()


@pytest.fixture(scope="module")
def shared_bucket(rustfs_service):
    """A single bucket reused by all tests in this module."""
    bucket = f"test-neo-sup-{uuid.uuid4().hex[:8]}"
    rustfs_service.create_bucket(bucket)
    yield bucket
    # Cleanup
    try:
        for obj in rustfs_service.list_objects(prefix="", bucket_name=bucket):
            rustfs_service.delete_file(obj["key"], bucket_name=bucket)
        rustfs_service.delete_bucket(bucket)
    except Exception:
        pass


@pytest.fixture
def storage_key():
    """Unique key per test for isolation."""
    return f"sup/{uuid.uuid4().hex}/{datetime.now().strftime('%H%M%S')}/file.bin"


@pytest.fixture
def temp_file():
    """Temp file cleaned up after the test."""
    fd, path = tempfile.mkstemp()
    os.close(fd)
    yield path
    if os.path.exists(path):
        os.unlink(path)


# ==================== Large file (multipart) ====================


class TestLargeFileUpload:
    """Files larger than the SDK's multipart threshold should still round-trip."""

    # 12 MB > default 8 MB boto3 multipart threshold
    LARGE_FILE_SIZE = 12 * 1024 * 1024

    def test_upload_and_download_12mb(self, rustfs_service, shared_bucket, temp_file):
        # Write 12 MB of pseudo-random data
        with open(temp_file, "wb") as f:
            f.write(os.urandom(self.LARGE_FILE_SIZE))

        storage_key = f"sup/large/{uuid.uuid4().hex}.bin"
        download_path = temp_file + ".downloaded"

        try:
            rustfs_service.upload_file(temp_file, storage_key, shared_bucket)
            assert rustfs_service.file_exists(storage_key, shared_bucket)

            rustfs_service.download_file(storage_key, download_path, shared_bucket)

            with open(temp_file, "rb") as orig, open(download_path, "rb") as got:
                # Byte-exact equality is the strongest signal that multipart stitching
                # produced a file identical to the source.
                assert orig.read() == got.read()
        finally:
            for p in (temp_file, download_path):
                if os.path.exists(p):
                    os.unlink(p)
            try:
                rustfs_service.delete_file(storage_key, shared_bucket)
            except Exception:
                pass


# ==================== Concurrency ====================


class TestConcurrency:
    """Upload and delete under thread pool should not corrupt the bucket."""

    def test_concurrent_uploads(self, rustfs_service, shared_bucket, temp_file):
        # Small payload, many parallel uploads
        with open(temp_file, "wb") as f:
            f.write(os.urandom(64 * 1024))

        n = 8
        keys = [f"sup/concurrent/upload-{i}-{uuid.uuid4().hex}.bin" for i in range(n)]

        def _upload(key: str) -> str:
            rustfs_service.upload_file(temp_file, key, shared_bucket)
            return key

        try:
            with ThreadPoolExecutor(max_workers=4) as pool:
                futures = [pool.submit(_upload, k) for k in keys]
                results = [f.result() for f in as_completed(futures)]

            assert sorted(results) == sorted(keys)
            for k in keys:
                assert rustfs_service.file_exists(k, shared_bucket)
        finally:
            for k in keys:
                try:
                    rustfs_service.delete_file(k, shared_bucket)
                except Exception:
                    pass

    def test_concurrent_deletes(self, rustfs_service, shared_bucket, temp_file):
        # Seed N objects, then delete them concurrently
        with open(temp_file, "wb") as f:
            f.write(os.urandom(16 * 1024))

        n = 8
        keys = [f"sup/concurrent/del-{i}-{uuid.uuid4().hex}.bin" for i in range(n)]
        for k in keys:
            rustfs_service.upload_file(temp_file, k, shared_bucket)

        with ThreadPoolExecutor(max_workers=4) as pool:
            futures = [pool.submit(rustfs_service.delete_file, k, shared_bucket) for k in keys]
            for f in as_completed(futures):
                f.result()  # surface any exception

        for k in keys:
            assert not rustfs_service.file_exists(k, shared_bucket)


# ==================== Error handling ====================


class TestErrorHandling:
    """head_bucket on a non-existent bucket must surface a ClientError."""

    def test_head_bucket_raises_for_missing_bucket(self, rustfs_service):
        missing = f"definitely-does-not-exist-{uuid.uuid4().hex}"
        with pytest.raises(ClientError):
            rustfs_service.client.head_bucket(Bucket=missing)

    def test_get_object_raises_for_missing_key(self, rustfs_service, shared_bucket):
        with pytest.raises(ClientError):
            rustfs_service.client.get_object(Bucket=shared_bucket, Key=f"no-such-key-{uuid.uuid4().hex}")


# ==================== list_objects pagination ====================


class TestListObjectsPagination:
    """max_keys < total must return at most max_keys entries per call."""

    def test_max_keys_caps_result_size(self, rustfs_service, shared_bucket, temp_file):
        with open(temp_file, "wb") as f:
            f.write(os.urandom(8 * 1024))

        prefix = f"sup/list/{uuid.uuid4().hex}/"
        keys = [f"{prefix}obj-{i:02d}.bin" for i in range(5)]
        for k in keys:
            rustfs_service.upload_file(temp_file, k, shared_bucket)

        try:
            page1 = rustfs_service.list_objects(prefix=prefix, bucket_name=shared_bucket, max_keys=2)
            assert len(page1) == 2
            # All returned keys must be within the prefix
            assert all(o["key"].startswith(prefix) for o in page1)
        finally:
            for k in keys:
                try:
                    rustfs_service.delete_file(k, shared_bucket)
                except Exception:
                    pass
