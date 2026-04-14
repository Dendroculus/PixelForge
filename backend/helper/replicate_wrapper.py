import asyncio
import logging
import replicate
from helper.error import (ReplicateRateLimitError, ReplicateTimeoutError, ReplicateUnknownError)
logger = logging.getLogger(__name__)

async def smart_replicate_run(model_id: str, params: dict, max_retries: int = 4):
    """
    Executes a Replicate model run with exponential backoff for rate limits.
    """
    for attempt in range(max_retries):
        try:
            output = await asyncio.wait_for(
                replicate.async_run(model_id, input=params),
                timeout=300
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
                logger.warning(f"Retrying in {wait_time}s (attempt {attempt + 1}).")
                await asyncio.sleep(wait_time)
            else:
                logger.exception("Unexpected replicate error.")
                raise ReplicateUnknownError(
                    "Unexpected error from upstream service."
                ) from e

    raise ReplicateUnknownError("Unexpected failure in replicate run.")