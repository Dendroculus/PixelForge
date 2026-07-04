import asyncio
import logging
import asyncpg
from core.config import settings

logger = logging.getLogger(__name__)

# Global database connection pool instance
_pool: asyncpg.pool.Pool | None = None


async def init_db_pool() -> None:
    """
    Initializes the PostgreSQL connection pool.

    Workflow:
    - Prevent duplicate pool initialization.
    - Retry connection creation with exponential backoff.
    - Create required database tables/indexes.
    - Store active pool globally.

    Raises:
        Exception:
            Re-raises the final initialization failure after retries.
    """
    global _pool

    if _pool is not None:
        logger.info("DB pool already initialized.")
        return

    for attempt in range(1, settings.INIT_MAX_RETRIES + 1):
        try:
            _pool = await asyncpg.create_pool(
                dsn=settings.DATABASE_URL,
                min_size=settings.POOL_MIN_SIZE,
                max_size=settings.POOL_MAX_SIZE,
                max_queries=settings.POOL_MAX_QUERIES,
                max_inactive_connection_lifetime=settings.POOL_MAX_INACTIVE_CONN_LIFETIME,
                command_timeout=settings.POOL_COMMAND_TIMEOUT,
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
                settings.POOL_MIN_SIZE,
                settings.POOL_MAX_SIZE,
            )

            return

        except Exception as e:
            logger.warning(
                "DB init attempt %s/%s failed: %s",
                attempt,
                settings.INIT_MAX_RETRIES,
                e,
            )

            if _pool is not None:
                try:
                    await _pool.close()
                except Exception:
                    pass

                _pool = None

            if attempt == settings.INIT_MAX_RETRIES:
                logger.exception(
                    "Failed to initialize database."
                )
                raise

            # Exponential backoff between retries
            await asyncio.sleep(
                settings.INIT_BASE_DELAY_SECONDS * (2 ** (attempt - 1))
            )


async def close_db_pool() -> None:
    """
    Closes the active database connection pool.

    Used during application shutdown to release
    database connections cleanly.
    """
    global _pool

    if _pool is not None:
        await _pool.close()
        _pool = None

        logger.info("Database pool closed.")


def get_db_pool() -> asyncpg.pool.Pool | None: 
    """
    Returns the active database connection pool.

    Returns:
    asyncpg.pool.Pool | None:
            Current pool instance or None if not initialized.
    """
    return _pool