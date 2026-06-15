import asyncio
import io
from PIL import Image
from core.config import DEFAULT_SCALE, OPTIMIZATION_TARGET_PIXELS, MAX_CONCURENT_JOBS
from core.model_registry import ModelRegistry
from services.ai.image_pipeline_service import ImagePipelineService
from services.ai.ai_provider import BaseAIProvider
from utils.image_utils import smart_downscale


class AIUpscaler(ImagePipelineService):
    """
    Service for AI upscaling with ESRGAN-specific preprocess/postprocess stages.
    """

    def __init__(
        self,
        provider: BaseAIProvider = None,
        max_concurrent_remote_jobs: int = MAX_CONCURENT_JOBS,
        max_concurrent_cpu_jobs: int = 4,
    ):
        super().__init__(
            model_type="general",
            provider=provider,
            max_concurrent_remote_jobs=max_concurrent_remote_jobs,
        )
        self._cpu_semaphore = asyncio.Semaphore(max_concurrent_cpu_jobs)

    async def run_upscale(self, safe_filename: str, job_id: str, model_type: str, scale: int = 4) -> bool:
        return await self.run(safe_filename, job_id, model_type=model_type, scale=scale)

    async def preprocess_input(self, raw_bytes: bytes, **kwargs) -> io.BytesIO:
        job_id = kwargs.get("job_id")
        async with self._cpu_semaphore:
            return await asyncio.to_thread(self._optimize_image_sync, raw_bytes, job_id)

    async def postprocess_output(self, result_bytes: bytes, **kwargs) -> bytes:
        async with self._cpu_semaphore:
            return await asyncio.to_thread(self._compress_output_sync, result_bytes)

    def build_model_params(self, **kwargs) -> dict:
        model_type = kwargs.get("model_type", "general")
        scale = kwargs.get("scale", DEFAULT_SCALE)

        try:
            return ModelRegistry.get_params(model_type, scale=scale)
        except ValueError:
            return ModelRegistry.get_params("general", scale=DEFAULT_SCALE)

    async def _process_with_ai(self, image_stream: io.BytesIO, **kwargs) -> str:
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
        """
        Optimizes an image via CPU-bound PIL transformations.

        Args:
            raw_bytes (bytes): The raw image payload.
            job_id (str): The unique job identifier.

        Returns:
            io.BytesIO: The prepared image stream for the remote AI model.
        """
        with io.BytesIO(raw_bytes) as img_stream:
            with Image.open(img_stream) as img:
                img.verify()

        with io.BytesIO(raw_bytes) as img_stream:
            with Image.open(img_stream) as img:
                save_format = img.format or "JPEG"
                
                img = smart_downscale(img, OPTIMIZATION_TARGET_PIXELS)

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
        """
        Compresses image output via CPU-bound PIL transformations.

        Args:
            raw_bytes (bytes): The output image bytes returned by the AI provider.

        Returns:
            bytes: The compressed PNG bytes.
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