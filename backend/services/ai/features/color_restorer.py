"""Color restoration AI feature service.

This module implements the color-restoration feature using the shared image
pipeline. Its feature-specific responsibility is validating that the uploaded
image is effectively grayscale before sending it to the remote model.

After grayscale validation succeeds, preprocessing is delegated back to
``ImagePipelineService`` so color restoration receives the same shared input
safety as other normal AI tools:

    - uploaded byte-size validation,
    - uploaded resolution validation,
    - generic input downscaling before provider execution,
    - final generated-result size enforcement.
"""

import asyncio
import io

from core.config import settings
from provider.ai_provider import BaseAIProvider
from services.ai.pipeline.image_pipeline_service import ImagePipelineService, PipelineResult
from utils.validator.color_validation import validate_grayscale_image


class ColorRestorer(ImagePipelineService):
    """Service for restoring color in grayscale images."""

    def __init__(
        self,
        provider: BaseAIProvider = None,
        max_concurrent_remote_jobs: int = settings.MAX_CONCURRENT_JOBS,
    ):
        """Initialize the color-restoration service.

        Args:
            provider:
                Optional AI provider implementation. Defaults to Replicate via
                the base pipeline.
            max_concurrent_remote_jobs:
                Maximum concurrent remote AI jobs for this service instance.
        """
        super().__init__(
            model_type="colorrestore",
            provider=provider,
            max_concurrent_remote_jobs=max_concurrent_remote_jobs,
        )

    async def run_restore(self, safe_filename: str, job_id: str) -> PipelineResult:
        """Run color restoration for an uploaded image.

        Args:
            safe_filename:
                Sanitized uploaded image filename in the upload container.
            job_id:
                Current job identifier.

        Returns:
            PipelineResult:
                Successful result when the output is saved, otherwise a failed
                result with a user-safe code/message for the frontend.
        """
        return await self.run(safe_filename, job_id)

    async def preprocess_input(self, raw_bytes: bytes, **kwargs) -> io.BytesIO:
        """Validate grayscale input, then run shared input preprocessing.

        Args:
            raw_bytes:
                Raw uploaded image bytes.
            **kwargs:
                Feature hook arguments forwarded to the shared base
                preprocessing implementation.

        Raises:
            ValueError:
                Raised when the uploaded image already contains significant
                color data.

        Returns:
            io.BytesIO:
                Prepared image stream for model input.
        """
        is_valid_grayscale = await asyncio.to_thread(
            validate_grayscale_image,
            raw_bytes,
        )

        if not is_valid_grayscale:
            raise ValueError("Validation Failed: Image already contains color.")

        return await super().preprocess_input(raw_bytes, **kwargs)


color_restorer = ColorRestorer()
