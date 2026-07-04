from fastapi import APIRouter, BackgroundTasks, Request, status

from api.schemas.ai_tools import StartColorRestoreRequest
from core.config import settings
from limiter.rate_limiter import limiter
from services.job.job_dispatcher import reserve_and_queue_job
from services.job.job_manager import JobManager

router = APIRouter(tags=["ai_tools"])


@router.post("/colorrestore/start", status_code=status.HTTP_202_ACCEPTED)
@limiter.limit(settings.UPLOAD_RATE_LIMIT)
async def start_colorrestore(
    request: Request,
    payload: StartColorRestoreRequest,
    bg_tasks: BackgroundTasks,
):
    """
    Queues a color restoration job.
    """
    return await reserve_and_queue_job(
        "colorrestore",
        request,
        payload.job_id,
        payload.safe_filename,
        bg_tasks,
        JobManager.process_colorrestore,
    )