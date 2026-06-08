import httpx
import logging
from core.config import DISCORD_WEBHOOK_URL

logger = logging.getLogger(__name__)

async def send_discord_message(name: str, email: str, message: str) -> None:
    """
    Sends a formatted embed message to the configured Discord Webhook.
    Designed to be run as a background task.
    """
    if not DISCORD_WEBHOOK_URL:
        logger.warning("DISCORD_WEBHOOK_URL is missing. Skipping Discord notification.")
        return

    payload = {
        "username": "PixelForge Support",
    "content": "🔔 **New Support Feedback Received!**",
        "embeds": [
            {
                "title": "📬 Feedback Details",
                "color": 8140441,
                "fields": [
                    {"name": "👤 Name", "value": name or "Anonymous", "inline": True},
                    {"name": "✉️ Email", "value": email or "No email", "inline": True},
                    {"name": "📝 Message", "value": message or "Empty message", "inline": False}
                ],
                "footer": {
                    "text": "PixelForge Automated System"
                }
            }
        ]
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(DISCORD_WEBHOOK_URL, json=payload, timeout=10.0)
            response.raise_for_status()
            logger.info("Successfully sent Discord webhook for feedback from %s", email)
        except httpx.HTTPStatusError as e:
            # This will print the EXACT reason Discord rejected it (e.g., missing fields, bad token)
            logger.error("Discord Webhook Rejected: %s - %s", e.response.status_code, e.response.text)
        except Exception as e:
            logger.error("Failed to reach Discord servers: %s", e)