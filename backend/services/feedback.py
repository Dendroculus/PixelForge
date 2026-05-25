import httpx
import logging
from fastapi import HTTPException
from core.config import CLOUDFLARE_TURNSTILE_SECRET_KEY

logger = logging.getLogger(__name__)

async def verify_turnstile_token(token: str) -> None:
    """
    Verifies the Cloudflare Turnstile token.
    Raises an HTTPException if the validation fails.
    """
    if not CLOUDFLARE_TURNSTILE_SECRET_KEY:
        logger.warning("Turnstile secret key missing. Bypassing check (NOT RECOMMENDED FOR PROD).")
        return

    async with httpx.AsyncClient() as client:
        try:
            verify_response = await client.post(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                data={
                    "secret": CLOUDFLARE_TURNSTILE_SECRET_KEY,
                    "response": token
                },
                timeout=5.0
            )
            verify_response.raise_for_status()
        except Exception as e:
            logger.error(f"Error reaching Cloudflare Turnstile: {e}")
            raise HTTPException(status_code=500, detail="Internal server error during bot verification.") from e
            
    turnstile_data = verify_response.json()
    
    if not turnstile_data.get("success"):
        logger.warning(f"Turnstile validation failed: {turnstile_data.get('error-codes')}")
        raise HTTPException(status_code=400, detail="Bot verification failed. Please try again.")