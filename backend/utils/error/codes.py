"""Stable public error codes for PixelForge.

This module contains string constants used by API exception handlers, AI
pipeline failure markers, and frontend-safe error payloads.

Keep these codes stable. Frontend code and logs may depend on them. Error
messages can change over time, but codes should only be renamed with a migration
plan.
"""

# Generic request / API errors
VALIDATION_ERROR = "VALIDATION_ERROR"
RATE_LIMITED = "RATE_LIMITED"
AUTH_FAILED = "AUTH_FAILED"
NOT_FOUND = "NOT_FOUND"
INTERNAL_ERROR = "INTERNAL_ERROR"
CONFIG_ERROR = "CONFIG_ERROR"

# File and image validation errors
INVALID_IMAGE = "INVALID_IMAGE"
UNSUPPORTED_FORMAT = "UNSUPPORTED_FORMAT"
UPLOAD_TOO_LARGE = "UPLOAD_TOO_LARGE"
IMAGE_TOO_LARGE = "IMAGE_TOO_LARGE"
OUTPUT_TOO_LARGE = "OUTPUT_TOO_LARGE"
INVALID_COLOR_INPUT = "INVALID_COLOR_INPUT"

# AI provider / processing errors
PROVIDER_RATE_LIMITED = "PROVIDER_RATE_LIMITED"
PROVIDER_TIMEOUT = "PROVIDER_TIMEOUT"
PROVIDER_FAILED = "PROVIDER_FAILED"
PROCESSING_FAILED = "PROCESSING_FAILED"
