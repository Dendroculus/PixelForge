import logging
import os
import asyncio
import uuid

from fastapi import HTTPException, status
from limiter.usage_service import UsageService

from services.storage import StorageService
from services.ai.upscale import ai_upscaler
from services.ai.bg_remover import bg_remover
from services.ai.color_restorer import color_restorer

from api.dependencies import verify_turnstile
from core.config import LimitConfig as LC, FEATURE_LIMITS, MAX_FILE_SIZE_BYTES

logger = logging.getLogger(__name__)

MAX_PENDING_JOBS = int(os.getenv("MAX_PENDING_JOBS", "100"))
_pending_jobs = 0
_pending_jobs_lock = None
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

        is_allowed = await UsageService.check_daily_limit(client_ip, limit_24h=limit_24h, feature=feature)
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
    async def check_register_and_reserve(cls, job_id: str, client_ip: str, feature: str):
        """
        Validates concurrency constraints AND reserves the daily limit slot BEFORE execution
        to completely eliminate parallel race-condition billing exploits.
        """
        global _pending_jobs, _pending_jobs_lock

        if job_id in _active_jobs:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Job already processing.")

        if _pending_jobs_lock is None:
            _pending_jobs_lock = asyncio.Lock()

        async with _pending_jobs_lock:
            if _pending_jobs >= MAX_PENDING_JOBS:
                raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Server busy.")
            _pending_jobs += 1
            
        _active_jobs.add(job_id)

        limit = FEATURE_LIMITS.get(feature, LC.UPSCALE_DAILY_USAGE_LIMIT)
        
        is_allowed = await UsageService.check_daily_limit(client_ip, limit_24h=limit, feature=feature)
        
        if not is_allowed:
            await cls._cleanup_queue_state(job_id)
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="LIMIT_REACHED")
        
        await UsageService.increment_daily_limit(client_ip, feature=feature)

    @classmethod
    async def _cleanup_queue_state(cls, job_id: str):
        """
        Removes the job from active set and decrements pending count.
        Should be called in a finally block to ensure cleanup happens regardless of success or failure.
        Lazily initializes the lock to avoid unnecessary overhead when not processing jobs.
        """
        global _pending_jobs, _pending_jobs_lock
        
        _active_jobs.discard(job_id)
        
        if _pending_jobs_lock is None:
            _pending_jobs_lock = asyncio.Lock()
            
        async with _pending_jobs_lock:
            _pending_jobs = max(0, _pending_jobs - 1)

    @classmethod
    async def _handle_job_failure(cls, job_id: str, safe_filename: str, client_ip: str, feature: str):
        """Centralized failure and refund management."""
        logger.warning("Job %s failed for feature %s. Initializing cleanup and client limit refund.", job_id, feature)
        await StorageService.mark_job_failed(job_id)
        
        await UsageService.decrement_daily_limit(client_ip, feature=feature)

    @classmethod
    async def _process_feature(cls, job_id: str, safe_filename: str, client_ip: str, feature: str, task_runner):
        """
        Unified task runner for all AI features. 
        Handles max size validation, execution, cleanup, and centralized error/refund management.
        """
        try:
            max_bytes = MAX_FILE_SIZE_BYTES
            blob_size = await StorageService.get_blob_size(StorageService.UPLOAD_CONTAINER, safe_filename)
            
            if blob_size > max_bytes:
                logger.warning("Oversized upload detected: Job %s (%s bytes). Aborting.", job_id, blob_size)
                await cls._handle_job_failure(job_id, safe_filename, client_ip, feature)
                return

            success = await task_runner()
            
            await StorageService.delete_azure_blob(StorageService.UPLOAD_CONTAINER, safe_filename)
            
            if not success:
                await cls._handle_job_failure(job_id, safe_filename, client_ip, feature)

        except Exception as e:
            logger.error("%s Task critical failure job=%s: %s", feature.capitalize(), job_id, e)
            await cls._handle_job_failure(job_id, safe_filename, client_ip, feature)
        finally:
            await cls._cleanup_queue_state(job_id)

    @classmethod
    async def process_upscale(cls, job_id: str, safe_filename: str, model_type: str, scale: int, client_ip: str):
        async def _run():
            return await ai_upscaler.run_upscale(safe_filename=safe_filename, job_id=job_id, model_type=model_type, scale=scale)
        await cls._process_feature(job_id, safe_filename, client_ip, "upscale", _run)

    @classmethod
    async def process_rembg(cls, job_id: str, safe_filename: str, client_ip: str):
        async def _run():
            return await bg_remover.run_removal(safe_filename=safe_filename, job_id=job_id)
        await cls._process_feature(job_id, safe_filename, client_ip, "rembg", _run)

    @classmethod
    async def process_colorrestore(cls, job_id: str, safe_filename: str, client_ip: str):
        async def _run():
            return await color_restorer.run_restore(safe_filename=safe_filename, job_id=job_id)
        await cls._process_feature(job_id, safe_filename, client_ip, "colorrestore", _run)