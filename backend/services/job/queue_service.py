"""In-process queue and concurrency guard for AI jobs.

This module tracks currently active jobs and prevents the backend process from
accepting more concurrent AI work than configured. It is intentionally simple
and process-local; if the backend is scaled horizontally, each process keeps its
own local queue state.
"""

import asyncio
import logging

from fastapi import HTTPException, status

from core.config import settings
from utils.error import codes
from utils.error.responses import build_error_payload

logger = logging.getLogger(__name__)

_pending_jobs = 0
_pending_jobs_lock = None
_active_jobs = set()


class QueueService:
    """Service responsible for process-local AI job concurrency control."""

    @classmethod
    async def reserve_slot(cls, job_id: str) -> None:
        """Reserve processing capacity for a job.

        Args:
            job_id:
                Unique job identifier.

        Raises:
            HTTPException:
                Raised with structured ``VALIDATION_ERROR`` for duplicate
                active jobs, or ``RATE_LIMITED`` when the process has reached
                its concurrency limit.
        """
        global _pending_jobs, _pending_jobs_lock

        if job_id in _active_jobs:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=build_error_payload(
                    codes.VALIDATION_ERROR,
                    "Job already processing.",
                ),
            )

        if _pending_jobs_lock is None:
            _pending_jobs_lock = asyncio.Lock()

        async with _pending_jobs_lock:
            if _pending_jobs >= settings.MAX_CONCURRENT_JOBS:
                logger.warning(
                    "Server busy. Active jobs: %s",
                    len(_active_jobs),
                )

                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=build_error_payload(
                        codes.RATE_LIMITED,
                        "Server busy. Please try again shortly.",
                    ),
                )

            _pending_jobs += 1

        _active_jobs.add(job_id)

    @classmethod
    async def release_slot(cls, job_id: str) -> None:
        """Release processing capacity for a completed or failed job.

        Args:
            job_id:
                Job identifier to remove from active tracking.
        """
        global _pending_jobs, _pending_jobs_lock

        _active_jobs.discard(job_id)

        if _pending_jobs_lock is None:
            _pending_jobs_lock = asyncio.Lock()

        async with _pending_jobs_lock:
            _pending_jobs = max(0, _pending_jobs - 1)
