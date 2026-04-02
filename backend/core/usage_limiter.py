import logging
from core.database import get_db_pool

logger = logging.getLogger(__name__)

async def enforce_daily_limit(ip_address: str, limit_24h: int = 3) -> bool:
    """
    Atomically checks and logs IP usage to prevent race conditions.
    Returns True if allowed, False if the limit is reached.
    """
    pool = get_db_pool()
    if pool is None:
        logger.error("DB pool not initialized. Failing open.")
        return True # Fail open so legit users aren't blocked by server errors

    sql = """
    WITH inserted AS (
        INSERT INTO upscale_logs (ip_address)
        SELECT $1
        WHERE (
            SELECT COUNT(*)
            FROM upscale_logs
            WHERE ip_address = $1
              AND created_at > NOW() - INTERVAL '24 hours'
        ) < $2
        RETURNING 1
    )
    SELECT EXISTS(SELECT 1 FROM inserted);
    """

    try:
        async with pool.acquire() as conn:
            allowed = await conn.fetchval(sql, ip_address, limit_24h)

        if not allowed:
            logger.warning(f"🛡️ Rate Limit Block: IP {ip_address} hit the 24h limit.")
        return bool(allowed)

    except Exception as e:
        logger.exception(f"Database error during rate-limit check: {e}")
        return True