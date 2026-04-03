import asyncio
import logging
import asyncpg
from core.config import DATABASE_URL

logger = logging.getLogger(__name__)

_pool: asyncpg.pool.Pool | None = None

POOL_MIN_SIZE = 5
POOL_MAX_SIZE = 30
POOL_MAX_QUERIES = 50_000
POOL_MAX_INACTIVE_CONN_LIFETIME = 300.0
POOL_COMMAND_TIMEOUT = 10

INIT_MAX_RETRIES = 8
INIT_BASE_DELAY_SECONDS = 0.5

RETENTION_HOURS = 24
CLEANUP_BATCH_SIZE = 10_000
CLEANUP_PAUSE_BETWEEN_BATCHES_SECONDS = 0.05


async def init_db_pool() -> None:
    """Initialize connection pool with retry and ensure schema exists."""
    global _pool
    if _pool is not None:
        logger.info("DB pool already initialized.")
        return

    for attempt in range(1, INIT_MAX_RETRIES + 1):
        try:
            _pool = await asyncpg.create_pool(
                dsn=DATABASE_URL,
                min_size=POOL_MIN_SIZE,
                max_size=POOL_MAX_SIZE,
                max_queries=POOL_MAX_QUERIES,
                max_inactive_connection_lifetime=POOL_MAX_INACTIVE_CONN_LIFETIME,
                command_timeout=POOL_COMMAND_TIMEOUT,
            )

            async with _pool.acquire() as conn:
                await conn.execute("""
                    CREATE TABLE IF NOT EXISTS upscale_logs (
                        id BIGSERIAL PRIMARY KEY,
                        ip_address VARCHAR(255) NOT NULL,
                        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
                    );
                """)

                await conn.execute("""
                    CREATE INDEX IF NOT EXISTS idx_ip_created
                    ON upscale_logs(ip_address, created_at);
                """)

                await conn.execute("""
                    CREATE INDEX IF NOT EXISTS idx_created_at
                    ON upscale_logs(created_at);
                """)

            logger.info(
                "Database ready. pool[min=%s, max=%s]",
                POOL_MIN_SIZE,
                POOL_MAX_SIZE,
            )
            return

        except Exception as e:
            logger.warning(
                "DB init attempt %s/%s failed: %s",
                attempt,
                INIT_MAX_RETRIES,
                e,
            )

            if _pool is not None:
                try:
                    await _pool.close()
                except Exception:
                    pass
                _pool = None

            if attempt == INIT_MAX_RETRIES:
                logger.exception("Failed to initialize database.")
                raise

            backoff = INIT_BASE_DELAY_SECONDS * (2 ** (attempt - 1))
            await asyncio.sleep(backoff)


async def close_db_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
        logger.info("Database pool closed.")


def get_db_pool() -> asyncpg.pool.Pool | None:
    return _pool


async def run_database_cleanup() -> int:
    """Delete expired rows in batches to reduce load."""
    global _pool
    if _pool is None:
        logger.warning("DB pool not ready for cleanup.")
        return 0

    total_deleted = 0

    sql = f"""
    WITH to_delete AS (
        SELECT id
        FROM upscale_logs
        WHERE created_at < NOW() - INTERVAL '{RETENTION_HOURS} hours'
        ORDER BY id
        LIMIT {CLEANUP_BATCH_SIZE}
    )
    DELETE FROM upscale_logs u
    USING to_delete d
    WHERE u.id = d.id;
    """

    try:
        async with _pool.acquire() as conn:
            while True:
                result = await conn.execute(sql)
                deleted = int(result.split()[-1])
                total_deleted += deleted

                if deleted == 0:
                    break

                await asyncio.sleep(CLEANUP_PAUSE_BETWEEN_BATCHES_SECONDS)

        logger.info(
            "Cleanup complete: %s rows removed.",
            total_deleted,
        )
        return total_deleted

    except Exception as e:
        logger.exception("Database cleanup failed: %s", e)
        return total_deleted