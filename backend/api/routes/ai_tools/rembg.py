"""Background removal start route.

This module exposes the endpoint that starts a previously initialized
background removal job. It intentionally contains only HTTP-layer concerns;
queue reservation, quota enforcement, and AI execution are handled by the
shared job services.
"""

from fastapi import APIRouter, BackgroundTasks, Request, status

from api.schemas.ai_tools import StartRembgRequest
from api.docs import AI_START_RESPONSES
from core.config import settings
from limiter.rate_limiter import limiter
from services.job.job_dispatcher import reserve_and_queue_job
from services.job.job_manager import JobManager

router = APIRouter(tags=["ai_tools"])


@router.post(
    "/rembg/start",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Start background removal job",
    description=(
        "Queues a previously initialized background removal job. "
        "The source image must already be uploaded to Azure using the signed "
        "upload URL returned by the initialization endpoint."
    ),
    response_description="Accepted job metadata containing status and job ID.",
    responses=AI_START_RESPONSES,
)
@limiter.limit(settings.UPLOAD_RATE_LIMIT)
async def start_rembg(
    request: Request,
    payload: StartRembgRequest,
    bg_tasks: BackgroundTasks,
):
    """Reserve capacity and queue a background removal job.

    Args:
        request:
            Current FastAPI request, used by the limiter and dispatcher.
        payload:
            Job metadata returned by the initialization endpoint.
        bg_tasks:
            FastAPI background task container used to schedule processing.

    Returns:
        dict:
            Accepted job response containing a status message and ``job_id``.
    """
    return await reserve_and_queue_job(
        "rembg",
        request,
        payload.job_id,
        payload.safe_filename,
        bg_tasks,
        JobManager.process_rembg,
    )
