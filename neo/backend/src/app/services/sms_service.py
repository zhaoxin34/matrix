"""Mock SMS service for development.

This module provides a mock implementation of SMS sending service.
In production, replace this with a real SMS provider (e.g., Alibaba Cloud, Tencent Cloud).
"""

import logging

logger = logging.getLogger(__name__)

# Mock verification code - always returns this code
MOCK_VERIFICATION_CODE = "123456"


async def send_verification_code(phone: str, code_type: str) -> bool:
    """Send verification code to phone number (Mock implementation).

    Args:
        phone: Target phone number
        code_type: Type of code (register, login, reset_password)

    Returns:
        True if successful (always True in mock)

    Note:
        The verification code is always '123456' in this mock implementation.
        In production, integrate with a real SMS provider.
    """
    logger.info(f"[MOCK SMS] Sending code to phone={phone}, type={code_type}, code={MOCK_VERIFICATION_CODE}")
    return True


def verify_code(phone: str, code: str) -> bool:
    """Verify if the provided code matches the sent code (Mock implementation).

    Args:
        phone: Phone number
        code: Provided verification code

    Returns:
        True if code matches (always True in mock, unless code is empty)

    Note:
        In mock mode, verification always succeeds as long as code is '123456'.
        In production with real SMS, implement proper code storage and expiry.
    """
    if not code:
        return False
    return code == MOCK_VERIFICATION_CODE
