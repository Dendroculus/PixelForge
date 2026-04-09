import asyncio
import aiohttp
import io
import logging
import replicate
import urllib.parse
from services.storage import StorageService
from core.config import MAX_FILE_SIZE_BYTES
from helper.utils import get_result_filename

logger = logging.getLogger(__name__)

class BackgroundRemover:
    """
    Service for removing backgrounds using Replicate's hosted API.
    Offloads heavy AI work to save local server memory.
    """

    def __init__(self, max_concurrent_jobs: int = 5):
        self._semaphore = asyncio.Semaphore(max_concurrent_jobs)
        self.MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_BYTES
        # The specific model you found on Replicate
        self._model_id = "851-labs/background-remover:7999335a-959c-4467-9c98-dfd80766289d"

    async def run_removal(self, safe_filename: str, job_id: str) -> bool:
        """
        Executes background removal via Replicate.
        """
        try:
            async with self._semaphore:
                # 1. Get raw bytes from Azure
                raw_bytes = await StorageService.get_upload_bytes(safe_filename)

                if len(raw_bytes) > self.MAX_FILE_SIZE_BYTES:
                    raise ValueError("Payload exceeds maximum size.")

                # 2. Send to Replicate (passing file as a stream)
                image_stream = io.BytesIO(raw_bytes)
                output_url = await self._process_with_replicate(image_stream)

                # 3. Download the result from Replicate
                result_bytes = await self._download_result(output_url)

                # 4. Save the transparent PNG to Azure
                result_filename = get_result_filename(job_id)
                await StorageService.save_result(result_bytes, result_filename)

                return True

        except Exception as e:
            logger.error(f"❌ Replicate RemBG Error (Job #{job_id}): {e}")
            return False

    async def _process_with_replicate(self, image_stream: io.BytesIO) -> str:
        """Triggers the Replicate prediction in a thread to keep FastAPI responsive."""
        def call_replicate():
            try:
                # Passing the file stream directly to Replicate
                return replicate.run(self._model_id, input={"image": image_stream})
            finally:
                image_stream.close()

        # 5 minute timeout for AI processing
        output = await asyncio.wait_for(asyncio.to_thread(call_replicate), timeout=300)
        return str(output)

    async def _download_result(self, url: str) -> bytes:
        """Securely downloads the processed result from Replicate's CDN."""
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme != "https" or "replicate.delivery" not in parsed.netloc:
            raise ValueError("Untrusted output source.")

        async with aiohttp.ClientSession() as session:
            async with session.get(url) as resp:
                if resp.status != 200:
                    raise ValueError(f"Failed to download result: {resp.status}")
                return await resp.read()

bg_remover = BackgroundRemover()