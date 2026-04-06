import logging
import re
import os
import asyncio
from fastapi import APIRouter, Form, UploadFile, File, BackgroundTasks, HTTPException, status, Request

from core.security import process_and_sanitize_image
from limiter.rate_limiter import limiter, get_real_client_ip
from limiter.usage_limiter import enforce_daily_limit, get_usage_status, consume_daily_usage
from core.job_store import create_job, get_job, update_job_status, mark_usage_charged, mark_job_failed_if_stale
from services.storage import StorageService
from services.esrgan import ai_upscaler
from api.dependencies import verify_turnstile
from core.config import LimitConfig as LC

logger = logging.getLogger(__name__)

router = APIRouter(tags=["upscale"])
JOB_ID_RE = re.compile(r"^[a-f0-9]{32}$")

MAX_PENDING_JOBS = int(os.getenv("MAX_PENDING_JOBS", "100"))
MAX_JOB_AGE_SECONDS = int(os.getenv("MAX_JOB_AGE_SECONDS", "420"))
_pending_jobs = 0
_pending_jobs_lock = asyncio.Lock()


def _is_manual_bypass_allowed() -> bool:
    env = os.getenv("ENVIRONMENT", "").lower()
    allow_bypass = os.getenv("ALLOW_TURNSTILE_TEST_BYPASS", "false").lower() in {"1", "true", "yes", "on"}
    return env in {"local", "dev", "development"} and allow_bypass


def _sanitize_scale(scale: int) -> int:
    try:
        n = int(scale)
    except (TypeError, ValueError):
        return 2
    return max(1, min(4, n))


async def process_image_task(job_id: str, safe_filename: str, model_type: str, scale: int) -> None:
    global _pending_jobs
    logger.info("Background task started job=%s model=%s scale=%sx", job_id, model_type, scale)

    try:
        try:
            await update_job_status(job_id, "processing")
        except Exception:
            logger.exception("Failed to mark processing for job=%s", job_id)

        success, result_filename, error_msg = await ai_upscaler.run_upscale(
            safe_filename=safe_filename,
            job_id=job_id,
            model_type=model_type,
            scale=scale,
        )

        try:
            await StorageService.delete_azure_blob(StorageService.UPLOAD_CONTAINER, safe_filename)
        except Exception:
            logger.exception("Failed to delete upload blob job=%s", job_id)

        if success and result_filename:
            try:
                await update_job_status(job_id, "ready", result_filename=result_filename)
            except Exception:
                logger.exception("Failed to mark ready for job=%s", job_id)
        else:
            try:
                await update_job_status(job_id, "failed", error_message=error_msg or "AI processing failed.")
            except Exception:
                logger.exception("Failed to mark failed for job=%s", job_id)

    except Exception as e:
        logger.exception("Task error for job=%s: %s", job_id, e)
        try:
            await update_job_status(job_id, "failed", error_message="Internal processing error.")
        except Exception:
            logger.exception("Failed final failed-mark for job=%s", job_id)

    finally:
        async with _pending_jobs_lock:
            _pending_jobs = max(0, _pending_jobs - 1)


@router.post("/upscale", status_code=status.HTTP_202_ACCEPTED)
@limiter.limit(LC.UPLOAD_RATE_LIMIT)
async def upload_image(
    request: Request,
    background_tasks: BackgroundTasks,
    cf_turnstile_response: str = Form(...),
    model_type: str = Form("general"),
    scale: int = Form(2),
    file: UploadFile = File(...),
):
    if not (cf_turnstile_response == "manual_test_bypass" and _is_manual_bypass_allowed()):
        await verify_turnstile(cf_turnstile_response)

    client_ip = get_real_client_ip(request)
    is_allowed = await enforce_daily_limit(client_ip, limit_24h=LC.DAILY_USAGE_LIMIT)
    if not is_allowed:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="LIMIT_REACHED")

    safe_scale = _sanitize_scale(scale)
    safe_model_type = "general"

    global _pending_jobs
    async with _pending_jobs_lock:
        if _pending_jobs >= MAX_PENDING_JOBS:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Server busy. Please retry shortly.")
        _pending_jobs += 1

    try:
        job_id, safe_filename, image_stream = await process_and_sanitize_image(file)
        await StorageService.save_upload(image_stream, safe_filename)
        await create_job(job_id, client_ip, safe_filename, safe_scale, safe_model_type)
    except HTTPException:
        async with _pending_jobs_lock:
            _pending_jobs = max(0, _pending_jobs - 1)
        raise
    except Exception as e:
        async with _pending_jobs_lock:
            _pending_jobs = max(0, _pending_jobs - 1)
        logger.error("Upload handling failed: %s", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to process upload")

    background_tasks.add_task(process_image_task, job_id, safe_filename, safe_model_type, safe_scale)
    return {"message": "Upload successful, processing started", "job_id": job_id, "scale": safe_scale}


@router.get("/result/{job_id}")
@limiter.limit(LC.POLL_RATE_LIMIT)
async def get_result(request: Request, job_id: str):
    if not job_id or not JOB_ID_RE.fullmatch(job_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid job ID")

    try:
        # hard fail-safe: stale queued/processing cannot live forever
        try:
            await mark_job_failed_if_stale(job_id, MAX_JOB_AGE_SECONDS)
        except Exception:
            logger.exception("Stale check failed for job=%s", job_id)

        job = await get_job(job_id)
        if not job:
            return {"status": "failed", "message": "Job not found."}

        status_value = job.get("status")
        if status_value in ("queued", "processing"):
            return {"status": "processing"}

        if status_value == "failed":
            return {"status": "failed", "message": job.get("error_message") or "AI processing failed."}

        if status_value == "ready":
            if not job.get("usage_charged", False):
                client_ip = get_real_client_ip(request)
                consumed = await consume_daily_usage(client_ip, limit_24h=LC.DAILY_USAGE_LIMIT)
                if not consumed:
                    await update_job_status(job_id, "failed", error_message="Daily usage limit reached.")
                    return {"status": "failed", "message": "Daily usage limit reached."}
                await mark_usage_charged(job_id)

            result_filename = job.get("result_filename")
            if not result_filename:
                await update_job_status(job_id, "failed", error_message="Result metadata missing.")
                return {"status": "failed", "message": "Result metadata missing."}

            return {"status": "ready", "url": StorageService.get_result_url(result_filename)}

        return {"status": "failed", "message": "Unknown job state."}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error checking result for job=%s: %s", job_id, e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error retrieving job status")


@router.get("/usage", status_code=status.HTTP_200_OK)
@limiter.limit(LC.POLL_RATE_LIMIT)
async def get_usage(request: Request):
    client_ip = get_real_client_ip(request)
    return await get_usage_status(client_ip, limit_24h=LC.DAILY_USAGE_LIMIT)