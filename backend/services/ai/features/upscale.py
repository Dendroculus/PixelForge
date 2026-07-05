"""Image upscaling AI feature service.

This module implements ESRGAN-style upscaling on top of the shared image
pipeline. It adds CPU-bound preprocessing for model-friendly input sizing and
postprocessing to cap large outputs before storing them.
"""

import asyncio
import io

from PIL import Image

from core.config import settings
from core.model_registry import ModelRegistry
from provider.ai_provider import BaseAIProvider
from services.ai.pipeline.image_pipeline_service import ImagePipelineService
from utils.image.image_utils import smart_downscale


class AIUpscaler(ImagePipelineService):
    """Service for AI image upscaling with feature-specific image handling."""

    def __init__(
        self,
        provider: BaseAIProvider = None,
        max_concurrent_remote_jobs: int = settings.MAX_CONCURRENT_JOBS,
        max_concurrent_cpu_jobs: int = settings.MAX_CONCURRENT_CPU_JOBS,
    ):
        """Initialize the image upscaling service.

        Args:
            provider:
                Optional AI provider implementation.
            max_concurrent_remote_jobs:
                Maximum concurrent remote AI jobs.
            max_concurrent_cpu_jobs:
                Maximum concurrent CPU-bound preprocessing/postprocessing jobs.
        """
        super().__init__(
            model_type="general",
            provider=provider,
            max_concurrent_remote_jobs=max_concurrent_remote_jobs,
        )
        self._cpu_semaphore = asyncio.Semaphore(max_concurrent_cpu_jobs)

    async def run_upscale(
        self,
        safe_filename: str,
        job_id: str,
        model_type: str,
        scale: int = 4,
    ) -> bool:
        """Run AI upscaling for an uploaded image.

        Args:
            safe_filename:
                Sanitized uploaded image filename.
            job_id:
                Current job identifier.
            model_type:
                Registered model type to run.
            scale:
                Requested upscale multiplier.

        Returns:
            bool:
                ``True`` when the result is saved successfully, otherwise
                ``False``.
        """
        return await self.run(safe_filename, job_id, model_type=model_type, scale=scale)

    async def preprocess_input(self, raw_bytes: bytes, **kwargs) -> io.BytesIO:
        """Optimize input image bytes before remote model execution."""
        job_id = kwargs.get("job_id")
        async with self._cpu_semaphore:
            return await asyncio.to_thread(self._optimize_image_sync, raw_bytes, job_id)

    async def postprocess_output(self, result_bytes: bytes, **kwargs) -> bytes:
        """Compress and cap model output size after remote execution."""
        async with self._cpu_semaphore:
            return await asyncio.to_thread(self._compress_output_sync, result_bytes)

    def build_model_params(self, **kwargs) -> dict:
        """Build model parameters for the selected upscale model."""
        model_type = kwargs.get("model_type", "general")
        scale = kwargs.get("scale", settings.DEFAULT_SCALE)

        try:
            return ModelRegistry.get_params(model_type, scale=scale)
        except ValueError:
            return ModelRegistry.get_params("general", scale=settings.DEFAULT_SCALE)

    async def _process_with_ai(self, image_stream: io.BytesIO, **kwargs) -> str:
        """Run the selected upscaling model through the configured provider."""
        model_type = kwargs.get("model_type", "general")

        try:
            model_id = ModelRegistry.get_replicate_id(model_type)
            input_key = ModelRegistry.get_input_key(model_type)
        except ValueError:
            model_id = ModelRegistry.get_replicate_id("general")
            input_key = ModelRegistry.get_input_key("general")

        params = self.build_model_params(**kwargs)
        params[input_key] = image_stream

        try:
            return await self.provider.run_model(model_id, params=params)
        finally:
            image_stream.close()

    def _optimize_image_sync(self, raw_bytes: bytes, job_id: str) -> io.BytesIO:
        """Validate and optimize input image bytes for remote upscaling.

        Args:
            raw_bytes:
                Raw uploaded image bytes.
            job_id:
                Current job identifier. Present for logging/debug extension.

        Returns:
            io.BytesIO:
                Prepared image stream for model input.
        """
        with io.BytesIO(raw_bytes) as img_stream:
            with Image.open(img_stream) as img:
                img.verify()

        with io.BytesIO(raw_bytes) as img_stream:
            with Image.open(img_stream) as img:
                save_format = img.format or "JPEG"

                img = smart_downscale(img, settings.OPTIMIZATION_TARGET_PIXELS)

                if img.mode in ("RGBA", "P") and save_format != "PNG":
                    img = img.convert("RGB")

                output_stream = io.BytesIO()
                save_kwargs = {"format": save_format}

                if save_format.upper() in ("JPEG", "JPG"):
                    save_kwargs.update({"quality": 95, "optimize": True})

                img.save(output_stream, **save_kwargs)
                output_stream.seek(0)
                return output_stream

    def _compress_output_sync(self, raw_bytes: bytes) -> bytes:
        """Cap and encode AI output bytes as PNG.

        Args:
            raw_bytes:
                Output image bytes returned by the AI provider.

        Returns:
            bytes:
                PNG-encoded output bytes.
        """
        max_dimension = 4096

        with io.BytesIO(raw_bytes) as input_stream:
            with Image.open(input_stream) as img:
                img.load()

                if max(img.size) > max_dimension:
                    img.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)

                output_stream = io.BytesIO()
                img.save(output_stream, format="PNG", optimize=False)
                return output_stream.getvalue()


ai_upscaler = AIUpscaler()
