from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.logging.request_logging import RequestLoggingMiddleware

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from core.config import settings
from limiter.rate_limiter import limiter


def configure_middleware(app: FastAPI) -> None:
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=[
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "OPTIONS",
        ],
        allow_headers=["*"],
    )

    app.state.limiter = limiter

    app.add_exception_handler(
        RateLimitExceeded,
        _rate_limit_exceeded_handler,
    )