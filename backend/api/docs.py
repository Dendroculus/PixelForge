"""OpenAPI documentation helpers for PixelForge API routes."""

from fastapi import status

COMMON_ERROR_RESPONSES = {
    status.HTTP_400_BAD_REQUEST: {
        "description": "Invalid request or validation error.",
    },
    status.HTTP_429_TOO_MANY_REQUESTS: {
        "description": "Rate limit or usage limit reached.",
    },
    status.HTTP_500_INTERNAL_SERVER_ERROR: {
        "description": "Unexpected backend error.",
    },
}

AI_START_RESPONSES = {
    status.HTTP_202_ACCEPTED: {
        "description": "Job accepted and queued for background processing.",
    },
    status.HTTP_400_BAD_REQUEST: {
        "description": "Invalid job metadata or request payload.",
    },
    status.HTTP_429_TOO_MANY_REQUESTS: {
        "description": "Rate limit, usage limit, or queue limit reached.",
    },
    status.HTTP_500_INTERNAL_SERVER_ERROR: {
        "description": "Unexpected backend error while starting the job.",
    },
}

AI_RESULT_RESPONSES = {
    status.HTTP_200_OK: {
        "description": "Current job status: processing, ready, or failed.",
    },
    status.HTTP_400_BAD_REQUEST: {
        "description": "Invalid job ID format.",
    },
    status.HTTP_429_TOO_MANY_REQUESTS: {
        "description": "Polling rate limit reached.",
    },
}