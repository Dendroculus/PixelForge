from fastapi import APIRouter

router = APIRouter(tags=["Health Check"])


@router.get("/")
async def root() -> dict:
    return {
        "status": "online",
        "message": "PixelForge API is running",
        "docs": "/api/docs",
}