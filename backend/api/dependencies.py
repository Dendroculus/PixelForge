import os
import httpx
import logging
from fastapi import HTTPException
from core.config import settings

logger = logging.getLogger(__name__)

async def verify_turnstile(token: str) -> None:
    """
    Verifies the Cloudflare Turnstile token.
    Includes a secure bypass mechanism strictly for local development.
    """
    env = os.getenv("ENVIRONMENT", "development").lower()
    allow_bypass = os.getenv("ALLOW_TURNSTILE_TEST_BYPASS", "false").lower() in {"1", "true", "yes", "on"}
    
    if token == "manual_test_bypass" and env in {"local", "dev", "development"} and allow_bypass:
        logger.info("🛡️ Turnstile bypass engaged for local testing.")
        return

    if not settings.CLOUDFLARE_TURNSTILE_SECRET_KEY:
        logger.warning("Turnstile secret key missing. Bypassing check (NOT RECOMMENDED FOR PROD).")
        return

    async with httpx.AsyncClient() as client:
        try:
            verify_response = await client.post(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                data={
                    "secret": settings.CLOUDFLARE_TURNSTILE_SECRET_KEY,
                    "response": token
                },
                timeout=5.0
            )
            verify_response.raise_for_status()
        except Exception as e:
            logger.error("Error reaching Cloudflare Turnstile: %s", e)
            raise HTTPException(status_code=500, detail="Internal server error during bot verification.") from e
            
    turnstile_data = verify_response.json()
    
    if not turnstile_data.get("success"):
        logger.warning("Turnstile validation failed: %s", turnstile_data.get('error-codes'))
        raise HTTPException(status_code=400, detail="Bot protection verification failed.")