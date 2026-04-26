"""
CDP E2E Test Framework - Root Configuration
"""

import os
import signal
import subprocess
import tempfile
from pathlib import Path

import pytest
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright, Page

# Load .env file
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

BASE_URL = os.getenv("PLAYWRIGHT_BASE_URL", "http://localhost:3002")
HEADED = os.getenv("HEADED", "false").lower() == "true"
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "root")
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "cdp")

# Global variable to store backup file path for signal handler
_backup_file_path: str | None = None


def backup_database() -> str:
    """Backup the database to a temporary file. Returns the backup file path."""
    backup_file = tempfile.NamedTemporaryFile(delete=False, suffix=".sql")
    backup_file.close()

    cmd = [
        "mysqldump",
        f"-u{DB_USER}",
        f"-p{DB_PASSWORD}",
        f"-h{DB_HOST}",
        f"--port={DB_PORT}",
        "--single-transaction",
        "--quick",
        "--lock-tables=false",
        DB_NAME,
    ]

    with open(backup_file.name, "w") as f:
        subprocess.run(cmd, stdout=f, check=True)

    return backup_file.name


def restore_database(backup_file: str) -> None:
    """Restore the database from a backup file."""
    cmd = [
        "mysql",
        f"-u{DB_USER}",
        f"-p{DB_PASSWORD}",
        f"-h{DB_HOST}",
        f"--port={DB_PORT}",
        DB_NAME,
    ]

    with open(backup_file, "r") as f:
        subprocess.run(cmd, stdin=f, check=True)


@pytest.fixture(scope="session")
def browser():
    """Start browser for the test session."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=not HEADED)
        yield browser
        browser.close()


@pytest.fixture(scope="session")
def context(browser):
    """Create a new browser context."""
    context = browser.new_context(
        base_url=BASE_URL,
        viewport={"width": 1920, "height": 1080},
        locale="zh-CN",
    )
    yield context
    context.close()


@pytest.fixture(scope="session", autouse=True)
def db_backup():
    """Backup database before tests and restore after all tests complete."""
    global _backup_file_path

    backup_file = backup_database()
    _backup_file_path = backup_file
    print(f"\nDatabase backed up to: {backup_file}")

    def restore_and_cleanup():
        """Restore database and cleanup on exit."""
        import sys

        global _backup_file_path
        if _backup_file_path and Path(_backup_file_path).exists():
            print(f"\nRestoring database from: {_backup_file_path}")
            restore_database(_backup_file_path)
            Path(_backup_file_path).unlink(missing_ok=True)
            print("Database restored and backup file cleaned up.")
            _backup_file_path = None

    def signal_handler(signum, frame):
        """Handle Ctrl+C to restore database before exiting."""
        import sys

        print("\n\nReceived interrupt signal. Restoring database...")
        sys.stderr.flush()
        restore_and_cleanup()
        sys.stderr.flush()
        # Re-raise the signal to allow normal exit
        signal.signal(signum, signal.SIG_DFL)
        raise KeyboardInterrupt()

    # Register signal handler for Ctrl+C
    signal.signal(signal.SIGINT, signal_handler)

    yield

    # Normal cleanup
    restore_and_cleanup()


@pytest.fixture
def page(context):
    """Create a new page for each test."""
    return context.new_page()


@pytest.fixture(autouse=True)
def cleanup_auth(page):
    """Cleanup authentication state after each test."""
    yield
    # Clear cookies and localStorage after each test
    try:
        page.context.clear_cookies()
        page.evaluate("() => { localStorage.clear(); sessionStorage.clear(); }")
    except Exception:
        pass


@pytest.fixture
def goto(page):
    """Helper fixture to navigate to a URL."""

    def _goto(url: str):
        page.goto(url)
        page.wait_for_load_state("networkidle")

    return _goto


from playwright.sync_api import TimeoutError as PlaywrightTimeoutError


def assert_no_error_message(page: Page, timeout: int = 3000) -> None:
    """
    Assert that no backend error message is displayed.

    Supports both MUI (Snackbar) and Ant Design (message.error) toast notifications.
    This should be called after form submissions to detect backend errors.

    Usage:
        assert_no_error_message(page)
        # or with custom timeout
        assert_no_error_message(page, timeout=5000)
    """
    try:
        # Check Ant Design error messages first
        error_messages = page.locator(".ant-message-error")
        error_messages.wait_for(timeout=timeout)
        error_text = error_messages.first.text_content()
        pytest.fail(f"Backend error detected: {error_text}")
    except PlaywrightTimeoutError:
        pass

    try:
        # Also check MUI Snackbar/SeverityIcon error messages
        error_messages = page.locator(
            ".MuiSnackbar-root .MuiAlert-root[severity='error']"
        )
        error_messages.wait_for(timeout=500)  # Shorter timeout for MUI
        error_text = error_messages.first.text_content()
        pytest.fail(f"Backend error detected: {error_text}")
    except PlaywrightTimeoutError:
        pass
