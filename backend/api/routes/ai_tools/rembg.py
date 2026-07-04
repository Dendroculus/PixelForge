from fastapi import APIRouter, BackgroundTasks, Request, status

from api.schemas.ai_tools import StartRembgRequest
from core.config import settings
from limiter.rate_limiter import limiter
from services.job.job_dispatcher import reserve_and_queue_job
from services.job.job_manager import JobManager

router = APIRouter(tags=["ai_tools"])


@router.post("/rembg/start", status_code=status.HTTP_202_ACCEPTED)
@limiter.limit(settings.UPLOAD_RATE_LIMIT)
async def start_rembg(
    request: Request,
    payload: StartRembgRequest,
    bg_tasks: BackgroundTasks,
):
    """
    Queues a background removal job.
    """
    return await reserve_and_queue_job(
        "rembg",
        request,
        payload.job_id,
        payload.safe_filename,
        bg_tasks,
        JobManager.process_rembg,
    )