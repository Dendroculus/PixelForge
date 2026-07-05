"""Background removal AI feature service.

This module implements the background-removal feature on top of the shared
``ImagePipelineService`` template. It provides feature-specific preprocessing
and postprocessing while leaving storage, provider execution, result download,
and result persistence to the base pipeline.

Pipeline behavior:
    - Input images are downscaled when they exceed the configured pixel limit.
    - AI output is compressed to WEBP to preserve transparency efficiently.
    - Preprocessing/postprocessing failures fall back gracefully where possible.
"""

import asyncio
import io
import logging

from PIL import Image

from core.config import settings
from provider.ai_provider import BaseAIProvider
from services.ai.pipeline.image_pipeline_service import ImagePipelineService
from utils.image.image_utils import smart_downscale

logger = logging.getLogger(__name__)


class BackgroundRemover(ImagePipelineService):
    """Service for removing image backgrounds using the shared AI pipeline."""

    def __init__(
        self,
        provider: BaseAIProvider = None,
        max_concurrent_remote_jobs: int = settings.MAX_CONCURRENT_JOBS,
    ):
        """Initialize the background removal service.

        Args:
            provider:
                Optional AI provider implementation. Defaults to Replicate via
                the base pipeline.
            max_concurrent_remote_jobs:
                Maximum concurrent remote AI jobs for this service instance.
        """
        super().__init__(
            model_type="rembg",
            provider=provider,
            max_concurrent_remote_jobs=max_concurrent_remote_jobs,
        )

    async def run_removal(self, safe_filename: str, job_id: str) -> bool:
        """Run background removal for an uploaded image.

        Args:
            safe_filename:
                Sanitized uploaded image filename in the upload container.
            job_id:
                Current job identifier.

        Returns:
            bool:
                ``True`` when the result is saved successfully, otherwise
                ``False``.
        """
        return await self.run(safe_filename, job_id)

    def _preprocess_sync(self, raw_bytes: bytes) -> io.BytesIO:
        """Prepare uploaded image bytes for the remote background-removal model.

        Args:
            raw_bytes:
                Raw uploaded image bytes.

        Returns:
            io.BytesIO:
                Prepared image stream for model input.
        """
        with Image.open(io.BytesIO(raw_bytes)) as img:
            img = smart_downscale(img, settings.MAX_PIXELS)
            out_stream = io.BytesIO()
            img.save(out_stream, format=img.format or "JPEG")
            out_stream.seek(0)
            return out_stream

    async def preprocess_input(self, raw_bytes: bytes, **kwargs) -> io.BytesIO:
        """Run CPU-bound preprocessing outside the event loop.

        Args:
            raw_bytes:
                Raw uploaded image bytes.

        Returns:
            io.BytesIO:
                Prepared image stream. Falls back to the original bytes when
                preprocessing fails.
        """
        try:
            loop = asyncio.get_running_loop()
            return await loop.run_in_executor(None, self._preprocess_sync, raw_bytes)
        except Exception as e:
            logger.error("Preprocessing failed: %s", e)
            stream = io.BytesIO(raw_bytes)
            stream.seek(0)
            return stream

    def _postprocess_sync(self, result_bytes: bytes) -> bytes:
        """Compress remote AI output to WEBP.

        Args:
            result_bytes:
                Raw output bytes returned by the AI provider.

        Returns:
            bytes:
                WEBP-encoded result bytes.
        """
        with Image.open(io.BytesIO(result_bytes)) as img:
            out_stream = io.BytesIO()
            img.save(out_stream, format="WEBP", quality=90, method=4)
            return out_stream.getvalue()

    async def postprocess_output(self, result_bytes: bytes, **kwargs) -> bytes:
        """Run output compression outside the event loop.

        Args:
            result_bytes:
                Raw output bytes returned by the AI provider.

        Returns:
            bytes:
                Compressed output bytes, or the original output if compression
                fails.
        """
        try:
            loop = asyncio.get_running_loop()
            return await loop.run_in_executor(None, self._postprocess_sync, result_bytes)
        except Exception as e:
            logger.error("Postprocessing failed: %s", e)
            return result_bytes


bg_remover = BackgroundRemover()
