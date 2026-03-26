import os
import logging
from pathlib import Path

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from api.routes import router as api_router 
from core.config import ALLOWED_ORIGINS, MAX_FILE_SIZE_BYTES
from core.rate_limiter import limiter

class LimitUploadSizeMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_upload_size: int):
        super().__init__(app)
        self.max_upload_size = max_upload_size

    async def dispatch(self, request: Request, call_next):
        if request.method == "POST":
            if "content-length" not in request.headers:
                return JSONResponse(
                    status_code=status.HTTP_411_LENGTH_REQUIRED,
                    content={"detail": "Content-Length header required."}
                )
            
            try:
                content_length = int(request.headers["content-length"])
            except ValueError:
                return JSONResponse(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    content={"detail": "Invalid Content-Length."}
                )

            if content_length > self.max_upload_size:
                return JSONResponse(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    content={"detail": "Payload too large. The bouncer stopped you! 🛑"}
                )
                
        return await call_next(request)

LOG_DIR = Path(os.path.dirname(__file__)) / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(LOG_DIR / "upscaler_backend.log", encoding="utf-8"),  
        logging.StreamHandler()                                         
    ]
)

app = FastAPI(
    root_path="/api",
    title="AI Image Upscaler API",
    description="Production-ready FastAPI backend for Real-ESRGAN",
    version="1.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  
    allow_headers=["*"],  
)

app.add_middleware(LimitUploadSizeMiddleware, max_upload_size=MAX_FILE_SIZE_BYTES)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/", tags=["Health Check"])
async def root():
    return {
        "status": "online",
        "message": "AI Upscaler API is running",
        "docs": "/docs"
    }

app.include_router(api_router)