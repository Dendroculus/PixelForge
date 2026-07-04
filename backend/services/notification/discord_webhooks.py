import httpx
import logging
from core.config import settings
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

def build_feedback_payload(name: str, email: str, message: str) -> dict:
    """
    Constructs a highly-formatted payload for Discord webhook based on user feedback.
    
    Args:
        name (str): The name of the user submitting feedback.
        email (str): The email address of the user.
        message (str): The feedback message provided by the user.
        
    Returns:
        dict: A dictionary formatted according to Discord's webhook structure, ready to be sent as a
    """
    return {
        "username": "PixelForge Support",
        "content": "🚨 **New Feedback Received**",
        "embeds": [
            {
                "title": "📬 User Feedback Ticket",
                "color": 6514681, 
                "fields": [
                    {
                        "name": "👤 Name",
                        "value": f"**{name}**",
                        "inline": True   
                    },
                    {
                        "name": "✉️ Email",
                        "value": f"[{email}](mailto:{email})", 
                        "inline": True
                    },
                    {
                        "name": "📝 Message",
                        "value": f"> {message}", 
                        "inline": False  
                    },
                ],
                "footer": {
                    "text": "PixelForge System Automated Alert",
                },
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        ],
    }
    
async def send_discord_message(payload: dict, email: str) -> None:
    if not settings.DISCORD_WEBHOOK_URL:
        logger.warning("DISCORD_WEBHOOK_URL is missing. Skipping Discord notification.")
        return

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                settings.DISCORD_WEBHOOK_URL,
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