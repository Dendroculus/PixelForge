"""Background removal AI feature service.

This module implements the background-removal feature on top of the shared
``ImagePipelineService`` template.

Background removal now relies on the shared base pipeline for input safety:

    - uploaded byte-size validation,
    - uploaded resolution validation,
    - generic input downscaling before provider execution,
    - final generated-result size enforcement.

The feature-specific responsibility in this module is only output normalization:
background-removal results are encoded as optimized PNG so transparency is
preserved and the bytes match the standard ``.png`` result filename.
"""

import asyncio
import io
import logging

from PIL import Image

from core.config import settings
from provider.ai_provider import BaseAIProvider
from services.ai.pipeline.image_pipeline_service import ImagePipelineService

logger = logging.getLogger(__name__)


class BackgroundRemover(ImagePipelineService):
    """Service for removing image backgrounds using the shared AI pipeline."""

    def __init__(
        self,
        provider: BaseAIProvider = None,
        max_concurrent_remote_jobs: int = settings.MAX_CONCURRENT_JOBS,
    ):
        """Initialize the background-removal service.

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

    def _postprocess_sync(self, result_bytes: bytes) -> bytes:
        """Encode remote background-removal output as optimized PNG.

        Args:
            result_bytes:
                Raw output bytes returned by the AI provider.

        Returns:
            bytes:
                PNG-encoded output bytes with transparency preserved when
                present.
        """
        with Image.open(io.BytesIO(result_bytes)) as img:
            img.load()

            if img.mode not in ("RGBA", "LA"):
                img = img.convert("RGBA")

            out_stream = io.BytesIO()
            img.save(
                out_stream,
                format="PNG",
                optimize=True,
                compress_level=9,
            )
            return out_stream.getvalue()

    async def postprocess_output(self, result_bytes: bytes, **kwargs) -> bytes:
        """Run output normalization outside the event loop.

        Args:
            result_bytes:
                Raw output bytes returned by the AI provider.
            **kwargs:
                Unused feature hook arguments.

        Returns:
            bytes:
                PNG-encoded output bytes. If normalization fails, the raw
                provider output is returned and the shared pipeline will still
                apply final size enforcement.
        """
        try:
            return await asyncio.to_thread(self._postprocess_sync, result_bytes)
        except Exception as e:
            logger.error("Background-removal postprocessing failed: %s", e)
            return result_bytes


bg_remover = BackgroundRemover()
