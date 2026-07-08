"""Shared AI job workflow routes.

This module owns the routes that are common to all AI tools:

    - ``POST /{feature}/init``:
      validates bot protection, checks usage quota, creates a job ID, and
      returns secure Azure upload URL metadata.

    - ``GET /result/{job_id}``:
      polls Azure-backed job state and returns whether the result is still
      processing, ready, or failed.

    - ``GET /usage``:
      returns the current usage status for a feature and client.

    - ``GET /limits``:
      returns public upload/result limits so the frontend can validate using
      backend-owned configuration instead of hardcoded client values.

Feature-specific ``/start`` routes live in ``api.routes.ai_tools`` because
starting a job may require tool-specific arguments such as upscale scale,
object-removal mask filenames, or future tool-specific payloads.
"""

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
from utils.error import codes
from utils.error.responses import build_error_payload

router = APIRouter(tags=["ai_jobs"])

JOB_ID_RE = re.compile(r"^[a-f0-9]{32}$")


def get_feature_limit(feature: FeatureType) -> int:
    """Return the configured 24-hour usage limit for a supported AI feature.

    ``FeatureType`` restricts route input to known features, so this lookup can
    safely depend on the central settings mapping.

    Args:
        feature:
            Supported AI feature name.

    Returns:
        int:
            Configured usage limit for the requested feature.
    """
    return settings.FEATURE_LIMITS[feature]


@router.get("/limits")
@limiter.limit(settings.POLL_RATE_LIMIT)
async def get_runtime_limits(request: Request):
    """Return public upload, resolution, and generated-result limits.

    The frontend uses this endpoint to avoid hardcoding upload size and
    resolution validation rules. The backend still validates every upload and
    generated output because frontend validation is only a user-experience
    improvement and can be bypassed.

    Args:
        request:
            Current FastAPI request, required by the rate limiter.

    Returns:
        dict:
            Public runtime limits grouped by upload, result, upscale, and usage
            feature settings.
    """
    allowed_extensions = sorted(set(settings.FORMAT_MAP.values()))

    return {
        "upload": {
            "max_file_size_mb": settings.MAX_FILE_SIZE_MB,
            "max_file_size_bytes": settings.MAX_FILE_SIZE_BYTES,
            "max_megapixels": settings.MAX_MEGAPIXELS,
            "max_pixels": settings.MAX_PIXELS,
            "allowed_extensions": allowed_extensions,
        },
        "result": {
            "max_result_file_size_mb": settings.MAX_RESULT_FILE_SIZE_MB,
            "max_result_file_size_bytes": settings.MAX_RESULT_FILE_SIZE_BYTES,
            "max_image_dimension": settings.MAX_IMAGE_DIMENSION,
            "min_output_dimension": settings.MIN_OUTPUT_DIMENSION,
            "output_shrink_step": settings.OUTPUT_SHRINK_STEP,
        },
        "upscale": {
            "default_scale": settings.DEFAULT_SCALE,
            "max_output_pixels": settings.MAX_UPSCALE_OUTPUT_PIXELS,
        },
        "features": settings.FEATURE_LIMITS,
    }


@router.post("/{feature}/init")
@limiter.limit(settings.UPLOAD_RATE_LIMIT)
async def init_feature(
    feature: FeatureType,
    request: Request,
    payload: InitRequest,
):
    """Initialize an AI processing job and return secure upload metadata.

    This endpoint does not run the AI model. It prepares a job by validating
    Turnstile, checking usage limits, generating a safe job filename, and
    returning a time-limited Azure upload URL.

    Args:
        feature:
            AI feature being initialized.
        request:
            Current FastAPI request, used to resolve the client IP.
        payload:
            Initialization request containing the original filename and
            Turnstile token.

    Returns:
        dict:
            Job metadata containing ``job_id``, ``safe_filename``, and an
            ``upload_url``. Object removal jobs also include mask upload
            metadata.
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
    """Return the processing status for a specific AI job.

    The status is inferred from Azure Blob Storage:
        - failed marker exists -> ``failed``
        - result blob exists -> ``ready``
        - neither exists -> ``processing``

    Args:
        request:
            Current FastAPI request, required by the rate limiter.
        job_id:
            Hexadecimal job identifier generated during initialization.

    Raises:
        HTTPException:
            Raised with HTTP 400 and a structured ``VALIDATION_ERROR`` payload
            when the job ID format is invalid.

    Returns:
        dict:
            Processing state. Ready jobs include a signed result URL; failed
            jobs include a safe code/message.
    """
    if not job_id or not JOB_ID_RE.fullmatch(job_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=build_error_payload(
                codes.VALIDATION_ERROR,
                "Invalid job ID",
            ),
        )

    failure = await StorageService.get_job_failure(job_id)

    if failure:
        return {
            "status": "failed",
            "code": failure["code"],
            "message": failure["message"],
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
    """Return the current 24-hour usage status for a feature.

    Args:
        request:
            Current FastAPI request, used to resolve the client IP.
        feature:
            Feature whose usage should be checked. Defaults to ``upscale``.

    Returns:
        dict:
            Usage status containing remaining uses and optional reset timestamp.
    """
    client_ip = get_real_client_ip(request)
    limit = get_feature_limit(feature)

    return await UsageService.get_usage_status(
        client_ip,
        limit_24h=limit,
        feature=feature,
    )
