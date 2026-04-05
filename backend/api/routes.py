import logging
import re
from fastapi import APIRouter, Form, UploadFile, File, Depends, BackgroundTasks, HTTPException, status, Request

from core.security import process_and_sanitize_image
from limiter.rate_limiter import limiter, get_real_client_ip
from limiter.usage_limiter import enforce_daily_limit, get_usage_status
from services.storage import StorageService
from services.esrgan import ai_upscaler
from api.dependencies import valid_model_type, verify_turnstile
from core.config import LimitConfig as LC
from helper.utils import get_result_filename
import os

logger = logging.getLogger(__name__)

router = APIRouter(tags=["upscale"])
JOB_ID_RE = re.compile(r"^[a-f0-9]{32}$")


def _is_manual_bypass_allowed() -> bool:
    env = os.getenv("ENVIRONMENT", "").lower()
    allow_bypass = os.getenv("ALLOW_TURNSTILE_TEST_BYPASS", "false").lower() in {"1", "true", "yes", "on"}
    return env not in {"prod", "production"} and allow_bypass


async def process_image_task(job_id: str, safe_filename: str, model_type: str) -> None:
    logger.info("Background task started for job=%s model=%s", job_id, model_type)

    try:
        success = await ai_upscaler.run_upscale(
            safe_filename=safe_filename,
            job_id=job_id,
            model_type=model_type,
        )

        await StorageService.delete_azure_blob(StorageService.UPLOAD_CONTAINER, safe_filename)

        if success:
            logger.info("Upscale successful for job=%s. Result saved to cloud.", job_id)
        else:
            await StorageService.mark_job_failed(job_id)

    except Exception as e:
        logger.error("Task error for job=%s: %s", job_id, e)
        await StorageService.mark_job_failed(job_id)
        await StorageService.delete_azure_blob(StorageService.UPLOAD_CONTAINER, safe_filename)


@router.post(
    "/upscale",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Upload an image for upscaling",
    response_description="Returns the job ID for tracking the upscale process",
)
@limiter.limit(LC.UPLOAD_RATE_LIMIT)
async def upload_image(
    request: Request,
    background_tasks: BackgroundTasks,
    cf_turnstile_response: str = Form(...),
    file: UploadFile = File(...),
    model_type: str = Depends(valid_model_type),
):
    if not (cf_turnstile_response == "manual_test_bypass" and _is_manual_bypass_allowed()):
        await verify_turnstile(cf_turnstile_response)

    client_ip = get_real_client_ip(request)
    is_allowed = await enforce_daily_limit(client_ip, limit_24h=LC.DAILY_USAGE_LIMIT)

    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="LIMIT_REACHED",
        )

    try:
        job_id, safe_filename, image_stream = await process_and_sanitize_image(file)
        await StorageService.save_upload(image_stream, safe_filename)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Upload handling failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process upload",
        )

    background_tasks.add_task(process_image_task, job_id, safe_filename, model_type)

    return {"message": "Upload successful, processing started", "job_id": job_id}


@router.get(
    "/result/{job_id}",
    summary="Check upscaling result",
    response_description="Returns the status of the job and the URL if ready",
)
@limiter.limit(LC.POLL_RATE_LIMIT)
async def get_result(
    request: Request,
    job_id: str,
):
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
async def get_usage(request: Request):
    client_ip = get_real_client_ip(request)
    return await get_usage_status(client_ip, limit_24h=LC.DAILY_USAGE_LIMIT)