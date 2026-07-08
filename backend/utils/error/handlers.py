"""Global FastAPI exception handlers.

This module registers request-time exception handlers for PixelForge. It should
be called once from ``app.middleware.configure_middleware``.

Important boundary:
    These handlers cover exceptions raised during normal HTTP request handling.
    Background AI job failures are still handled by ``JobManager`` and persisted
    as Azure failure markers so polling can return a safe failed status later.
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from slowapi.errors import RateLimitExceeded
from starlette.exceptions import HTTPException as StarletteHTTPException

from utils.error import codes
from utils.error.error import (
    AppError,
    MissingEnvironmentVariableError,
    ReplicateRateLimitError,
    ReplicateTimeoutError,
    ReplicateUnknownError,
)
from utils.error.responses import error_response, get_default_message

logger = logging.getLogger(__name__)


def _extract_http_error(exc: HTTPException | StarletteHTTPException) -> tuple[str, str]:
    """Extract a safe code/message pair from an HTTP exception.

    Args:
        exc:
            FastAPI or Starlette HTTP exception.

    Returns:
        tuple[str, str]:
            Stable public error code and safe message.
    """
    detail: Any = getattr(exc, "detail", None)
    status_code = getattr(exc, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)

    if isinstance(detail, dict):
        code = str(detail.get("code") or codes.VALIDATION_ERROR)
        message = str(detail.get("message") or get_default_message(code))
        return code, message

    if detail == "LIMIT_REACHED" or status_code == status.HTTP_429_TOO_MANY_REQUESTS:
        return codes.RATE_LIMITED, get_default_message(codes.RATE_LIMITED)

    if status_code == status.HTTP_404_NOT_FOUND:
        return codes.NOT_FOUND, get_default_message(codes.NOT_FOUND)

    if status.HTTP_400_BAD_REQUEST <= status_code < status.HTTP_500_INTERNAL_SERVER_ERROR:
        message = str(detail) if detail else get_default_message(codes.VALIDATION_ERROR)
        return codes.VALIDATION_ERROR, message

    return codes.INTERNAL_ERROR, get_default_message(codes.INTERNAL_ERROR)


async def app_error_handler(request: Request, exc: AppError):
    """Handle custom application exceptions.

    Args:
        request:
            Current request.
        exc:
            Application exception with code/message/status metadata.

    Returns:
        JSONResponse:
            Safe JSON error response.
    """
    logger.warning(
        "Application error path=%s code=%s status=%s",
        request.url.path,
        exc.code,
        exc.status_code,
    )

    return error_response(
        status_code=exc.status_code,
        code=exc.code,
        message=exc.message,
    )


async def missing_environment_handler(
    request: Request,
    exc: MissingEnvironmentVariableError,
):
    """Handle missing environment configuration errors safely."""
    logger.error(
        "Missing environment configuration path=%s error=%s",
        request.url.path,
        exc,
    )

    return error_response(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        code=codes.CONFIG_ERROR,
        message=get_default_message(codes.CONFIG_ERROR),
    )


async def provider_rate_limit_handler(
    request: Request,
    exc: ReplicateRateLimitError,
):
    """Handle AI provider rate-limit failures safely."""
    logger.warning("Provider rate limited path=%s", request.url.path)

    return error_response(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        code=codes.PROVIDER_RATE_LIMITED,
        message=exc.message,
    )


async def provider_timeout_handler(request: Request, exc: ReplicateTimeoutError):
    """Handle AI provider timeout failures safely."""
    logger.warning("Provider timeout path=%s", request.url.path)

    return error_response(
        status_code=status.HTTP_504_GATEWAY_TIMEOUT,
        code=codes.PROVIDER_TIMEOUT,
        message=exc.message,
    )


async def provider_unknown_handler(request: Request, exc: ReplicateUnknownError):
    """Handle unknown AI provider failures safely."""
    logger.error("Provider failure path=%s error=%s", request.url.path, exc)

    return error_response(
        status_code=status.HTTP_502_BAD_GATEWAY,
        code=codes.PROVIDER_FAILED,
        message=exc.message,
    )


async def request_validation_handler(request: Request, exc: RequestValidationError):
    """Handle FastAPI/Pydantic request validation errors.

    Validation details can include field names and invalid input shapes. Return a
    concise safe message by default to keep public responses stable.
    """
    logger.info("Request validation failed path=%s errors=%s", request.url.path, exc.errors())

    return error_response(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        code=codes.VALIDATION_ERROR,
        message=get_default_message(codes.VALIDATION_ERROR),
    )


async def http_exception_handler(
    request: Request,
    exc: HTTPException | StarletteHTTPException,
):
    """Handle HTTP exceptions with a consistent JSON shape."""
    code, message = _extract_http_error(exc)

    if getattr(exc, "status_code", 500) >= 500:
        logger.error("HTTP error path=%s status=%s", request.url.path, exc.status_code)
    else:
        logger.info("HTTP error path=%s status=%s", request.url.path, exc.status_code)

    return error_response(
        status_code=exc.status_code,
        code=code,
        message=message,
        headers=getattr(exc, "headers", None),
    )


async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """Handle SlowAPI rate-limit errors with PixelForge's error shape."""
    logger.info("Rate limit exceeded path=%s", request.url.path)

    return error_response(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        code=codes.RATE_LIMITED,
        message=get_default_message(codes.RATE_LIMITED),
    )


async def unhandled_exception_handler(request: Request, exc: Exception):
    """Handle unexpected request-time exceptions safely."""
    logger.exception("Unhandled exception path=%s", request.url.path)

    return error_response(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        code=codes.INTERNAL_ERROR,
        message=get_default_message(codes.INTERNAL_ERROR),
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Register PixelForge global exception handlers.

    Args:
        app:
            FastAPI application instance.
    """
    app.add_exception_handler(RateLimitExceeded, rate_limit_handler)
    app.add_exception_handler(RequestValidationError, request_validation_handler)
    app.add_exception_handler(MissingEnvironmentVariableError, missing_environment_handler)
    app.add_exception_handler(ReplicateRateLimitError, provider_rate_limit_handler)
    app.add_exception_handler(ReplicateTimeoutError, provider_timeout_handler)
    app.add_exception_handler(ReplicateUnknownError, provider_unknown_handler)
    app.add_exception_handler(AppError, app_error_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)
