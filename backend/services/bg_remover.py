import asyncio
import aiohttp
import io
import logging
import urllib.parse
import time
from services.storage import StorageService
from core.config import MAX_FILE_SIZE_BYTES
from helper.utils import get_result_filename
from core.model_registry import ModelRegistry
from services.ai_provider import BaseAIProvider, ReplicateProvider

logger = logging.getLogger(__name__)

class BackgroundRemover:
    """
    Service for removing backgrounds using an injected AI Provider.
    """

    def __init__(
        self, 
        provider: BaseAIProvider = None,
        max_concurrent_remote_jobs: int = 5
    ):
        self.provider = provider or ReplicateProvider()
        self._remote_semaphore = asyncio.Semaphore(max_concurrent_remote_jobs)
        self.MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_BYTES

    async def run_removal(self, safe_filename: str, job_id: str) -> bool:
        started_at = time.perf_counter()
        try:
            t0 = time.perf_counter()
            raw_bytes = await StorageService.get_upload_bytes(safe_filename)
            t1 = time.perf_counter()

            if len(raw_bytes) > self.MAX_FILE_SIZE_BYTES:
                raise ValueError("Payload exceeds maximum size.")

            image_stream = io.BytesIO(raw_bytes)

            q_start = time.perf_counter()
            async with self._remote_semaphore:
                q_wait = time.perf_counter() - q_start
                logger.info("Remote slot acquired (bg remove) job=%s wait=%.3fs", job_id, q_wait)

                r0 = time.perf_counter()
                output_url = await self._process_with_ai(image_stream)
                r1 = time.perf_counter()

            d0 = time.perf_counter()
            result_bytes = await self._download_result(output_url)
            d1 = time.perf_counter()

            s0 = time.perf_counter()
            result_filename = get_result_filename(job_id)
            await StorageService.save_result(result_bytes, result_filename)
            s1 = time.perf_counter()

            total = time.perf_counter() - started_at
            logger.info(
                "BG remove done job=%s total=%.3fs upload_read=%.3fs remote=%.3fs result_download=%.3fs save=%.3fs",
                job_id, total, (t1 - t0), (r1 - r0), (d1 - d0), (s1 - s0)
            )
            return True

        except Exception as e:
            logger.error(f"Remote RemBG Error (Job #{job_id}): {e}")
            return False

    async def _process_with_ai(self, image_stream: io.BytesIO) -> str:
        """
        Processes the image stream through the injected AI provider.
        """
        model_id = ModelRegistry.get_replicate_id("rembg")
        try:
            return await self.provider.run_model(model_id, params={"image": image_stream})
        finally:
            image_stream.close()

    async def _download_result(self, url: str) -> bytes:
        """
        Downloads the processed image result.
        """
        parsed = urllib.parse.urlparse(url)
        if parsed.scheme != "https":
            raise ValueError("Untrusted output source.")

        timeout = aiohttp.ClientTimeout(total=60)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(url) as resp:
                if resp.status != 200:
                    raise ValueError(f"Failed to download result: {resp.status}")
                return await resp.read()

bg_remover = BackgroundRemover()