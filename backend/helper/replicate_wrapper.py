import asyncio
import logging
import replicate

logger = logging.getLogger(__name__)

async def smart_replicate_run(model_id: str, params: dict, max_retries: int = 4):
    """
    Executes a Replicate model run with exponential backoff for rate limits.

    Args:
        model_id (str): The Replicate model identifier.
        params (dict): Input parameters for the model.
        max_retries (int): Maximum number of retry attempts for 429 errors.

    Returns:
        Any: The output from the Replicate model prediction.

    Raises:
        Exception: If the maximum number of retries is exceeded or a non-429 error occurs.
    """
    for attempt in range(max_retries):
        try:
            output = await asyncio.wait_for(
                replicate.async_run(model_id, input=params),
                timeout=300
            )
            return output
            
        except Exception as e:
            error_msg = str(e).lower()
            
            if "429" in error_msg or "throttle" in error_msg:
                if attempt == max_retries - 1:
                    logger.error(f"Replicate rate limit exceeded after {max_retries} attempts.")
                    raise Exception("Upstream service is currently overloaded. Please try again later.") from e
                
                wait_time = 2 ** attempt
                logger.warning(f"Replicate throttled. Retrying in {wait_time}s. Attempt {attempt + 1}/{max_retries}.")
                await asyncio.sleep(wait_time)
            else:
                raise e

    raise Exception("Unexpected failure in replicate run.")