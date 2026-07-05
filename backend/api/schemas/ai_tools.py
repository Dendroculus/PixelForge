"""Request schemas for PixelForge AI tool workflows.

These Pydantic models define the request payloads accepted by the shared AI job
initialization endpoint and each feature-specific start endpoint.

The workflow is split into two phases:
    1. Initialization:
       The client requests a job ID and secure Azure upload URL.
    2. Start:
       The client uploads required files, then asks the backend to queue
       background AI processing.

Only request-shape documentation lives here. Business rules such as quota
checks, queue limits, Turnstile verification, and Azure interaction are handled
by the service layer.
"""

from pydantic import BaseModel, Field


class InitRequest(BaseModel):
    """Payload used to initialize an AI processing job.

    Attributes:
        cf_turnstile_response:
            Cloudflare Turnstile response token submitted by the frontend.
        filename:
            Original client-side filename. The backend uses this only to derive
            a safe normalized upload extension.
    """

    cf_turnstile_response: str = Field(
        ...,
        description="Cloudflare Turnstile response token.",
    )
    filename: str = Field(
        ...,
        description="Original filename submitted by the client.",
    )


class StartUpscaleRequest(BaseModel):
    """Payload used to start an initialized image upscaling job.

    Attributes:
        job_id:
            Job identifier returned by the initialization endpoint.
        safe_filename:
            Sanitized upload filename returned by the initialization endpoint.
        scale:
            Requested upscale multiplier. The value is constrained to the
            supported AI model range.
    """

    job_id: str = Field(
        ...,
        description="Initialized job identifier.",
    )
    safe_filename: str = Field(
        ...,
        description="Sanitized uploaded image filename.",
    )
    scale: int = Field(
        default=2,
        ge=1,
        le=4,
        description="Requested upscale multiplier.",
    )


class StartRembgRequest(BaseModel):
    """Payload used to start an initialized background removal job.

    Attributes:
        job_id:
            Job identifier returned by the initialization endpoint.
        safe_filename:
            Sanitized uploaded image filename returned by initialization.
    """

    job_id: str = Field(
        ...,
        description="Initialized job identifier.",
    )
    safe_filename: str = Field(
        ...,
        description="Sanitized uploaded image filename.",
    )


class StartColorRestoreRequest(BaseModel):
    """Payload used to start an initialized color restoration job.

    Attributes:
        job_id:
            Job identifier returned by the initialization endpoint.
        safe_filename:
            Sanitized uploaded image filename returned by initialization.
    """

    job_id: str = Field(
        ...,
        description="Initialized job identifier.",
    )
    safe_filename: str = Field(
        ...,
        description="Sanitized uploaded image filename.",
    )


class StartObjectRemoveRequest(BaseModel):
    """Payload used to start an initialized object removal job.

    Object removal requires two uploaded files:
        - the source image
        - a mask image that marks the object area to remove

    Attributes:
        job_id:
            Job identifier returned by the initialization endpoint.
        safe_filename:
            Sanitized uploaded source image filename.
        mask_filename:
            Sanitized uploaded mask image filename.
    """

    job_id: str = Field(
        ...,
        description="Initialized job identifier.",
    )
    safe_filename: str = Field(
        ...,
        description="Sanitized uploaded source image filename.",
    )
    mask_filename: str = Field(
        ...,
        description="Sanitized uploaded mask image filename.",
    )
