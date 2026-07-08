"""Custom exception classes used by PixelForge.

This module defines application-level exceptions and provider-specific
exceptions. Exceptions that may be converted into API responses expose stable
``code``, ``message``, and ``status_code`` attributes so global handlers can
return safe JSON without leaking implementation details.

Provider wrappers should raise these named exceptions instead of raw SDK errors.
Higher layers can then map failures consistently without depending on provider
message strings.
"""

from fastapi import status

from utils.error import codes


class AppError(Exception):
    """Base class for application exceptions.

    Args:
        message:
            Safe user-facing message. If omitted, handlers may use the default
            message for ``code``.
        code:
            Stable public error code.
        status_code:
            HTTP status code used when the exception happens during a request.
    """

    default_code = codes.INTERNAL_ERROR
    default_status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_message = "Something went wrong. Please try again later."

    def __init__(
        self,
        message: str | None = None,
        *,
        code: str | None = None,
        status_code: int | None = None,
    ):
        """Initialize an application error."""
        self.code = code or self.default_code
        self.message = message or self.default_message
        self.status_code = status_code or self.default_status_code
        super().__init__(self.message)


class PublicAppError(AppError):
    """Application error whose message is safe to return to clients."""


class MissingEnvironmentVariableError(AppError):
    """Raised when a required environment variable is missing."""

    default_code = codes.CONFIG_ERROR
    default_status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_message = "Server configuration error."


class ReplicateError(PublicAppError):
    """Base class for Replicate provider failures."""

    default_code = codes.PROVIDER_FAILED
    default_status_code = status.HTTP_502_BAD_GATEWAY
    default_message = (
        "The AI provider could not process the image. Please try again later."
    )


class ReplicateRateLimitError(ReplicateError):
    """Raised when the Replicate API rate limit is exceeded."""

    default_code = codes.PROVIDER_RATE_LIMITED
    default_status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_message = "The AI provider is busy right now. Please try again later."


class ReplicateTimeoutError(ReplicateError):
    """Raised when a Replicate request times out."""

    default_code = codes.PROVIDER_TIMEOUT
    default_status_code = status.HTTP_504_GATEWAY_TIMEOUT
    default_message = "The AI provider took too long to respond. Please try again."


class ReplicateUnknownError(ReplicateError):
    """Raised for unexpected Replicate provider failures."""

    default_code = codes.PROVIDER_FAILED
    default_status_code = status.HTTP_502_BAD_GATEWAY
    default_message = (
        "The AI provider could not process the image. Please try again later."
    )
