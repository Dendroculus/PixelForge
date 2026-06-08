import re
from fastapi import APIRouter, BackgroundTasks, HTTPException, status, Request

# Local Imports
from helper.discord_webhooks import build_feedback_payload, send_discord_message
from limiter.rate_limiter import limiter, get_real_client_ip
from limiter.usage_limiter import get_usage_status
from services.features.storage import StorageService
from services.job_manager import JobManager
from api.dependencies import verify_turnstile
from core.config import LimitConfig as LC, FEATURE_LIMITS
from helper.utils import get_result_filename

# Pydantic Model Imports
from api.schemas import (
    InitRequest, 
    StartUpscaleRequest, 
    StartRembgRequest, 
    StartColorRestoreRequest, 
    FeedbackRequest
)

router = APIRouter(tags=["ai_services"])
JOB_ID_RE = re.compile(r"^[a-f0-9]{32}$")

@router.post("/feedback")
@limiter.limit(f"{LC.FEEDBACK_DAILY_USAGE_LIMIT}/day") # <-- ONLY the daily limit
async def submit_feedback(
    request: Request,
    payload: FeedbackRequest,
    background_tasks: BackgroundTasks
):
    await verify_turnstile(payload.cf_turnstile_response)

    discord_payload = build_feedback_payload(
        name=payload.name,
        email=payload.email,
        message=payload.message,
    )

    background_tasks.add_task(
        send_discord_message,
        discord_payload,
        payload.email,
    )

    return {"message": "Feedback submitted successfully"}

@router.post("/upscale/init")
@limiter.limit(LC.UPLOAD_RATE_LIMIT)
async def init_upscale(request: Request, payload: InitRequest):
    return await JobManager.initialize_job(
        payload.cf_turnstile_response, payload.filename, "upscale", LC.UPSCALE_DAILY_USAGE_LIMIT, get_real_client_ip(request)
    )

@router.post("/upscale/start", status_code=status.HTTP_202_ACCEPTED)
@limiter.limit(LC.UPLOAD_RATE_LIMIT)
async def start_upscale(request: Request, payload: StartUpscaleRequest, background_tasks: BackgroundTasks):
    client_ip = get_real_client_ip(request)
    await JobManager.check_register_and_reserve(payload.job_id, client_ip, "upscale")
    background_tasks.add_task(JobManager.process_upscale, payload.job_id, payload.safe_filename, "general", payload.scale, client_ip)
    return {"message": "Upscale started", "job_id": payload.job_id}

@router.post("/rembg/init")
@limiter.limit(LC.UPLOAD_RATE_LIMIT)
async def init_rembg(request: Request, payload: InitRequest):
    return await JobManager.initialize_job(
        payload.cf_turnstile_response, payload.filename, "rembg", LC.REMBG_DAILY_USAGE_LIMIT, get_real_client_ip(request)
    )

@router.post("/rembg/start", status_code=status.HTTP_202_ACCEPTED)
@limiter.limit(LC.UPLOAD_RATE_LIMIT)
async def start_rembg(request: Request, payload: StartRembgRequest, background_tasks: BackgroundTasks):
    client_ip = get_real_client_ip(request)
    await JobManager.check_register_and_reserve(payload.job_id, client_ip, "rembg")
    background_tasks.add_task(JobManager.process_rembg, payload.job_id, payload.safe_filename, client_ip)
    return {"message": "RemBG started", "job_id": payload.job_id}

@router.post("/colorrestore/init")
@limiter.limit(LC.UPLOAD_RATE_LIMIT)
async def init_colorrestore(request: Request, payload: InitRequest):
    return await JobManager.initialize_job(
        payload.cf_turnstile_response, payload.filename, "colorrestore", LC.COLOR_RESTORE_DAILY_USAGE_LIMIT, get_real_client_ip(request)
    )

@router.post("/colorrestore/start", status_code=status.HTTP_202_ACCEPTED)
@limiter.limit(LC.UPLOAD_RATE_LIMIT)
async def start_colorrestore(request: Request, payload: StartColorRestoreRequest, background_tasks: BackgroundTasks):
    client_ip = get_real_client_ip(request)
    await JobManager.check_register_and_reserve(payload.job_id, client_ip, "colorrestore")
    background_tasks.add_task(JobManager.process_colorrestore, payload.job_id, payload.safe_filename, client_ip)
    return {"message": "ColorRestore started", "job_id": payload.job_id}

@router.get("/result/{job_id}")
@limiter.limit(LC.POLL_RATE_LIMIT)
async def get_result(request: Request, job_id: str):
    if not job_id or not JOB_ID_RE.fullmatch(job_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid job ID")

    if await StorageService.check_job_failed(job_id):
        return {"status": "failed", "message": "AI processing failed."}

    result_filename = get_result_filename(job_id)
    if await StorageService.check_result_exists(result_filename):
        return {"status": "ready", "url": StorageService.get_result_url(result_filename)}

    return {"status": "processing"}

@router.get("/usage")
@limiter.limit(LC.POLL_RATE_LIMIT)
async def get_usage(request: Request, feature: str = "upscale"):
    client_ip = get_real_client_ip(request)
    limit = FEATURE_LIMITS.get(feature, LC.UPSCALE_DAILY_USAGE_LIMIT)
    return await get_usage_status(client_ip, limit_24h=limit, feature=feature)