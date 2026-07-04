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
    """
    Queues an image upscaling job.
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