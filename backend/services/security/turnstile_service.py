"""Cloudflare Turnstile verification service.

This module verifies bot-protection tokens submitted by the frontend. A manual
bypass token is allowed only when explicitly enabled in local/development
settings. Missing production configuration fails closed so bot protection cannot
be silently disabled by an empty environment variable.
"""

import logging

import httpx
from fastapi import HTTPException, status

from core.config import settings
from utils.error import codes
from utils.error.responses import build_error_payload

logger = logging.getLogger(__name__)

_DEVELOPMENT_ENVIRONMENTS = frozenset({"local", "dev", "development"})


async def verify_turnstile(token: str) -> None:
    """Verify a Cloudflare Turnstile response token.

    Args:
        token:
            Turnstile response token from the client.

    Raises:
        HTTPException:
            Raised with a structured ``INTERNAL_ERROR`` payload when
            verification cannot be completed or production configuration is
            missing, and ``AUTH_FAILED`` when Cloudflare rejects the token.
    """
    env = settings.ENVIRONMENT.strip().lower()
    is_development = env in _DEVELOPMENT_ENVIRONMENTS
    allow_bypass = settings.ALLOW_TURNSTILE_TEST_BYPASS

    if token == "manual_test_bypass" and is_development and allow_bypass:
        logger.info("🛡️ Turnstile bypass engaged for local testing.")
        return

    secret_key = settings.CLOUDFLARE_TURNSTILE_SECRET_KEY.strip()

    if not secret_key:
        if is_development:
            logger.warning(
                "Turnstile secret key is missing in development; "
                "verification is being skipped."
            )
            return

        logger.error(
            "Turnstile secret key is missing outside development; "
            "rejecting verification."
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=build_error_payload(
                codes.INTERNAL_ERROR,
                "Bot protection is not configured.",
            ),
        )

    async with httpx.AsyncClient() as client:
        try:
            verify_response = await client.post(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                data={
                    "secret": secret_key,
                    "response": token,
                },
                timeout=5.0,
            )
            verify_response.raise_for_status()
        except Exception as exc:
            logger.error("Error reaching Cloudflare Turnstile: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=build_error_payload(
                    codes.INTERNAL_ERROR,
                    "Internal server error during bot verification.",
                ),
            ) from exc

    turnstile_data = verify_response.json()

    if not turnstile_data.get("success"):
        logger.warning(
            "Turnstile validation failed: %s",
            turnstile_data.get("error-codes"),
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=build_error_payload(
                codes.AUTH_FAILED,
                "Bot protection verification failed.",
            ),
        )
