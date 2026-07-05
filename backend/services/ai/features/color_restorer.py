"""Color restoration AI feature service.

This module implements the color-restoration feature using the shared image
pipeline. Its main feature-specific responsibility is validating that the input
image is effectively grayscale before sending it to the remote model.
"""

import asyncio
import io

from core.config import settings
from provider.ai_provider import BaseAIProvider
from services.ai.pipeline.image_pipeline_service import ImagePipelineService
from utils.validator.color_validation import validate_grayscale_image


class ColorRestorer(ImagePipelineService):
    """Service for restoring color in grayscale images."""

    def __init__(
        self,
        provider: BaseAIProvider = None,
        max_concurrent_remote_jobs: int = settings.MAX_CONCURRENT_JOBS,
    ):
        """Initialize the color restoration service.

        Args:
            provider:
                Optional AI provider implementation.
            max_concurrent_remote_jobs:
                Maximum concurrent remote AI jobs for this service instance.
        """
        super().__init__(
            model_type="colorrestore",
            provider=provider,
            max_concurrent_remote_jobs=max_concurrent_remote_jobs,
        )

    async def run_restore(self, safe_filename: str, job_id: str) -> bool:
        """Run color restoration for an uploaded image.

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

    async def preprocess_input(self, raw_bytes: bytes, **kwargs) -> io.BytesIO:
        """Validate grayscale input before model execution.

        Args:
            raw_bytes:
                Raw uploaded image bytes.

        Raises:
            ValueError:
                Raised when the uploaded image already contains significant
                color data.

        Returns:
            io.BytesIO:
                Prepared image stream for model input.
        """
        loop = asyncio.get_running_loop()
        is_valid_grayscale = await loop.run_in_executor(
            None,
            validate_grayscale_image,
            raw_bytes,
        )

        if not is_valid_grayscale:
            raise ValueError("Validation Failed: Image already contains color.")

        return await super().preprocess_input(raw_bytes, **kwargs)


color_restorer = ColorRestorer()
