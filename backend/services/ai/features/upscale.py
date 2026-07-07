"""Image upscaling AI feature service.

This module implements ESRGAN-style upscaling on top of the shared image
pipeline. Upscaling is intentionally more specialized than normal AI tools
because scale factors multiply output pixel count:

    - 2x upscale creates roughly 4x more pixels.
    - 4x upscale creates roughly 16x more pixels.

For that reason, this service overrides shared input preprocessing with
scale-aware downscaling while still using the shared pipeline for upload
validation, provider execution, final generated-result size enforcement, and
storage.
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
    """Service for AI image upscaling with scale-aware input sizing."""

    def __init__(
        self,
        provider: BaseAIProvider = None,
        max_concurrent_remote_jobs: int = settings.MAX_CONCURRENT_JOBS,
        max_concurrent_cpu_jobs: int = settings.MAX_CONCURRENT_CPU_JOBS,
    ):
        """Initialize the image upscaling service.

        Args:
            provider:
                Optional AI provider implementation. Defaults to Replicate via
                the base pipeline.
            max_concurrent_remote_jobs:
                Maximum concurrent remote AI jobs for this service instance.
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
                Registered model type to run. Invalid values fall back to the
                general model.
            scale:
                Requested upscale multiplier.

        Returns:
            bool:
                ``True`` when the result is saved successfully, otherwise
                ``False``.
        """
        return await self.run(
            safe_filename,
            job_id,
            model_type=model_type,
            scale=scale,
        )

    async def preprocess_input(self, raw_bytes: bytes, **kwargs) -> io.BytesIO:
        """Optimize input image bytes before remote model execution.

        The input target is scale-aware. For example, a 4x upscale multiplies
        pixel count by 16, so the input is reduced more aggressively than for 2x.

        Args:
            raw_bytes:
                Raw uploaded image bytes.
            **kwargs:
                Expected to include ``scale`` and optionally ``job_id``.

        Returns:
            io.BytesIO:
                Prepared image stream for model input.
        """
        job_id = kwargs.get("job_id")
        scale = kwargs.get("scale", settings.DEFAULT_SCALE)

        async with self._cpu_semaphore:
            return await asyncio.to_thread(
                self._optimize_image_sync,
                raw_bytes,
                job_id,
                scale,
            )

    async def postprocess_output(self, result_bytes: bytes, **kwargs) -> bytes:
        """Cap model output dimensions after remote execution.

        Final byte-size compression/shrinking is handled by the shared pipeline.

        Args:
            result_bytes:
                Raw output bytes returned by the AI provider.
            **kwargs:
                Unused feature hook arguments.

        Returns:
            bytes:
                PNG-encoded output bytes after dimension capping.
        """
        async with self._cpu_semaphore:
            return await asyncio.to_thread(
                self._cap_output_dimension_sync,
                result_bytes,
            )

    def build_model_params(self, **kwargs) -> dict:
        """Build model parameters for the selected upscale model.

        Args:
            **kwargs:
                May include ``model_type`` and ``scale``.

        Returns:
            dict:
                Provider-specific model parameters.
        """
        model_type = kwargs.get("model_type", "general")
        scale = kwargs.get("scale", settings.DEFAULT_SCALE)

        try:
            return ModelRegistry.get_params(model_type, scale=scale)
        except ValueError:
            return ModelRegistry.get_params("general", scale=settings.DEFAULT_SCALE)

    async def _process_with_ai(self, image_stream: io.BytesIO, **kwargs) -> str:
        """Run the selected upscaling model through the configured provider.

        Args:
            image_stream:
                Prepared image stream.
            **kwargs:
                May include ``model_type`` and ``scale``.

        Returns:
            str:
                Remote result URL returned by the provider.
        """
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

    def _get_scale_aware_input_pixel_target(self, scale: int) -> int:
        """Return a safe input pixel target for the requested upscale factor.

        Args:
            scale:
                Requested upscale multiplier.

        Returns:
            int:
                Maximum input pixels allowed before sending the image to the
                remote upscaling model.
        """
        safe_scale = max(1, min(int(scale), 4))

        # Output pixels roughly equal input_pixels * scale^2.
        scale_limited_input_pixels = (
            settings.MAX_UPSCALE_OUTPUT_PIXELS // (safe_scale * safe_scale)
        )

        return max(
            1,
            min(settings.OPTIMIZATION_TARGET_PIXELS, scale_limited_input_pixels),
        )

    def _optimize_image_sync(
        self,
        raw_bytes: bytes,
        job_id: str,
        scale: int,
    ) -> io.BytesIO:
        """Validate and optimize input image bytes for remote upscaling.

        Args:
            raw_bytes:
                Raw uploaded image bytes.
            job_id:
                Current job identifier. Kept for logging/debug compatibility.
            scale:
                Requested upscale multiplier.

        Returns:
            io.BytesIO:
                Prepared image stream for provider input.
        """
        with io.BytesIO(raw_bytes) as img_stream:
            with Image.open(img_stream) as img:
                img.verify()

        with io.BytesIO(raw_bytes) as img_stream:
            with Image.open(img_stream) as img:
                img.load()
                save_format = img.format or "JPEG"

                target_pixels = self._get_scale_aware_input_pixel_target(scale)
                img = smart_downscale(img, target_pixels)

                if img.mode in ("RGBA", "P") and save_format.upper() != "PNG":
                    img = img.convert("RGB")

                output_stream = io.BytesIO()
                save_kwargs = {"format": save_format}

                if save_format.upper() in ("JPEG", "JPG"):
                    save_kwargs.update({"quality": 95, "optimize": True})

                if save_format.upper() == "PNG":
                    save_kwargs.update({"optimize": True, "compress_level": 9})

                img.save(output_stream, **save_kwargs)
                output_stream.seek(0)

                return output_stream

    def _cap_output_dimension_sync(self, raw_bytes: bytes) -> bytes:
        """Cap AI output dimensions before shared byte-size enforcement.

        Args:
            raw_bytes:
                Raw output bytes returned by the AI provider.

        Returns:
            bytes:
                PNG-encoded bytes after maximum-dimension enforcement.
        """
        with io.BytesIO(raw_bytes) as input_stream:
            with Image.open(input_stream) as img:
                img.load()

                if max(img.size) > settings.MAX_IMAGE_DIMENSION:
                    img.thumbnail(
                        (
                            settings.MAX_IMAGE_DIMENSION,
                            settings.MAX_IMAGE_DIMENSION,
                        ),
                        Image.Resampling.LANCZOS,
                    )

                output_stream = io.BytesIO()
                img.save(
                    output_stream,
                    format="PNG",
                    optimize=True,
                    compress_level=9,
                )
                return output_stream.getvalue()


ai_upscaler = AIUpscaler()
