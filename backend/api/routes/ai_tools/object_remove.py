from fastapi import APIRouter, BackgroundTasks, Request, status

from api.schemas.ai_tools import StartObjectRemoveRequest
from core.config import settings
from limiter.rate_limiter import limiter
from services.job.job_dispatcher import reserve_and_queue_job
from services.job.job_manager import JobManager

router = APIRouter(tags=["ai_tools"])


@router.post("/objectremove/start", status_code=status.HTTP_202_ACCEPTED)
@limiter.limit(settings.UPLOAD_RATE_LIMIT)
async def start_object_remove(
    request: Request,
    payload: StartObjectRemoveRequest,
    bg_tasks: BackgroundTasks,
):
    """
    Queues an object removal job.
    """
    return await reserve_and_queue_job(
        "objectremove",
        request,
        payload.job_id,
        payload.safe_filename,
        bg_tasks,
        JobManager.process_object_remove,
        payload.mask_filename,
    )