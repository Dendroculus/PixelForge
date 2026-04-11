import logging
import re
import os
import asyncio
import uuid
from pydantic import BaseModel
from fastapi import APIRouter, BackgroundTasks, HTTPException, status, Request

from limiter.rate_limiter import limiter, get_real_client_ip
from limiter.usage_limiter import check_daily_limit, increment_daily_limit, get_usage_status
from services.storage import StorageService
from services.esrgan import ai_upscaler
from services.bg_remover import bg_remover
from services.color_restorer import color_restorer
from api.dependencies import verify_turnstile
from core.config import LimitConfig as LC
from helper.utils import get_result_filename

logger = logging.getLogger(__name__)

router = APIRouter(tags=["ai_services"])
JOB_ID_RE = re.compile(r"^[a-f0-9]{32}$")

MAX_PENDING_JOBS = int(os.getenv("MAX_PENDING_JOBS", "100"))
_pending_jobs = 0
_pending_jobs_lock = asyncio.Lock()
_active_jobs = set()


class InitRequest(BaseModel):
    cf_turnstile_response: str
    filename: str


class StartUpscaleRequest(BaseModel):
    job_id: str
    safe_filename: str
    scale: int = 2


class StartRembgRequest(BaseModel):
    job_id: str
    safe_filename: str


class StartColorRestoreRequest(BaseModel):
    job_id: str
    safe_filename: str


def _is_manual_bypass_allowed() -> bool:
    env = os.getenv("ENVIRONMENT", "").lower()
    allow_bypass = os.getenv("ALLOW_TURNSTILE_TEST_BYPASS", "false").lower() in {"1", "true", "yes", "on"}
    return env in {"local", "dev", "development"} and allow_bypass


async def process_upscale_task(job_id: str, safe_filename: str, model_type: str, scale: int, client_ip: str) -> None:
    global _pending_jobs
    try:
        success = await ai_upscaler.run_upscale(
            safe_filename=safe_filename,
            job_id=job_id,
            model_type=model_type,
            scale=scale,
        )
        await StorageService.delete_azure_blob(StorageService.UPLOAD_CONTAINER, safe_filename)
        if success:
            await increment_daily_limit(client_ip, feature="upscale")
        else:
            await StorageService.mark_job_failed(job_id)
    except Exception as e:
        logger.error("Upscale Task error job=%s: %s", job_id, e)
        await StorageService.mark_job_failed(job_id)
        await StorageService.delete_azure_blob(StorageService.UPLOAD_CONTAINER, safe_filename)
    finally:
        _active_jobs.discard(job_id)
        async with _pending_jobs_lock:
            _pending_jobs = max(0, _pending_jobs - 1)


async def process_rembg_task(job_id: str, safe_filename: str, client_ip: str) -> None:
    global _pending_jobs
    try:
        success = await bg_remover.run_removal(safe_filename=safe_filename, job_id=job_id)
        await StorageService.delete_azure_blob(StorageService.UPLOAD_CONTAINER, safe_filename)
        if success:
            await increment_daily_limit(client_ip, feature="rembg")
        else:
            await StorageService.mark_job_failed(job_id)
    except Exception as e:
        logger.error("RemBG Task error job=%s: %s", job_id, e)
        await StorageService.mark_job_failed(job_id)
        await StorageService.delete_azure_blob(StorageService.UPLOAD_CONTAINER, safe_filename)
    finally:
        _active_jobs.discard(job_id)
        async with _pending_jobs_lock:
            _pending_jobs = max(0, _pending_jobs - 1)


async def process_colorrestore_task(job_id: str, safe_filename: str, client_ip: str) -> None:
    global _pending_jobs
    try:
        success = await color_restorer.run_restore(safe_filename=safe_filename, job_id=job_id)
        await StorageService.delete_azure_blob(StorageService.UPLOAD_CONTAINER, safe_filename)
        if success:
            await increment_daily_limit(client_ip, feature="colorrestore")
        else:
            await StorageService.mark_job_failed(job_id)
    except Exception as e:
        logger.error("ColorRestore Task error job=%s: %s", job_id, e)
        await StorageService.mark_job_failed(job_id)
        await StorageService.delete_azure_blob(StorageService.UPLOAD_CONTAINER, safe_filename)
    finally:
        _active_jobs.discard(job_id)
        async with _pending_jobs_lock:
            _pending_jobs = max(0, _pending_jobs - 1)


