import logging
import aiohttp
from fastapi import Form, HTTPException, status
from core.config import CLOUDFLARE_TURNSTILE_SECRET_KEY

logger = logging.getLogger(__name__)

async def verify_turnstile(cf_turnstile_response: str = Form(...)) -> str:
    """
    Verifies Cloudflare Turnstile token and blocks invalid or failed checks.
    """
    if not cf_turnstile_response:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Missing bot protection token."
        )

    url = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
    payload = {
        "secret": CLOUDFLARE_TURNSTILE_SECRET_KEY,
        "response": cf_turnstile_response
    }
    
    logger.warning("Turnstile token length: %s", len(cf_turnstile_response or ""))

    try:
        timeout = aiohttp.ClientTimeout(total=5.0)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.post(url, data=payload) as response:
                if response.status != 200:
                    logger.error(f"Turnstile API returned HTTP {response.status}")
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail="Bot verification service temporarily unavailable."
                    )

                result = await response.json()
                if not result.get("success"):
                    logger.warning(f"Bot blocked. Turnstile error codes: {result.get('error-codes', [])}")
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Bot protection verification failed."
                    )

    except aiohttp.ClientError as e:
        logger.error(f"Network error during Turnstile verification: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Bot verification service unreachable."
        )

    return cf_turnstile_response