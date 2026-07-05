"""Central API router registration for the PixelForge backend.

This module composes all feature-specific routers into one top-level
``APIRouter`` instance. The application factory includes this router once,
allowing route ownership to stay separated by domain while keeping FastAPI
startup configuration simple and predictable.

Route groups:
    - Operational routes: health/status checks.
    - Shared AI job routes: initialization, polling, and usage status.
    - AI tool routes: upscaling, background removal, color restoration,
      and object removal.
    - Public routes: feedback submission.
"""

from fastapi import APIRouter

from api.routes.ai_tools import color_restore, object_remove, rembg, upscale
from api.routes.jobs import ai_jobs
from api.routes.ops import health
from api.routes.public import feedback

router = APIRouter()

# Operational routes.
router.include_router(health.router)

# Shared AI job workflow routes.
router.include_router(ai_jobs.router)

# AI tool start routes.
router.include_router(upscale.router)
router.include_router(rembg.router)
router.include_router(color_restore.router)
router.include_router(object_remove.router)

# Public non-AI routes.
router.include_router(feedback.router)
