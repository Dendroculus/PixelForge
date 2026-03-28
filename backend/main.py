import os
import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from api.routes import router as api_router 
from core.config import ALLOWED_ORIGINS
from core.rate_limiter import limiter

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