import httpx
import logging
from core.config import DISCORD_WEBHOOK_URL

logger = logging.getLogger(__name__)

def build_feedback_payload(name: str, email: str, message: str) -> dict:
    """
    Constructs a payload for Discord webhook based on user feedback details.
    
    Args:
        name (str): The name of the user providing feedback.
        email (str): The email of the user providing feedback.
        message (str): The feedback message from the user.
    
    Returns:
        dict: A dictionary formatted for Discord webhook payload.
    """
    return {
        "username": "PixelForge Support",
        "content": "🔔 **New Support Feedback Received!**",
        "embeds": [
            {
                "title": "📬 Feedback Details",
                "fields": [
                    {"name": "👤 Name", "value": name},
                    {"name": "✉️ Email", "value": email},
                    {"name": "📝 Message", "value": message},
                ],
            }
        ],
    }

async def send_discord_message(payload: dict, email: str) -> None:
    if not DISCORD_WEBHOOK_URL:
        logger.warning("DISCORD_WEBHOOK_URL is missing. Skipping Discord notification.")
        return

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                DISCORD_WEBHOOK_URL,
                json=payload,
                timeout=10.0,
            )
            response.raise_for_status()
            logger.info("Successfully sent Discord webhook for feedback from %s", email)

        except httpx.HTTPStatusError as e:
            logger.error(
                "Discord Webhook Rejected: %s - %s",
                e.response.status_code,
                e.response.text,
            )

        except Exception as e:
            logger.error("Failed to reach Discord servers: %s", e)