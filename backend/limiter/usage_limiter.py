import logging
from core.database import get_db_pool
from core.config import LimitConfig as LC

logger = logging.getLogger(__name__)

WINDOW_HOURS = 24
WINDOW_MS = WINDOW_HOURS * 60 * 60 * 1000

def _get_feature_key(ip_address: str, feature: str) -> str:
    """Namespaces the IP to track separate limits without changing DB schema."""
    return f"{ip_address}:{feature}"

async def check_daily_limit(ip_address: str, limit_24h: int = 3, feature: str = "upscale") -> bool:
    """Checks if the user has uses remaining WITHOUT deducting."""
    pool = get_db_pool()
    if pool is None:
        logger.error("DB pool not initialized. Failing open for daily limit check.")
        return True

    if limit_24h <= 0:
        return False

    feature_ip = _get_feature_key(ip_address, feature)
    
    sum_sql = """
    SELECT COALESCE(SUM(usage_count), 0)::int AS used
    FROM ip_usage_hourly
    WHERE ip_address = $1
      AND bucket_start > NOW() - INTERVAL '24 hours';
    """

    try:
        async with pool.acquire() as conn:
            used = await conn.fetchval(sum_sql, feature_ip)
            return used < limit_24h
    except Exception:
        logger.exception("Database error during rate-limit check for ip=%s. Failing open.", feature_ip)
        return True


async def increment_daily_limit(ip_address: str, feature: str = "upscale") -> None:
    """Deducts 1 usage credit by inserting/updating the current hour's bucket."""
    pool = get_db_pool()
    if pool is None:
        return

    feature_ip = _get_feature_key(ip_address, feature)

    upsert_sql = """
    INSERT INTO ip_usage_hourly (ip_address, bucket_start, usage_count)
    VALUES ($1, date_trunc('hour', NOW()), 1)
    ON CONFLICT (ip_address, bucket_start)
    DO UPDATE SET usage_count = ip_usage_hourly.usage_count + 1;
    """

    try:
        async with pool.acquire() as conn:
            await conn.execute(upsert_sql, feature_ip)
    except Exception:
        logger.exception("Database error during usage increment for ip=%s", feature_ip)


async def get_usage_status(ip_address: str, limit_24h: int = LC.DAILY_USAGE_LIMIT, feature: str = "upscale") -> dict:
    """Return remaining uses and reset timestamp (epoch milliseconds)."""
    if limit_24h <= 0:
        return {"uses_remaining": 0, "reset_timestamp": None}

    pool = get_db_pool()
    if pool is None:
        return {"uses_remaining": limit_24h, "reset_timestamp": None}

    feature_ip = _get_feature_key(ip_address, feature)

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
            rec = await conn.fetchrow(sql, feature_ip)

        used = rec["used"] if rec and rec["used"] is not None else 0
        oldest_ms = rec["oldest_bucket_ms"] if rec else None

        uses_remaining = max(0, limit_24h - used)
        reset_timestamp = int(oldest_ms + WINDOW_MS) if used >= limit_24h and oldest_ms is not None else None

        return {"uses_remaining": uses_remaining, "reset_timestamp": reset_timestamp}

    except Exception:
        logger.exception("Failed to get usage status for ip=%s", feature_ip)
        return {"uses_remaining": limit_24h, "reset_timestamp": None}