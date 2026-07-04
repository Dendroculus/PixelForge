from fastapi import APIRouter

from api.routes.ai_tools import color_restore, object_remove, rembg, upscale
from api.routes.jobs import ai_jobs
from api.routes.ops import health
from api.routes.public import feedback

router = APIRouter()

# Operational routes
router.include_router(health.router)

# Shared AI job workflow routes
router.include_router(ai_jobs.router)

# Real AI tool routes
router.include_router(upscale.router)
router.include_router(rembg.router)
router.include_router(color_restore.router)
router.include_router(object_remove.router)

# Public routes
router.include_router(feedback.router)