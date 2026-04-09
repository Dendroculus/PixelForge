import asyncio
import aiohttp
import io
import logging
import replicate
import urllib.parse
from services.storage import StorageService
from core.config import MAX_FILE_SIZE_BYTES
from helper.utils import get_result_filename
from core.model_registry import ModelRegistry

logger = logging.getLogger(__name__)

class BackgroundRemover:
    """
    Service for removing backgrounds using Replicate's hosted API.
    """
    def __init__(self, max_concurrent_jobs: int = 5):
        self._semaphore = asyncio.Semaphore(max_concurrent_jobs)
        self.MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_BYTES

    async def run_removal(self, safe_filename: str, job_id: str) -> bool:
        try:
            async with self._semaphore:
                raw_bytes = await StorageService.get_upload_bytes(safe_filename)

                if len(raw_bytes) > self.MAX_FILE_SIZE_BYTES:
                    raise ValueError("Payload exceeds maximum size.")

                image_stream = io.BytesIO(raw_bytes)
                output_url = await self._process_with_replicate(image_stream)

                result_bytes = await self._download_result(output_url)

                result_filename = get_result_filename(job_id)
                await StorageService.save_result(result_bytes, result_filename)

                return True

        except Exception as e:
            logger.error(f"❌ Replicate RemBG Error (Job #{job_id}): {e}")
            return False

    async def _process_with_replicate(self, image_stream: io.BytesIO) -> str:
        # Dynamically fetch the model ID from the registry
        model_id = ModelRegistry.get_replicate_id("rembg")
        
        def call_replicate():
            try:
                return replicate.run(model_id, input={"image": image_stream})
            finally:
                image_stream.close()

        output = await asyncio.wait_for(asyncio.to_thread(call_replicate), timeout=300)
        return str(output)

    async def _download_result(self, url: str) -> bytes:
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme != "https" or "replicate.delivery" not in parsed.netloc:
            raise ValueError("Untrusted output source.")

        async with aiohttp.ClientSession() as session:
            async with session.get(url) as resp:
                if resp.status != 200:
                    raise ValueError(f"Failed to download result: {resp.status}")
                return await resp.read()

bg_remover = BackgroundRemover()