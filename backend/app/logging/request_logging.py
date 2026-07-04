import logging
import time

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from limiter.rate_limiter import get_real_client_ip


logger = logging.getLogger("app.request")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log incoming requests and their response times.
    """  
    async def dispatch(
        self,
        request: Request,
        call_next,
    ) -> Response:
        start_time = time.perf_counter()

        response = await call_next(request)

        duration_ms = (time.perf_counter() - start_time) * 1000
        client_ip = get_real_client_ip(request)

        logger.info(
            "%s %s %s %s %.2fms",
            client_ip,
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
        )

        return response