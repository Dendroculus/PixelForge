import logging
from typing import Optional

from core.database import get_db_pool

logger = logging.getLogger(__name__)

ALLOWED_STATUSES = {"queued", "processing", "ready", "failed"}


async def create_job(job_id: str, ip_address: str, safe_filename: str, scale: int, model_type: str) -> None:
    pool = get_db_pool()
    if pool is None:
        raise RuntimeError("DB pool unavailable")

    sql = """
    INSERT INTO upscale_jobs (
        job_id, ip_address, safe_filename, scale, model_type, status, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, 'queued', NOW(), NOW())
    """
    async with pool.acquire() as conn:
        await conn.execute(sql, job_id, ip_address, safe_filename, scale, model_type)


async def get_job(job_id: str) -> Optional[dict]:
    pool = get_db_pool()
    if pool is None:
        return None

    sql = """
    SELECT job_id, ip_address, safe_filename, scale, model_type, status, result_filename,
           error_message, usage_charged, created_at, updated_at
    FROM upscale_jobs
    WHERE job_id = $1
    """
    async with pool.acquire() as conn:
        row = await conn.fetchrow(sql, job_id)

    return dict(row) if row else None


async def update_job_status(
    job_id: str,
    status: str,
    *,
    result_filename: str | None = None,
    error_message: str | None = None,
) -> None:
    if status not in ALLOWED_STATUSES:
        raise ValueError(f"Invalid status: {status}")

    pool = get_db_pool()
    if pool is None:
        raise RuntimeError("DB pool unavailable")

    sql = """
    UPDATE upscale_jobs
    SET status = $2,
        result_filename = COALESCE($3, result_filename),
        error_message = COALESCE($4, error_message),
        updated_at = NOW()
    WHERE job_id = $1
    """
    async with pool.acquire() as conn:
        await conn.execute(sql, job_id, status, result_filename, error_message)


async def mark_usage_charged(job_id: str) -> None:
    pool = get_db_pool()
    if pool is None:
        raise RuntimeError("DB pool unavailable")

    sql = """
    UPDATE upscale_jobs
    SET usage_charged = TRUE, updated_at = NOW()
    WHERE job_id = $1
    """
    async with pool.acquire() as conn:
        await conn.execute(sql, job_id)


async def mark_job_failed_if_stale(job_id: str, max_age_seconds: int) -> bool:
    """
    Returns True if job was stale and changed to failed.
    """
    pool = get_db_pool()
    if pool is None:
        return False

    sql = """
    UPDATE upscale_jobs
    SET status = 'failed',
        error_message = COALESCE(error_message, 'AI processing timed out.'),
        updated_at = NOW()
    WHERE job_id = $1
      AND status IN ('queued', 'processing')
      AND created_at < NOW() - ($2 * INTERVAL '1 second')
    """

    async with pool.acquire() as conn:
        result = await conn.execute(sql, job_id, int(max_age_seconds))

    return int(result.split()[-1]) > 0