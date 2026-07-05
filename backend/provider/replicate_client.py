"""Replicate client helpers.

This module wraps ``replicate.async_run`` with timeout handling and retry logic
for transient rate-limit/throttling errors. It converts provider-specific
failures into application-specific exceptions so higher layers can respond with
cleaner error handling.
"""

import asyncio
import logging

import replicate

from utils.error.error import (
    ReplicateRateLimitError,
    ReplicateTimeoutError,
    ReplicateUnknownError,
)

logger = logging.getLogger(__name__)


async def smart_replicate_run(model_id: str, params: dict, max_retries: int = 4):
    """Run a Replicate model with timeout and rate-limit retry handling.

    Args:
        model_id:
            Fully qualified Replicate model identifier.
        params:
            Input payload passed to Replicate.
        max_retries:
            Maximum number of attempts for rate-limit or throttling failures.

    Raises:
        ReplicateTimeoutError:
            Raised when the provider call exceeds the configured timeout.
        ReplicateRateLimitError:
            Raised when rate-limit errors persist after all retries.
        ReplicateUnknownError:
            Raised for unexpected provider failures.

    Returns:
        Any:
            Raw Replicate output.
    """
    for attempt in range(max_retries):
        try:
            output = await asyncio.wait_for(
                replicate.async_run(model_id, input=params),
                timeout=300,
            )
            return output

        except asyncio.TimeoutError as e:
            logger.error("Replicate request timed out.")
            raise ReplicateTimeoutError("Request took too long. Try again.") from e

        except Exception as e:
            error_msg = str(e).lower()

            if "429" in error_msg or "throttle" in error_msg:
                if attempt == max_retries - 1:
                    logger.error("Rate limit exceeded after retries.")
                    raise ReplicateRateLimitError(
                        "Service is busy. Please try again later."
                    ) from e

                wait_time = 2 ** attempt
                logger.warning("Retrying in %ss (attempt %s).", wait_time, attempt + 1)
                await asyncio.sleep(wait_time)
            else:
                logger.exception("Unexpected replicate error.")
                raise ReplicateUnknownError(
                    "Unexpected error from upstream service."
                ) from e

    raise ReplicateUnknownError("Unexpected failure in replicate run.")
