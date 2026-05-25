import httpx
import logging
from core.config import DISCORD_WEBHOOK_URL

logger = logging.getLogger(__name__)

async def send_discord_message(name: str, email: str, message: str) -> None:
    """
    Sends a formatted embed message to the configured Discord Webhook.
    Designed to be run as a background task.
    
    Args:
        name (str): The name of the user providing feedback.
        email (str): The email of the user providing feedback.
        message (str): The feedback message from the user.
        
    Returns:
        None
    """
    if not DISCORD_WEBHOOK_URL:
        logger.warning("DISCORD_WEBHOOK_URL is missing. Skipping Discord notification.")
        return

    payload = {
        "embeds": [
            {
                "title": "📬 New PixelForge Feedback",
                "color": 5814783, # Blue
                "fields": [
                    {"name": "Name", "value": name, "inline": True},
                    {"name": "Email", "value": email, "inline": True},
                    {"name": "Message", "value": message, "inline": False}
                ]
            }
        ]
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(DISCORD_WEBHOOK_URL, json=payload, timeout=10.0)
            response.raise_for_status()
        except Exception as e:
            logger.error(f"Failed to send webhook to Discord: {e}")