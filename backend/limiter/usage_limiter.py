import logging

from core.database import get_db_pool
from core.config import LimitConfig as LC

logger = logging.getLogger(__name__)

WINDOW_HOURS = 24
WINDOW_MS = WINDOW_HOURS * 60 * 60 * 1000


async def enforce_daily_limit(ip_address: str, limit_24h: int = 3) -> bool:
    """Atomically enforce a rolling 24-hour usage limit per IP."""
    pool = get_db_pool()
    if pool is None:
        logger.error("DB pool not initialized. Denying request.")
        return False

    if limit_24h <= 0:
        return False

    lock_sql = "SELECT pg_advisory_xact_lock(hashtext($1));"

    sum_sql = """
    SELECT COALESCE(SUM(usage_count), 0)::int AS used
    FROM ip_usage_hourly
    WHERE ip_address = $1
      AND bucket_start > NOW() - INTERVAL '24 hours';
    """

    upsert_sql = """
    INSERT INTO ip_usage_hourly (ip_address, bucket_start, usage_count)
    VALUES ($1, date_trunc('hour', NOW()), 1)
    ON CONFLICT (ip_address, bucket_start)
    DO UPDATE SET usage_count = ip_usage_hourly.usage_count + 1;
    """

    try:
        async with pool.acquire() as conn:
            async with conn.transaction():
                await conn.execute(lock_sql, ip_address)
                used = await conn.fetchval(sum_sql, ip_address)

                if used >= limit_24h:
                    return False

                await conn.execute(upsert_sql, ip_address)

        return True

    except Exception:
        logger.exception("Database error during rate-limit check for ip=%s", ip_address)
        return False


async def get_usage_status(ip_address: str, limit_24h: int = LC.DAILY_USAGE_LIMIT) -> dict:
    """Return remaining uses and reset timestamp (epoch milliseconds)."""
    if limit_24h <= 0:
        return {"uses_remaining": 0, "reset_timestamp": None}

    pool = get_db_pool()
    if pool is None:
        return {"uses_remaining": limit_24h, "reset_timestamp": None}

    sql = """
    WITH windowed AS (
        SELECT
            COALESCE(SUM(usage_count), 0)::int AS used,
            MIN(bucket_start) AS oldest_bucket
        FROM ip_usage_hourly
        WHERE ip_address = $1
          AND bucket_start >= NOW() - INTERVAL '24 hours'
    )
    SELECT
        used,
        EXTRACT(EPOCH FROM oldest_bucket) * 1000 AS oldest_bucket_ms
    FROM windowed;
    """

    try:
        async with pool.acquire() as conn:
            rec = await conn.fetchrow(sql, ip_address)

        used = rec["used"] if rec and rec["used"] is not None else 0
        oldest_ms = rec["oldest_bucket_ms"] if rec else None

        uses_remaining = max(0, limit_24h - used)
        reset_timestamp = int(oldest_ms + WINDOW_MS) if used >= limit_24h and oldest_ms is not None else None

        return {"uses_remaining": uses_remaining, "reset_timestamp": reset_timestamp}

    except Exception:
        logger.exception("Failed to get usage status for ip=%s", ip_address)
        return {"uses_remaining": limit_24h, "reset_timestamp": None}