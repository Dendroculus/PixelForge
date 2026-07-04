import re
from fastapi import APIRouter, HTTPException, status, Request

from limiter.rate_limiter import limiter, get_real_client_ip
from limiter.usage_service import UsageService
from services.storage import StorageService
from core.config import settings
from utils.storage_utils import get_result_filename

router = APIRouter(tags=["system"])

JOB_ID_RE = re.compile(r"^[a-f0-9]{32}$")

@router.get("/result/{job_id}")
@limiter.limit(settings.POLL_RATE_LIMIT)
async def get_result(request: Request, job_id: str):
    """
    Polls the storage service for the completion status of a specific job.
    
    Args:
        request (Request): The incoming HTTP request.
        job_id (str): The 32-character hexadecimal job identifier.

    Raises:
        HTTPException: If the job_id format is invalid.

    Returns:
        dict: The job status ("failed", "processing", or "ready") and the result URL if ready.
    """
    if not job_id or not JOB_ID_RE.fullmatch(job_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Invalid job ID"
        )

    if await StorageService.check_job_failed(job_id):
        return {"status": "failed", "message": "AI processing failed."}

    result_filename = get_result_filename(job_id)
    
    if await StorageService.check_result_exists(result_filename):
        return {
            "status": "ready", 
            "url": StorageService.get_result_url(result_filename)
        }

    return {"status": "processing"}


@router.get("/usage")
@limiter.limit(settings.POLL_RATE_LIMIT)
async def get_usage(request: Request, feature: str = "upscale"):
    """
    Retrieves the current 24-hour usage count for a given feature based on client IP.
    
    Args:
        request (Request): The incoming HTTP request.
        feature (str, optional): The AI feature to check usage for. Defaults to "upscale".

    Returns:
        dict: The usage statistics for the specified feature.
    """
    client_ip = get_real_client_ip(request)
    limit = settings.FEATURE_LIMITS.get(feature, settings.UPSCALE_DAILY_USAGE_LIMIT)
    
    return await UsageService.get_usage_status(client_ip, limit_24h=limit, feature=feature)