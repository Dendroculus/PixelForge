from fastapi import APIRouter, BackgroundTasks, Request

from limiter.rate_limiter import limiter
from services.security.turnstile_service import verify_turnstile
from core.config import settings
from utils.discord_webhooks import build_feedback_payload, send_discord_message
from api.schemas.feedback import FeedbackRequest

router = APIRouter(tags=["feedback"])

@router.post("/feedback")
@limiter.limit(f"{settings.FEEDBACK_RATE_LIMIT};{settings.FEEDBACK_DAILY_USAGE_LIMIT}/day")
async def submit_feedback(
    request: Request,
    payload: FeedbackRequest,
    background_tasks: BackgroundTasks
):
    """
    Verifies anti-bot token and dispatches user feedback to Discord asynchronously.
    
    Args:
        request (Request): The incoming HTTP request.
        payload (FeedbackRequest): The feedback data and Turnstile response.
        background_tasks (BackgroundTasks): FastAPI background task manager.

    Returns:
        dict: Success confirmation message.
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