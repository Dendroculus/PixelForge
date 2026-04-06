import logging
import re
import os
import asyncio
from fastapi import APIRouter, Form, UploadFile, File, BackgroundTasks, HTTPException, status, Request

from core.security import process_and_sanitize_image
from limiter.rate_limiter import limiter, get_real_client_ip
from limiter.usage_limiter import enforce_daily_limit, get_usage_status
from services.storage import StorageService
from services.esrgan import ai_upscaler
from api.dependencies import verify_turnstile
from core.config import LimitConfig as LC
from helper.utils import get_result_filename

logger = logging.getLogger(__name__)

router = APIRouter(tags=["upscale"])
JOB_ID_RE = re.compile(r"^[a-f0-9]{32}$")

MAX_PENDING_JOBS = int(os.getenv("MAX_PENDING_JOBS", "100"))
_pending_jobs = 0
_pending_jobs_lock = asyncio.Lock()


def _is_manual_bypass_allowed() -> bool:
    """
    Allows bypassing Turnstile verification in local/dev environments
    when explicitly enabled via environment variables.
    """
    env = os.getenv("ENVIRONMENT", "").lower()
    allow_bypass = os.getenv("ALLOW_TURNSTILE_TEST_BYPASS", "false").lower() in {"1", "true", "yes", "on"}
    return env in {"local", "dev", "development"} and allow_bypass


async def process_image_task(job_id: str, safe_filename: str, model_type: str, scale: int) -> None:
    """
    Background task that performs image upscaling and handles storage cleanup.

    Steps:
    - Run AI upscaling
    - Delete uploaded original file
    - Mark job as failed if processing fails
    - Decrement pending job counter
    """
    global _pending_jobs
    logger.info("Background task started for job=%s model=%s scale=%s", job_id, model_type, scale)

    try:
        success = await ai_upscaler.run_upscale(
            safe_filename=safe_filename,
            job_id=job_id,
            model_type=model_type,
            scale=scale
        )

        await StorageService.delete_azure_blob(StorageService.UPLOAD_CONTAINER, safe_filename)

        if success:
            logger.info("Upscale successful for job=%s", job_id)
        else:
            await StorageService.mark_job_failed(job_id)

    except Exception as e:
        logger.error("Task error for job=%s: %s", job_id, e)
        await StorageService.mark_job_failed(job_id)
        await StorageService.delete_azure_blob(StorageService.UPLOAD_CONTAINER, safe_filename)
    finally:
        async with _pending_jobs_lock:
            _pending_jobs = max(0, _pending_jobs - 1)


@router.post(
    "/upscale",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Upload image for upscaling",
)
@limiter.limit(LC.UPLOAD_RATE_LIMIT)
async def upload_image(
    request: Request,
    background_tasks: BackgroundTasks,
    cf_turnstile_response: str = Form(...),
    scale: int = Form(2),
    file: UploadFile = File(...),
):
    """
    Upload endpoint for image upscaling.

    Flow:
    - Verify Turnstile (or allow dev bypass)
    - Enforce per-IP daily usage limit
    - Apply backpressure via pending job limit
    - Sanitize and store uploaded image
    - Queue background processing task

    Returns:
    - job_id for polling result
    """

    if not (cf_turnstile_response == "manual_test_bypass" and _is_manual_bypass_allowed()):
        await verify_turnstile(cf_turnstile_response)

    client_ip = get_real_client_ip(request)
    is_allowed = await enforce_daily_limit(client_ip, limit_24h=LC.DAILY_USAGE_LIMIT)

    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="LIMIT_REACHED",
        )

    global _pending_jobs
    async with _pending_jobs_lock:
        if _pending_jobs >= MAX_PENDING_JOBS:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Server busy. Please retry shortly.",
            )
        _pending_jobs += 1

    try:
        job_id, safe_filename, image_stream = await process_and_sanitize_image(file)
        await StorageService.save_upload(image_stream, safe_filename)
    except HTTPException:
        async with _pending_jobs_lock:
            _pending_jobs = max(0, _pending_jobs - 1)
        raise
    except Exception as e:
        async with _pending_jobs_lock:
            _pending_jobs = max(0, _pending_jobs - 1)
        logger.error("Upload handling failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process upload",
        )

    model_type = "general"
    background_tasks.add_task(process_image_task, job_id, safe_filename, model_type, scale)

    return {"message": "Upload successful, processing started", "job_id": job_id}


@router.get(
    "/result/{job_id}",
    summary="Get upscale result",
)
@limiter.limit(LC.POLL_RATE_LIMIT)
async def get_result(
    request: Request,
    job_id: str,
):
    """
    Polling endpoint for job result.

    Returns:
    - status: "processing" | "ready" | "failed"
    - url: result image URL (if ready)
    """

    if not job_id or not JOB_ID_RE.fullmatch(job_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid job ID")

    try:
        is_failed = await StorageService.check_job_failed(job_id)
        if is_failed:
            return {"status": "failed", "message": "AI processing failed or ran out of memory."}

        result_filename = get_result_filename(job_id)
        exists = await StorageService.check_result_exists(result_filename)

        if exists:
            url = StorageService.get_result_url(result_filename)
            return {"status": "ready", "url": url}

        return {"status": "processing"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error checking result for job=%s: %s", job_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving job status",
        )


@router.get(
    "/usage",
    status_code=status.HTTP_200_OK,
)
@limiter.limit(LC.POLL_RATE_LIMIT)
async def get_usage(request: Request):
    """
    Returns current usage statistics for the client IP.
    """
    client_ip = get_real_client_ip(request)
    return await get_usage_status(client_ip, limit_24h=LC.DAILY_USAGE_LIMIT)