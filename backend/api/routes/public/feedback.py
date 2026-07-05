"""Public feedback submission route.

This module receives user feedback from the frontend, verifies the Cloudflare
Turnstile token, formats the message for Discord, and dispatches the webhook
send operation as a background task.
"""

from fastapi import APIRouter, BackgroundTasks, Request

from api.schemas.feedback import FeedbackRequest
from core.config import settings
from limiter.rate_limiter import limiter
from services.notification.discord_webhooks import (
    build_feedback_payload,
    send_discord_message,
)
from services.security.turnstile_service import verify_turnstile

router = APIRouter(tags=["feedback"])


@router.post("/feedback")
@limiter.limit(f"{settings.FEEDBACK_RATE_LIMIT};{settings.FEEDBACK_DAILY_USAGE_LIMIT}/day")
async def submit_feedback(
    request: Request,
    payload: FeedbackRequest,
    background_tasks: BackgroundTasks,
):
    """Validate and queue a user feedback notification.

    Args:
        request:
            Current FastAPI request, required by the rate limiter.
        payload:
            Validated feedback form data and Turnstile token.
        background_tasks:
            FastAPI background task container used to send the Discord webhook
            after the response is returned.

    Returns:
        dict:
            Success message indicating that feedback was accepted.
    """
    await verify_turnstile(payload.cf_turnstile_response)

    discord_payload = build_feedback_payload(
        name=payload.name,
        email=payload.email,
        message=payload.message,
    )

    background_tasks.add_task(
        send_discord_message,
        discord_payload,
        payload.email,
    )

    return {"message": "Feedback submitted successfully"}
