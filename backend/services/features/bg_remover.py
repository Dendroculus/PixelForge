import asyncio
import io
import logging
from PIL import Image
from services.base_class.image_pipeline_service import ImagePipelineService
from services.adapter.ai_provider import BaseAIProvider
from core.config import MAX_CONCURENT_JOBS, MAX_PIXELS
from utils.image_utils import smart_downscale

logger = logging.getLogger(__name__)

class BackgroundRemover(ImagePipelineService):
    """
    Service for removing backgrounds using the shared image pipeline.
    """

    def __init__(self, provider: BaseAIProvider = None, max_concurrent_remote_jobs: int = MAX_CONCURENT_JOBS):
        super().__init__(
            model_type="rembg",
            provider=provider,
            max_concurrent_remote_jobs=max_concurrent_remote_jobs,
        )

    async def run_removal(self, safe_filename: str, job_id: str) -> bool:
        return await self.run(safe_filename, job_id)

    def _preprocess_sync(self, raw_bytes: bytes) -> io.BytesIO:
        """
        Synchronously processes and downscales an image if it exceeds resolution limits.

        Args:
            raw_bytes (bytes): The raw uploaded image payload.

        Returns:
            io.BytesIO: The prepared image stream.
        """
        with Image.open(io.BytesIO(raw_bytes)) as img:
            img = smart_downscale(img, MAX_PIXELS)
            out_stream = io.BytesIO()
            img.save(out_stream, format=img.format or "JPEG")
            out_stream.seek(0)
            return out_stream

    async def preprocess_input(self, raw_bytes: bytes, **kwargs) -> io.BytesIO:
        try:
            loop = asyncio.get_running_loop()
            return await loop.run_in_executor(None, self._preprocess_sync, raw_bytes)
        except Exception as e:
            logger.error(f"Preprocessing failed: {e}")
            stream = io.BytesIO(raw_bytes)
            stream.seek(0)
            return stream

    def _postprocess_sync(self, result_bytes: bytes) -> bytes:
        """
        Synchronously compresses remote AI output into the WEBP format.

        Args:
            result_bytes (bytes): The raw, uncompressed output image payload.

        Returns:
            bytes: The highly compressed WEBP bytes retaining the alpha channel.
        """
        with Image.open(io.BytesIO(result_bytes)) as img:
            out_stream = io.BytesIO()
            img.save(out_stream, format="WEBP", quality=90, method=4)
            return out_stream.getvalue()

    async def postprocess_output(self, result_bytes: bytes, **kwargs) -> bytes:
        try:
            loop = asyncio.get_running_loop()
            return await loop.run_in_executor(None, self._postprocess_sync, result_bytes)
        except Exception as e:
            logger.error(f"Postprocessing failed: {e}")
            return result_bytes


bg_remover = BackgroundRemover()