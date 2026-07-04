import asyncio
import logging
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.config import settings
from database.db_pool import init_db_pool, get_db_pool, close_db_pool

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
TABLE_TO_TRUNCATE = "ip_usage_hourly"

async def reset_usage_limits() -> None:
    """
    Connects to the database and executes a TRUNCATE command on the usage table.
    
    Strictly enforces an environment check to prevent accidental execution 
    in production or staging environments.
    
    Raises:
        SystemExit: If executed outside the 'development' environment or 
                    if the database pool fails to initialize.
    """
    if settings.ENVIRONMENT.lower() != "development":
        logger.error("Security Halt: Destructive scripts are only permitted in the 'development' environment.")
        sys.exit(1)

    try:
        await init_db_pool()
        pool = get_db_pool()

        if pool is None:
            logger.error("Failed to acquire database connection pool.")
            sys.exit(1)

        async with pool.acquire() as conn:
            await conn.execute(f"TRUNCATE TABLE {TABLE_TO_TRUNCATE} RESTART IDENTITY CASCADE;")

        logger.info("Developer usage limits successfully reset.")

    except Exception as e:
        logger.error("Database truncation failed: %s", e)
        sys.exit(1)

    finally:
        await close_db_pool()


if __name__ == "__main__":
    asyncio.run(reset_usage_limits())