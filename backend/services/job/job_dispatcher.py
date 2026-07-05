"""Shared job dispatch helper for AI start routes.

Feature-specific route handlers call ``reserve_and_queue_job`` to keep their
HTTP layer thin. This helper resolves the client IP, reserves usage/queue
capacity, schedules the background task, and returns a consistent accepted
response.
"""

from typing import Any, Callable

from fastapi import BackgroundTasks, Request

from domain.ai_features import FEATURE_DISPLAY_NAMES, FeatureType
from limiter.rate_limiter import get_real_client_ip
from services.job.job_manager import JobManager


async def reserve_and_queue_job(
    feature: FeatureType,
    request: Request,
    job_id: str,
    safe_filename: str,
    bg_tasks: BackgroundTasks,
    process_func: Callable,
    *process_args: Any,
) -> dict:
    """Reserve capacity and schedule an AI processing task.

    Args:
        feature:
            AI feature being started.
        request:
            Current FastAPI request, used to resolve client IP.
        job_id:
            Job identifier returned by initialization.
        safe_filename:
            Sanitized uploaded image filename.
        bg_tasks:
            FastAPI background task container.
        process_func:
            JobManager processing coroutine to run in the background.
        *process_args:
            Feature-specific arguments passed before ``client_ip``.

    Returns:
        dict:
            Accepted response containing message and job ID.
    """
    client_ip = get_real_client_ip(request)

    await JobManager.check_register_and_reserve(
        job_id,
        client_ip,
        feature,
    )

    bg_tasks.add_task(
        process_func,
        job_id,
        safe_filename,
        *process_args,
        client_ip,
    )

    display_name = FEATURE_DISPLAY_NAMES[feature]

    return {
        "message": f"{display_name} started",
        "job_id": job_id,
    }
