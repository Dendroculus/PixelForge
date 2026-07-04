import asyncio
import contextlib

from contextlib import asynccontextmanager
from fastapi import FastAPI

from database.db_pool import init_db_pool, close_db_pool
from services.maintenance.janitor_service import database_janitor_loop


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup and shutdown lifecycle manager.
    """
    await init_db_pool()

    janitor_task = asyncio.create_task(
        database_janitor_loop()
    )

    yield

    janitor_task.cancel()

    with contextlib.suppress(asyncio.CancelledError):
        await janitor_task

    await close_db_pool()