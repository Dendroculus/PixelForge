"""Discord webhook helpers for PixelForge notifications.

This module builds Discord-compatible payloads and sends them to the configured
webhook endpoint. It is currently used for public feedback submissions.
"""

import logging
from datetime import datetime, timezone

import httpx

from core.config import settings

logger = logging.getLogger(__name__)


def build_feedback_payload(name: str, email: str, message: str) -> dict:
    """Build a Discord embed payload for a feedback submission.

    Args:
        name:
            Name submitted by the user.
        email:
            Email address submitted by the user.
        message:
            Feedback message content.

    Returns:
        dict:
            Discord webhook payload.
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
                        "inline": True,
                    },
                    {
                        "name": "✉️ Email",
                        "value": f"[{email}](mailto:{email})",
                        "inline": True,
                    },
                    {
                        "name": "📝 Message",
                        "value": f"> {message}",
                        "inline": False,
                    },
                ],
                "footer": {
                    "text": "PixelForge System Automated Alert",
                },
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        ],
    }


async def send_discord_message(payload: dict, email: str) -> None:
    """Send a prepared payload to the configured Discord webhook.

    Args:
        payload:
            Discord webhook JSON payload.
        email:
            Email address used only for logging context.
    """
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
