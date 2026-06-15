import asyncio
import os
import logging
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

MAX_PENDING_JOBS = int(os.getenv("MAX_PENDING_JOBS", "100"))

_pending_jobs = 0
_pending_jobs_lock = None
_active_jobs = set()


class QueueService:
    """
    Manages system concurrency, active processing tasks, and server load limits.

    This service acts as a gatekeeper, ensuring that the backend does not exceed
    its maximum concurrent job capacity, preventing out-of-memory (OOM) crashes
    and CPU starvation.
    """

    @classmethod
    async def reserve_slot(cls, job_id: str) -> None:
        """
        Validates concurrency constraints and reserves an execution slot.

        Checks if the specific job is already running to prevent duplicate
        processing, and ensures the total number of pending jobs does not
        exceed the configured MAX_PENDING_JOBS limit.

        Args:
            job_id: 
                Unique identifier for the AI processing job.

        Raises:
            HTTPException:
                - 400 error if the job_id is already actively processing.
                - 503 error if the server has reached maximum concurrency capacity.

        Returns:
            None.
        """
        global _pending_jobs, _pending_jobs_lock

        if job_id in _active_jobs:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Job already processing."
            )

        if _pending_jobs_lock is None:
            _pending_jobs_lock = asyncio.Lock()

        async with _pending_jobs_lock:
            if _pending_jobs >= MAX_PENDING_JOBS:
                logger.warning("Server busy. Active jobs: %s", len(_active_jobs))
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE, 
                    detail="Server busy."
                )
            _pending_jobs += 1
            
        _active_jobs.add(job_id)

    @classmethod
    async def release_slot(cls, job_id: str) -> None:
        """
        Frees up an execution slot and removes the job from the active tracking set.

        This method is idempotent and safe to call even if the job was
        never fully registered. It should typically be called inside a 
        `finally` block within the job manager to guarantee cleanup.

        Args:
            job_id: 
                Unique identifier for the AI processing job.

        Returns:
            None.
        """
        global _pending_jobs, _pending_jobs_lock
        
        _active_jobs.discard(job_id)
        
        if _pending_jobs_lock is None:
            _pending_jobs_lock = asyncio.Lock()
            
        async with _pending_jobs_lock:
            _pending_jobs = max(0, _pending_jobs - 1)