"""Safe API error response helpers.

The functions in this module convert internal exceptions into stable,
frontend-safe JSON payloads. They intentionally avoid exposing stack traces,
provider internals, secrets, environment values, or raw exception text from
unexpected server failures.
"""

from __future__ import annotations

from typing import Any

from fastapi import status
from fastapi.responses import JSONResponse

from utils.error import codes


DEFAULT_ERROR_MESSAGES: dict[str, str] = {
    codes.VALIDATION_ERROR: "Request validation failed.",
    codes.RATE_LIMITED: "Too many requests. Please wait a moment and try again.",
    codes.AUTH_FAILED: "Authentication failed.",
    codes.NOT_FOUND: "The requested resource was not found.",
    codes.INTERNAL_ERROR: "Something went wrong. Please try again later.",
    codes.CONFIG_ERROR: "Server configuration error.",
    codes.INVALID_IMAGE: "Invalid image data.",
    codes.UNSUPPORTED_FORMAT: "Unsupported image format.",
    codes.UPLOAD_TOO_LARGE: "The uploaded image is too large.",
    codes.IMAGE_TOO_LARGE: "The uploaded image resolution is too large.",
    codes.OUTPUT_TOO_LARGE: (
        "The generated image was too large to save safely. "
        "Try a smaller image or use a lower upscale setting."
    ),
    codes.INVALID_COLOR_INPUT: (
        "This image already has color. Please upload a black-and-white image "
        "for color restoration."
    ),
    codes.PROVIDER_RATE_LIMITED: (
        "The AI provider is busy right now. Please try again later."
    ),
    codes.PROVIDER_TIMEOUT: (
        "The AI provider took too long to respond. Please try again."
    ),
    codes.PROVIDER_FAILED: (
        "The AI provider could not process the image. Please try again later."
    ),
    codes.PROCESSING_FAILED: (
        "AI processing failed. Please try again with a smaller image."
    ),
}


def get_default_message(code: str) -> str:
    """Return the default safe message for an error code.

    Args:
        code:
            Stable public error code.

    Returns:
        str:
            Safe user-facing message for the code.
    """
    return DEFAULT_ERROR_MESSAGES.get(code, DEFAULT_ERROR_MESSAGES[codes.INTERNAL_ERROR])


def build_error_payload(
    code: str,
    message: str | None = None,
    *,
    details: Any | None = None,
) -> dict[str, Any]:
    """Build a stable JSON error payload.

    Args:
        code:
            Stable public error code.
        message:
            Optional safe user-facing message. When omitted, the default message
            for ``code`` is used.
        details:
            Optional safe structured details. Only pass data that is intended
            for client display/debugging.

    Returns:
        dict[str, Any]:
            JSON-serializable error payload.
    """
    payload: dict[str, Any] = {
        "code": code,
        "message": message or get_default_message(code),
    }

    if details is not None:
        payload["details"] = details

    return payload


def error_response(
    *,
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
    code: str = codes.INTERNAL_ERROR,
    message: str | None = None,
    details: Any | None = None,
    headers: dict[str, str] | None = None,
) -> JSONResponse:
    """Create a FastAPI JSON response for an error.

    Args:
        status_code:
            HTTP status code.
        code:
            Stable public error code.
        message:
            Optional safe user-facing message.
        details:
            Optional safe structured details.
        headers:
            Optional HTTP headers to preserve from the original exception.

    Returns:
        JSONResponse:
            Error response using PixelForge's standard error shape.
    """
    return JSONResponse(
        status_code=status_code,
        content=build_error_payload(code, message, details=details),
        headers=headers,
    )
