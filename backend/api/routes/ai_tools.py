from typing import Literal, Callable, Any
from fastapi import APIRouter, BackgroundTasks, status, Request

from limiter.rate_limiter import limiter, get_real_client_ip
from services.job_manager import JobManager
from core.config import LimitConfig as LC, FEATURE_LIMITS

from api.schemas import (
    InitRequest, 
    StartUpscaleRequest, 
    StartRembgRequest, 
    StartColorRestoreRequest
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
    *process_args: Any
) -> dict:
    """
    Internal helper to execute the standard AI job startup sequence.
    Handles IP extraction, job reservation, and background task queuing.

    Args:
        feature (FeatureType): The string identifier of the AI feature.
        request (Request): The incoming HTTP request to extract the client IP.
        job_id (str): The unique 32-character job identifier.
        safe_filename (str): The sanitized filename for storage.
        bg_tasks (BackgroundTasks): FastAPI background task manager.
        process_func (Callable): The specific JobManager method to execute.
        *process_args (Any): Variable arguments required by the specific process_func.

    Returns:
        dict: Standardized status message and job ID.
    """
    client_ip = get_real_client_ip(request)
    
    await JobManager.check_register_and_reserve(job_id, client_ip, feature)
    
    # Queue the background task. 
    # Process functions expect (job_id, safe_filename, *args, client_ip)
    bg_tasks.add_task(
        process_func, 
        job_id, 
        safe_filename, 
        *process_args, 
        client_ip
    )
    
    # Format display name (e.g., "rembg" -> "RemBG", "upscale" -> "Upscale")
    display_name = "RemBG" if feature == "rembg" else feature.capitalize()
    return {"message": f"{display_name} started", "job_id": job_id}


@router.post("/{feature}/init")
@limiter.limit(LC.UPLOAD_RATE_LIMIT)
async def init_feature(feature: FeatureType, request: Request, payload: InitRequest):
    """
    Dynamically handles job initialization for all AI features.
    
    Args:
        feature (FeatureType): The AI feature requested (upscale, rembg, colorrestore).
        request (Request): The incoming HTTP request.
        payload (InitRequest): The Turnstile payload and target filename.

    Returns:
        dict: Initialization response containing signed URLs and job metadata.
    """
    daily_limit = FEATURE_LIMITS.get(feature, LC.UPSCALE_DAILY_USAGE_LIMIT)
    
    return await JobManager.initialize_job(
        cf_turnstile_response=payload.cf_turnstile_response, 
        filename=payload.filename, 
        feature=feature, 
        limit_24h=daily_limit, 
        client_ip=get_real_client_ip(request)
    )


@router.post("/upscale/start", status_code=status.HTTP_202_ACCEPTED)
@limiter.limit(LC.UPLOAD_RATE_LIMIT)
async def start_upscale(request: Request, payload: StartUpscaleRequest, bg_tasks: BackgroundTasks):
    """
    Initiates the background processing for the Upscale feature.
    
    Args:
        request (Request): The incoming HTTP request.
        payload (StartUpscaleRequest): Payload containing job ID, safe filename, and scale factor.
        bg_tasks (BackgroundTasks): FastAPI background task manager.

    Returns:
        dict: Status message and the active job ID.
    """
    return await _reserve_and_queue_job(
        "upscale", request, payload.job_id, payload.safe_filename, bg_tasks,
        JobManager.process_upscale, "general", payload.scale
    )


@router.post("/rembg/start", status_code=status.HTTP_202_ACCEPTED)
@limiter.limit(LC.UPLOAD_RATE_LIMIT)
async def start_rembg(request: Request, payload: StartRembgRequest, bg_tasks: BackgroundTasks):
    """
    Initiates the background processing for the Background Removal feature.
    
    Args:
        request (Request): The incoming HTTP request.
        payload (StartRembgRequest): Payload containing job ID and safe filename.
        bg_tasks (BackgroundTasks): FastAPI background task manager.

    Returns:
        dict: Status message and the active job ID.
    """
    return await _reserve_and_queue_job(
        "rembg", request, payload.job_id, payload.safe_filename, bg_tasks,
        JobManager.process_rembg
    )


@router.post("/colorrestore/start", status_code=status.HTTP_202_ACCEPTED)
@limiter.limit(LC.UPLOAD_RATE_LIMIT)
async def start_colorrestore(request: Request, payload: StartColorRestoreRequest, bg_tasks: BackgroundTasks):
    """
    Initiates the background processing for the Color Restoration feature.
    
    Args:
        request (Request): The incoming HTTP request.
        payload (StartColorRestoreRequest): Payload containing job ID and safe filename.
        bg_tasks (BackgroundTasks): FastAPI background task manager.

    Returns:
        dict: Status message and the active job ID.
    """
    return await _reserve_and_queue_job(
        "colorrestore", request, payload.job_id, payload.safe_filename, bg_tasks,
        JobManager.process_colorrestore
    )