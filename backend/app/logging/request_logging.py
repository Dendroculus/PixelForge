"""HTTP request logging middleware.

This module logs one structured line per completed request, including client IP,
HTTP method, request path, response status code, and elapsed duration.

The middleware intentionally logs after ``call_next`` returns so the status code
and execution time reflect the actual response produced by downstream route
handlers.
"""

import logging
import time

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from limiter.rate_limiter import get_real_client_ip


logger = logging.getLogger("app.request")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log completed HTTP requests and response times."""

    async def dispatch(
        self,
        request: Request,
        call_next,
    ) -> Response:
        """Process a request and log its final response metadata.

        Args:
            request:
                Incoming HTTP request.
            call_next:
                Starlette callback that passes the request to the next
                middleware or route handler.

        Returns:
            Response:
                Response produced by the downstream application.
        """
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
