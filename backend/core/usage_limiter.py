import logging
from core.database import get_db_pool

logger = logging.getLogger(__name__)


async def enforce_daily_limit(ip_address: str, limit_24h: int = 3) -> bool:
    """Atomically check and record usage; returns True if allowed."""
    pool = get_db_pool()
    if pool is None:
        logger.error("DB pool not initialized. Failing open.")
        return True

    if limit_24h <= 0:
        logger.warning("Invalid limit_24h=%s; blocking request.", limit_24h)
        return False

    lock_sql = "SELECT pg_advisory_xact_lock(hashtext($1));"

    check_insert_sql = """
    WITH usage AS (
        SELECT COUNT(*)::int AS cnt
        FROM upscale_logs
        WHERE ip_address = $1
          AND created_at > NOW() - INTERVAL '24 hours'
    ),
    inserted AS (
        INSERT INTO upscale_logs (ip_address)
        SELECT $1
        FROM usage
        WHERE usage.cnt < $2
        RETURNING 1
    )
    SELECT EXISTS(SELECT 1 FROM inserted);
    """

    try:
        async with pool.acquire() as conn:
            async with conn.transaction():
                await conn.execute(lock_sql, ip_address)
                allowed = await conn.fetchval(check_insert_sql, ip_address, limit_24h)

        if not allowed:
            logger.warning("Rate limit block: ip=%s limit=%s", ip_address, limit_24h)

        return bool(allowed)

    except Exception:
        logger.exception("Database error during rate-limit check for ip=%s", ip_address)
        return True