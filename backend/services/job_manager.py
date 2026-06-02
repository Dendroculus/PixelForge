import logging
import os
import asyncio
import uuid
from fastapi import HTTPException, status

from limiter.usage_limiter import check_daily_limit, increment_daily_limit
from services.features.storage import StorageService
from services.features.upscale_esrgan import ai_upscaler
from services.features.bg_remover import bg_remover
from services.features.color_restorer import color_restorer
from api.dependencies import verify_turnstile
from core.config import LimitConfig as LC, FEATURE_LIMITS

logger = logging.getLogger(__name__)

MAX_PENDING_JOBS = int(os.getenv("MAX_PENDING_JOBS", "100"))
_pending_jobs = 0
_pending_jobs_lock = asyncio.Lock()
_active_jobs = set()

class JobManager:
    """Manages AI processing jobs, concurrency, and orchestration."""

    @staticmethod
    def is_manual_bypass_allowed() -> bool:
        env = os.getenv("ENVIRONMENT", "").lower()
        allow_bypass = os.getenv("ALLOW_TURNSTILE_TEST_BYPASS", "false").lower() in {"1", "true", "yes", "on"}
        return env in {"local", "dev", "development"} and allow_bypass

    @classmethod
    async def initialize_job(cls, cf_turnstile_response: str, filename: str, feature: str, limit_24h: int, client_ip: str) -> dict:
        """Handles Turnstile verification, limits, and secure URL generation."""
        if not (cf_turnstile_response == "manual_test_bypass" and cls.is_manual_bypass_allowed()):
            await verify_turnstile(cf_turnstile_response)

        is_allowed = await check_daily_limit(client_ip, limit_24h=limit_24h, feature=feature)
        if not is_allowed:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="LIMIT_REACHED")

        job_id = uuid.uuid4().hex
        ext = filename.split(".")[-1].lower() if "." in filename else "jpg"
        ext = ext if ext in {"jpg", "jpeg", "png", "webp"} else "jpg"
        safe_filename = f"{job_id}.{ext}"

        return {
            "job_id": job_id,
            "safe_filename": safe_filename,
            "upload_url": StorageService.generate_upload_sas(safe_filename),
        }

    @classmethod
    async def check_and_register_job(cls, job_id: str, client_ip: str, feature: str):
        """Validates rate limits and concurrency locks before queuing."""
        global _pending_jobs

        # 1. Enforce Daily Limits
        limit = FEATURE_LIMITS.get(feature, LC.UPSCALE_DAILY_USAGE_LIMIT)
        is_allowed = await check_daily_limit(client_ip, limit_24h=limit, feature=feature)
        if not is_allowed:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="LIMIT_REACHED")

        # 2. Check Concurrency
        if job_id in _active_jobs:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Job already processing.")

        async with _pending_jobs_lock:
            if _pending_jobs >= MAX_PENDING_JOBS:
                raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Server busy.")
            _pending_jobs += 1
            
        _active_jobs.add(job_id)

    @classmethod
    async def _cleanup_job(cls, job_id: str):
        """Helper to manage internal queue state safely."""
        global _pending_jobs
        _active_jobs.discard(job_id)
        async with _pending_jobs_lock:
            _pending_jobs = max(0, _pending_jobs - 1)

    # --- Task Runners ---

    @classmethod
    async def process_upscale(cls, job_id: str, safe_filename: str, model_type: str, scale: int, client_ip: str):
        try:
            success = await ai_upscaler.run_upscale(safe_filename=safe_filename, job_id=job_id, model_type=model_type, scale=scale)
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
            await cls._cleanup_job(job_id)

    @classmethod
    async def process_rembg(cls, job_id: str, safe_filename: str, client_ip: str):
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
            await cls._cleanup_job(job_id)

    @classmethod
    async def process_colorrestore(cls, job_id: str, safe_filename: str, client_ip: str):
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
            await cls._cleanup_job(job_id)