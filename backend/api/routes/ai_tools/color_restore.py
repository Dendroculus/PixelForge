"""Color restoration start route.

This module exposes the endpoint responsible for starting a previously
initialized color restoration job. The actual AI execution is delegated to
``JobManager`` through the shared job dispatcher so route handlers remain thin
and consistent across AI tools.

Expected workflow:
    1. Client calls ``/{feature}/init`` to create a job and upload URL.
    2. Client uploads the source image to Azure Blob Storage.
    3. Client calls this route with the returned job metadata.
    4. The job is reserved, queued, and processed in the background.
"""

from fastapi import APIRouter, BackgroundTasks, Request, status

from api.schemas.ai_tools import StartColorRestoreRequest
from api.docs import AI_START_RESPONSES
from core.config import settings
from limiter.rate_limiter import limiter
from services.job.job_dispatcher import reserve_and_queue_job
from services.job.job_manager import JobManager

router = APIRouter(tags=["ai_tools"])


@router.post(
    "/colorrestore/start",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Start color restoration job",
    description=(
        "Queues a previously initialized color restoration job. "
        "The source image must already be uploaded to Azure using the signed "
        "upload URL returned by the initialization endpoint."
    ),
    response_description="Accepted job metadata containing status and job ID.",
    responses=AI_START_RESPONSES,
)
@limiter.limit(settings.UPLOAD_RATE_LIMIT)
async def start_colorrestore(
    request: Request,
    payload: StartColorRestoreRequest,
    bg_tasks: BackgroundTasks,
):
    """Reserve capacity and queue a color restoration job.

    Args:
        request:
            Current FastAPI request, used by the limiter and dispatcher to
            resolve the real client IP.
        payload:
            Job metadata returned by the initialization endpoint.
        bg_tasks:
            FastAPI background task container used to run processing after
            the response is accepted.

    Returns:
        dict:
            Accepted job response containing a status message and ``job_id``.
    """
    return await reserve_and_queue_job(
        "colorrestore",
        request,
        payload.job_id,
        payload.safe_filename,
        bg_tasks,
        JobManager.process_colorrestore,
    )
