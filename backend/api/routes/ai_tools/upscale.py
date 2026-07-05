"""Image upscaling start route.

This module exposes the endpoint that starts a previously initialized image
upscaling job. The route accepts job metadata and the requested upscale factor,
then delegates queue registration and background execution to shared job
services.
"""

from fastapi import APIRouter, BackgroundTasks, Request, status

from api.schemas.ai_tools import StartUpscaleRequest
from core.config import settings
from limiter.rate_limiter import limiter
from services.job.job_dispatcher import reserve_and_queue_job
from services.job.job_manager import JobManager

router = APIRouter(tags=["ai_tools"])


@router.post("/upscale/start", status_code=status.HTTP_202_ACCEPTED)
@limiter.limit(settings.UPLOAD_RATE_LIMIT)
async def start_upscale(
    request: Request,
    payload: StartUpscaleRequest,
    bg_tasks: BackgroundTasks,
):
    """Reserve capacity and queue an image upscaling job.

    Args:
        request:
            Current FastAPI request, used by the limiter and dispatcher.
        payload:
            Upscale job metadata, including the uploaded filename and requested
            scale value.
        bg_tasks:
            FastAPI background task container used to schedule processing.

    Returns:
        dict:
            Accepted job response containing a status message and ``job_id``.
    """
    return await reserve_and_queue_job(
        "upscale",
        request,
        payload.job_id,
        payload.safe_filename,
        bg_tasks,
        JobManager.process_upscale,
        "general",
        payload.scale,
    )
