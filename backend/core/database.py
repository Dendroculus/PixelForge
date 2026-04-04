import asyncio
import logging
import asyncpg
from core.config import DATABASE_URL, DatabaseConfig as DC

logger = logging.getLogger(__name__)

_pool: asyncpg.pool.Pool | None = None


async def init_db_pool() -> None:
    """
    Initialize the asyncpg connection pool with retry logic and ensure required schema exists.

    :raises Exception: If pool initialization fails after maximum retries
    """
    global _pool
    if _pool is not None:
        logger.info("DB pool already initialized.")
        return

    for attempt in range(1, DC.INIT_MAX_RETRIES + 1):
        try:
            _pool = await asyncpg.create_pool(
                dsn=DATABASE_URL,
                min_size=DC.POOL_MIN_SIZE,
                max_size=DC.POOL_MAX_SIZE,
                max_queries=DC.POOL_MAX_QUERIES,
                max_inactive_connection_lifetime=DC.POOL_MAX_INACTIVE_CONN_LIFETIME,
                command_timeout=DC.POOL_COMMAND_TIMEOUT,
            )

            async with _pool.acquire() as conn:
                await conn.execute(
                    """
                    CREATE TABLE IF NOT EXISTS ip_usage_hourly (
                        ip_address VARCHAR(255) NOT NULL,
                        bucket_start TIMESTAMPTZ NOT NULL,
                        usage_count INTEGER NOT NULL DEFAULT 0,
                        PRIMARY KEY (ip_address, bucket_start)
                    );
                    """
                )

                await conn.execute(
                    """
                    CREATE INDEX IF NOT EXISTS idx_ip_usage_hourly_bucket
                    ON ip_usage_hourly (bucket_start);
                    """
                )

            logger.info(
                "Database ready. pool[min=%s, max=%s]",
                DC.POOL_MIN_SIZE,
                DC.POOL_MAX_SIZE,
            )
            return

        except Exception as e:
            logger.warning(
                "DB init attempt %s/%s failed: %s",
                attempt,
                DC.INIT_MAX_RETRIES,
                e,
            )

            if _pool is not None:
                try:
                    await _pool.close()
                except Exception:
                    pass
                _pool = None

            if attempt == DC.INIT_MAX_RETRIES:
                logger.exception("Failed to initialize database.")
                raise

            await asyncio.sleep(DC.INIT_BASE_DELAY_SECONDS * (2 ** (attempt - 1)))


async def close_db_pool() -> None:
    """
    Close the active asyncpg pool and reset state.
    """
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
        logger.info("Database pool closed.")


def get_db_pool() -> asyncpg.pool.Pool | None:
    """
    Retrieve the current asyncpg connection pool.

    :return: Active pool instance or None if not initialized
    """
    return _pool


async def run_database_cleanup() -> int:
    """
    Remove expired usage records based on retention policy.

    :return: Number of rows deleted
    """
    global _pool
    if _pool is None:
        logger.warning("DB pool not ready for cleanup.")
        return 0

    sql = f"""
    DELETE FROM ip_usage_hourly
    WHERE bucket_start < NOW() - INTERVAL '{DC.USAGE_RETENTION_HOURS} hours';
    """

    try:
        async with _pool.acquire() as conn:
            result = await conn.execute(sql)
            deleted = int(result.split()[-1])

        logger.info("Usage cleanup complete: %s rows removed.", deleted)
        return deleted

    except Exception as e:
        logger.exception("Database cleanup failed: %s", e)
        return 0