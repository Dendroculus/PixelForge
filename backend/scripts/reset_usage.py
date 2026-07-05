"""Development script for resetting usage counters.

This script truncates the ``ip_usage_hourly`` table so local developers can
reset feature quota state while testing. It is intentionally guarded by an
environment check and should never be used in production or staging.

Run from the backend directory with a development environment configured.
"""

import asyncio
import logging
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.config import settings
from database.db_pool import close_db_pool, get_db_pool, init_db_pool

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

TABLE_TO_TRUNCATE = "ip_usage_hourly"


async def reset_usage_limits() -> None:
    """Truncate the usage table in a development environment.

    Raises:
        SystemExit:
            Exits with code 1 when the environment is not allowed, the database
            pool cannot be acquired, or truncation fails.
    """
    if settings.ENVIRONMENT.lower() != "dev":
        logger.error(
            "Security Halt: Destructive scripts are only permitted in the 'dev' environment."
        )
        sys.exit(1)

    try:
        await init_db_pool()
        pool = get_db_pool()

        if pool is None:
            logger.error("Failed to acquire database connection pool.")
            sys.exit(1)

        async with pool.acquire() as conn:
            await conn.execute(
                f"TRUNCATE TABLE {TABLE_TO_TRUNCATE} RESTART IDENTITY CASCADE;"
            )

        logger.info("Developer usage limits successfully reset.")

    except Exception as e:
        logger.error("Database truncation failed: %s", e)
        sys.exit(1)

    finally:
        await close_db_pool()


if __name__ == "__main__":
    asyncio.run(reset_usage_limits())
