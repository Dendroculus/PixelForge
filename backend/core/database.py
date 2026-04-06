import asyncio
import logging
import asyncpg
from core.config import DATABASE_URL, DatabaseConfig as DC

logger = logging.getLogger(__name__)

_pool: asyncpg.pool.Pool | None = None


async def init_db_pool() -> None:
    """
    Purpose: Initializes async PostgreSQL connection pool with retry logic
    Why: Ensures database availability and creates required tables/indexes on startup
    """
    global _pool
    if _pool is not None:
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

                await conn.execute(
                    """
                    CREATE TABLE IF NOT EXISTS upscale_jobs (
                        job_id VARCHAR(32) PRIMARY KEY,
                        ip_address VARCHAR(255) NOT NULL,
                        safe_filename TEXT NOT NULL,
                        scale INTEGER NOT NULL,
                        model_type VARCHAR(64) NOT NULL,
                        status VARCHAR(16) NOT NULL,
                        result_filename TEXT,
                        error_message TEXT,
                        usage_charged BOOLEAN NOT NULL DEFAULT FALSE,
                        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                    );
                    """
                )

                await conn.execute(
                    """
                    CREATE INDEX IF NOT EXISTS idx_upscale_jobs_status_created_at
                    ON upscale_jobs (status, created_at);
                    """
                )

            logger.info("Database ready. pool[min=%s, max=%s]", DC.POOL_MIN_SIZE, DC.POOL_MAX_SIZE)
            return

        except Exception as e:
            logger.warning("DB init attempt %s/%s failed: %s", attempt, DC.INIT_MAX_RETRIES, e)

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
    Purpose: Closes database connection pool
    Why: Ensures graceful shutdown and resource cleanup
    """
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


def get_db_pool() -> asyncpg.pool.Pool | None:
    """
    Purpose: Returns current database pool instance
    Why: Provides shared access to pool across application
    Output:
        asyncpg.pool.Pool | None
    """
    return _pool


async def run_database_cleanup() -> int:
    """
    Purpose: Deletes expired usage records and stale job entries
    Why: Prevents database bloat and maintains performance
    Output:
        int: total number of deleted records
    """
    global _pool
    if _pool is None:
        return 0

    usage_cleanup_sql = f"""
    DELETE FROM ip_usage_hourly
    WHERE bucket_start < NOW() - INTERVAL '{DC.USAGE_RETENTION_HOURS} hours';
    """

    jobs_cleanup_sql = """
    DELETE FROM upscale_jobs
    WHERE created_at < NOW() - INTERVAL '24 hours';
    """

    try:
        async with _pool.acquire() as conn:
            result1 = await conn.execute(usage_cleanup_sql)
            deleted1 = int(result1.split()[-1])

            result2 = await conn.execute(jobs_cleanup_sql)
            deleted2 = int(result2.split()[-1])

        total = deleted1 + deleted2
        logger.info("DB cleanup complete: usage=%s, jobs=%s", deleted1, deleted2)
        return total

    except Exception as e:
        logger.exception("Database cleanup failed: %s", e)
        return 0