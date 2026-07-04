from fastapi import APIRouter, BackgroundTasks, status, Request

from limiter.rate_limiter import limiter, get_real_client_ip
from services.job.job_initializer import JobInitializer
from services.job.job_manager import JobManager
from core.config import settings
from domain.ai_features import FeatureType
from services.job.job_dispatcher import reserve_and_queue_job
from api.schemas.ai_tools import (
    InitRequest,
    StartUpscaleRequest,
    StartRembgRequest,
    StartColorRestoreRequest,
)

router = APIRouter(tags=["ai_tools"])

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

    return await JobInitializer.initialize_job(
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