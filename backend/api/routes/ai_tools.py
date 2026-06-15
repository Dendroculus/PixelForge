from typing import Literal, Callable, Any

from fastapi import APIRouter, BackgroundTasks, status, Request

from limiter.rate_limiter import limiter, get_real_client_ip
from services.job_manager import JobManager
from core.config import settings

from api.schemas import (
    InitRequest,
    StartUpscaleRequest,
    StartRembgRequest,
    StartColorRestoreRequest,
)


router = APIRouter(tags=["ai_tools"])


FeatureType = Literal["upscale", "rembg", "colorrestore"]


async def _reserve_and_queue_job(
    feature: FeatureType,
    request: Request,
    job_id: str,
    safe_filename: str,
    bg_tasks: BackgroundTasks,
    process_func: Callable,
    *process_args: Any,
) -> dict:
    """
    Reserves a queue slot and schedules an AI processing task.

    Workflow:
    - Extract client IP.
    - Reserve processing capacity.
    - Add background processing task.
    - Return queued job information.

    Args:
        feature:
            AI feature being processed.
        request:
            Incoming HTTP request.
        job_id:
            Unique job identifier.
        safe_filename:
            Sanitized uploaded filename.
        bg_tasks:
            FastAPI background task manager.
        process_func:
            JobManager processing method to execute.
        *process_args:
            Additional arguments required by the processing function.

    Returns:
        dict:
            Job status message and job ID.
    """
    client_ip = get_real_client_ip(request)

    await JobManager.check_register_and_reserve(
        job_id,
        client_ip,
        feature,
    )

    bg_tasks.add_task(
        process_func,
        job_id,
        safe_filename,
        *process_args,
        client_ip,
    )

    display_name = "RemBG" if feature == "rembg" else feature.capitalize()

    return {
        "message": f"{display_name} started",
        "job_id": job_id,
    }


@router.post("/{feature}/init")
@limiter.limit(settings.UPLOAD_RATE_LIMIT)
async def init_feature(
    feature: FeatureType,
    request: Request,
    payload: InitRequest,
):
    """
    Initializes an AI processing job.

    Performs:
    - Turnstile verification.
    - Usage limit validation.
    - Upload URL generation.

    Returns:
        Job metadata required for upload.
    """
    daily_limit = settings.FEATURE_LIMITS.get(
        feature,
        settings.UPSCALE_DAILY_USAGE_LIMIT,
    )

    return await JobManager.initialize_job(
        cf_turnstile_response=payload.cf_turnstile_response,
        filename=payload.filename,
        feature=feature,
        limit_24h=daily_limit,
        client_ip=get_real_client_ip(request),
    )


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
    return await _reserve_and_queue_job(
        "upscale",
        request,
        payload.job_id,
        payload.safe_filename,
        bg_tasks,
        JobManager.process_upscale,
        "general",
        payload.scale,
    )


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
    return await _reserve_and_queue_job(
        "rembg",
        request,
        payload.job_id,
        payload.safe_filename,
        bg_tasks,
        JobManager.process_rembg,
    )


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
    return await _reserve_and_queue_job(
        "colorrestore",
        request,
        payload.job_id,
        payload.safe_filename,
        bg_tasks,
        JobManager.process_colorrestore,
    )