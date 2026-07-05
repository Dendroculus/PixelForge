"""Request schema for public feedback submissions.

This module defines the validated payload accepted by the feedback endpoint.
The route layer verifies Turnstile and dispatches the message to the
notification service after this schema validates the submitted form data.
"""

from pydantic import BaseModel, EmailStr, Field


class FeedbackRequest(BaseModel):
    """Validated feedback form payload.

    Attributes:
        name:
            Display name of the user submitting feedback.
        email:
            Email address used for follow-up or Discord ticket context.
        message:
            User feedback content.
        cf_turnstile_response:
            Cloudflare Turnstile response token submitted by the frontend.
    """

    name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        strip_whitespace=True,
        description="Name of the user submitting feedback.",
    )
    email: EmailStr = Field(
        ...,
        max_length=254,
        description="Email address of the user submitting feedback.",
    )
    message: str = Field(
        ...,
        min_length=10,
        max_length=1000,
        strip_whitespace=True,
        description="Feedback message content.",
    )
    cf_turnstile_response: str = Field(
        ...,
        description="Cloudflare Turnstile response token.",
    )
