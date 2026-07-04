from typing import Callable, Any

from fastapi import BackgroundTasks, Request

from limiter.rate_limiter import get_real_client_ip
from services.job.job_manager import JobManager
from domain.ai_features import FeatureType, FEATURE_DISPLAY_NAMES


async def reserve_and_queue_job(
    feature: FeatureType,
    request: Request,
    job_id: str,
    safe_filename: str,
    bg_tasks: BackgroundTasks,
    process_func: Callable,
    *process_args: Any,
) -> dict:
    """
    Reserve a queue slot and schedule an AI processing task.
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