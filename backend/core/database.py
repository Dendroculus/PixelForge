import asyncpg
import logging
from typing import Optional
from core.config import DATABASE_URL

logger = logging.getLogger(__name__)

_pool: Optional[asyncpg.Pool] = None

async def init_db_pool(min_size: int = 2, max_size: int = 20) -> None:
    """Initializes the asyncpg connection pool on startup."""
    global _pool
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is missing from .env!")

    _pool = await asyncpg.create_pool(
        dsn=DATABASE_URL,
        min_size=min_size,
        max_size=max_size,
        command_timeout=10,
    )
    logger.info("✅ Database connection pool initialized.")

async def close_db_pool() -> None:
    """Safely closes the connection pool on shutdown."""
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
        logger.info("🛑 Database connection pool closed.")

def get_db_pool() -> Optional[asyncpg.Pool]:
    """Returns the active database pool."""
    return _pool