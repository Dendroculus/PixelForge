"""Object removal start route.

This module starts object removal jobs that require both an uploaded source
image and an uploaded mask image. Job execution is delegated through the shared
dispatcher to keep route behavior consistent with the other AI tools.

Expected workflow:
    1. Client initializes an ``objectremove`` job.
    2. Client uploads the source image and mask image to Azure Blob Storage.
    3. Client calls this route with ``job_id``, ``safe_filename``, and
       ``mask_filename``.
    4. The backend reserves capacity and processes the job asynchronously.
"""

from fastapi import APIRouter, BackgroundTasks, Request, status

from api.schemas.ai_tools import StartObjectRemoveRequest
from api.docs import AI_START_RESPONSES
from core.config import settings
from limiter.rate_limiter import limiter
from services.job.job_dispatcher import reserve_and_queue_job
from services.job.job_manager import JobManager

router = APIRouter(tags=["ai_tools"])


@router.post(
    "/objectremove/start",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Start object removal job",
    description=(
        "Queues a previously initialized object removal job. "
        "The source image and mask image must already be uploaded to Azure using the signed "
        "upload URLs returned by the initialization endpoint."
    ),
    response_description="Accepted job metadata containing status and job ID.",
    responses=AI_START_RESPONSES,
)
@limiter.limit(settings.UPLOAD_RATE_LIMIT)
async def start_object_remove(
    request: Request,
    payload: StartObjectRemoveRequest,
    bg_tasks: BackgroundTasks,
):
    """Reserve capacity and queue an object removal job.

    Args:
        request:
            Current FastAPI request, used for rate limiting and client IP
            resolution.
        payload:
            Object removal job metadata, including the source image filename
            and mask filename.
        bg_tasks:
            FastAPI background task container used for asynchronous processing.

    Returns:
        dict:
            Accepted job response containing a status message and ``job_id``.
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
