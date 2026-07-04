import re

from fastapi import APIRouter, HTTPException, Request, status

from api.schemas.ai_tools import InitRequest
from core.config import settings
from domain.ai_features import FeatureType
from limiter.rate_limiter import get_real_client_ip, limiter
from limiter.usage_service import UsageService
from services.azure.storage import StorageService
from services.azure.storage_utils import get_result_filename
from services.job.job_initializer import JobInitializer

router = APIRouter(tags=["ai_jobs"])

JOB_ID_RE = re.compile(r"^[a-f0-9]{32}$")


def get_feature_limit(feature: FeatureType) -> int:
    """
    Return the configured daily limit for a supported AI feature.

    FeatureType already prevents unsupported feature names from reaching this point.
    """
    return settings.FEATURE_LIMITS[feature]


@router.post("/{feature}/init")
@limiter.limit(settings.UPLOAD_RATE_LIMIT)
async def init_feature(
    feature: FeatureType,
    request: Request,
    payload: InitRequest,
):
    """
    Initializes an AI processing job.
    """
    daily_limit = get_feature_limit(feature)

    return await JobInitializer.initialize_job(
        cf_turnstile_response=payload.cf_turnstile_response,
        filename=payload.filename,
        feature=feature,
        limit_24h=daily_limit,
        client_ip=get_real_client_ip(request),
    )


@router.get("/result/{job_id}")
@limiter.limit(settings.POLL_RATE_LIMIT)
async def get_result(request: Request, job_id: str):
    """
    Polls the storage service for the completion status of a specific job.
    """
    if not job_id or not JOB_ID_RE.fullmatch(job_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid job ID",
        )

    if await StorageService.check_job_failed(job_id):
        return {
            "status": "failed",
            "message": "AI processing failed.",
        }

    result_filename = get_result_filename(job_id)

    if await StorageService.check_result_exists(result_filename):
        return {
            "status": "ready",
            "url": StorageService.get_result_url(result_filename),
        }

    return {"status": "processing"}


@router.get("/usage")
@limiter.limit(settings.POLL_RATE_LIMIT)
async def get_usage(
    request: Request,
    feature: FeatureType = "upscale",
):
    """
    Retrieves the current 24-hour usage count for a supported AI feature.
    """
    client_ip = get_real_client_ip(request)
    limit = get_feature_limit(feature)

    return await UsageService.get_usage_status(
        client_ip,
        limit_24h=limit,
        feature=feature,
    )