import asyncio
import logging

from fastapi import HTTPException, status

from core.config import settings

logger = logging.getLogger(__name__)


# Tracks the current number of jobs waiting or being processed.
_pending_jobs = 0

# Async lock used to protect concurrent access to queue counters.
_pending_jobs_lock = None

# Stores job IDs that are currently reserved/processing.
_active_jobs = set()


class QueueService:
    """
    Service responsible for managing application job concurrency.

    Responsibilities:
    - Prevent duplicate job execution.
    - Limit the number of concurrent jobs.
    - Track active jobs.
    - Safely increment/decrement queue counters using asyncio locks.

    The queue system works by reserving a slot before processing
    and releasing the slot when the job finishes or fails.
    """

    @classmethod
    async def reserve_slot(cls, job_id: str) -> None:
        """
        Reserve a processing slot for a new job.

        Validation:
        - Rejects duplicate job IDs already in processing.
        - Rejects new jobs when the server reaches the maximum
          concurrent job limit.

        Args:
            job_id:
                Unique identifier of the job being registered.

        Raises:
            HTTPException:
                400 if the job is already processing.
                503 if the server has reached its concurrency limit.
        """
        global _pending_jobs, _pending_jobs_lock

        # Prevent the same job from being queued multiple times.
        if job_id in _active_jobs:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Job already processing."
            )

        # Initialize lock lazily to avoid unnecessary creation.
        if _pending_jobs_lock is None:
            _pending_jobs_lock = asyncio.Lock()

        # Protect queue counter updates from race conditions.
        async with _pending_jobs_lock:

            if _pending_jobs >= settings.MAX_CONCURRENT_JOBS:
                logger.warning(
                    "Server busy. Active jobs: %s",
                    len(_active_jobs)
                )

                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Server busy."
                )

            _pending_jobs += 1

        # Register job as active after successfully reserving a slot.
        _active_jobs.add(job_id)


    @classmethod
    async def release_slot(cls, job_id: str) -> None:
        """
        Release a previously reserved processing slot.

        Called after:
        - Successful job completion.
        - Failed job processing.
        - Any cleanup/finalization flow.

        Args:
            job_id:
                Unique identifier of the completed job.

        Notes:
            Uses max(0, value) to prevent the queue counter
            from becoming negative due to unexpected release calls.
        """
        global _pending_jobs, _pending_jobs_lock

        # Remove job from active tracking.
        _active_jobs.discard(job_id)

        # Ensure lock exists before modifying shared state.
        if _pending_jobs_lock is None:
            _pending_jobs_lock = asyncio.Lock()

        # Safely update queue counter.
        async with _pending_jobs_lock:
            _pending_jobs = max(0, _pending_jobs - 1)