async def _handle_init(request: Request, payload: InitRequest, feature: str, limit_24h: int):
    if not (payload.cf_turnstile_response == "manual_test_bypass" and _is_manual_bypass_allowed()):
        await verify_turnstile(payload.cf_turnstile_response)

    client_ip = get_real_client_ip(request)
    is_allowed = await check_daily_limit(client_ip, limit_24h=limit_24h, feature=feature)

    if not is_allowed:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="LIMIT_REACHED")

    job_id = uuid.uuid4().hex
    ext = payload.filename.split(".")[-1].lower() if "." in payload.filename else "jpg"
    if ext not in {"jpg", "jpeg", "png", "webp"}:
        ext = "jpg"
    safe_filename = f"{job_id}.{ext}"

    return {
        "job_id": job_id,
        "safe_filename": safe_filename,
        "upload_url": StorageService.generate_upload_sas(safe_filename),
    }


async def _handle_start_check(job_id: str):
    global _pending_jobs
    if job_id in _active_jobs:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Job already processing.")

    async with _pending_jobs_lock:
        if _pending_jobs >= MAX_PENDING_JOBS:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Server busy.")
        _pending_jobs += 1
    _active_jobs.add(job_id)


@router.post("/upscale/init")
@limiter.limit(LC.UPLOAD_RATE_LIMIT)
async def init_upscale(request: Request, payload: InitRequest):
    return await _handle_init(request, payload, "upscale", LC.DAILY_USAGE_LIMIT)


@router.post("/upscale/start", status_code=status.HTTP_202_ACCEPTED)
@limiter.limit(LC.UPLOAD_RATE_LIMIT)
async def start_upscale(request: Request, payload: StartUpscaleRequest, background_tasks: BackgroundTasks):
    await _handle_start_check(payload.job_id)
    client_ip = get_real_client_ip(request)
    background_tasks.add_task(process_upscale_task, payload.job_id, payload.safe_filename, "general", payload.scale, client_ip)
    return {"message": "Upscale started", "job_id": payload.job_id}


@router.post("/rembg/init")
@limiter.limit(LC.UPLOAD_RATE_LIMIT)
async def init_rembg(request: Request, payload: InitRequest):
    return await _handle_init(request, payload, "rembg", LC.REMBG_DAILY_USAGE_LIMIT)


@router.post("/rembg/start", status_code=status.HTTP_202_ACCEPTED)
@limiter.limit(LC.UPLOAD_RATE_LIMIT)
async def start_rembg(request: Request, payload: StartRembgRequest, background_tasks: BackgroundTasks):
    await _handle_start_check(payload.job_id)
    client_ip = get_real_client_ip(request)
    background_tasks.add_task(process_rembg_task, payload.job_id, payload.safe_filename, client_ip)
    return {"message": "RemBG started", "job_id": payload.job_id}


@router.post("/colorrestore/init")
@limiter.limit(LC.UPLOAD_RATE_LIMIT)
async def init_colorrestore(request: Request, payload: InitRequest):
    return await _handle_init(request, payload, "colorrestore", LC.REMBG_DAILY_USAGE_LIMIT)


@router.post("/colorrestore/start", status_code=status.HTTP_202_ACCEPTED)
@limiter.limit(LC.UPLOAD_RATE_LIMIT)
async def start_colorrestore(request: Request, payload: StartColorRestoreRequest, background_tasks: BackgroundTasks):
    await _handle_start_check(payload.job_id)
    client_ip = get_real_client_ip(request)
    background_tasks.add_task(process_colorrestore_task, payload.job_id, payload.safe_filename, client_ip)
    return {"message": "ColorRestore started", "job_id": payload.job_id}


@router.get("/result/{job_id}")
@limiter.limit(LC.POLL_RATE_LIMIT)
async def get_result(request: Request, job_id: str):
    if not job_id or not JOB_ID_RE.fullmatch(job_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid job ID")

    try:
        if await StorageService.check_job_failed(job_id):
            return {"status": "failed", "message": "AI processing failed."}

        result_filename = get_result_filename(job_id)
        if await StorageService.check_result_exists(result_filename):
            return {"status": "ready", "url": StorageService.get_result_url(result_filename)}

        return {"status": "processing"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error checking result job=%s: %s", job_id, e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Status error")


@router.get("/usage")
@limiter.limit(LC.POLL_RATE_LIMIT)
async def get_usage(request: Request, feature: str = "upscale"):
    client_ip = get_real_client_ip(request)
    if feature == "upscale":
        limit = LC.DAILY_USAGE_LIMIT
    elif feature == "rembg":
        limit = LC.REMBG_DAILY_USAGE_LIMIT
    elif feature == "colorrestore":
        limit = LC.COLOR_RESTORE_DAILY_USAGE_LIMIT
    else:
        limit = LC.DAILY_USAGE_LIMIT
    return await get_usage_status(client_ip, limit_24h=limit, feature=feature)