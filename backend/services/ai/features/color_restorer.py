import asyncio
import io
from services.ai.pipeline.image_pipeline_service import ImagePipelineService
from provider.ai_provider import BaseAIProvider
from core.config import settings
from utils.validator.color_validation import validate_grayscale_image

class ColorRestorer(ImagePipelineService):
    """
    Service for restoring image colors using the shared image pipeline.
    """

    def __init__(self, provider: BaseAIProvider = None, max_concurrent_remote_jobs: int = settings.MAX_CONCURRENT_JOBS):
        super().__init__(
            model_type="colorrestore",
            provider=provider,
            max_concurrent_remote_jobs=max_concurrent_remote_jobs,
        )
        
    async def run_restore(self, safe_filename: str, job_id: str):
        """Entry point called by JobManager."""
        return await self.run(safe_filename, job_id)

    async def preprocess_input(self, raw_bytes: bytes, **kwargs) -> io.BytesIO:
        """
        Hooks into the standard pipeline to validate grayscale before AI processing.
        raw_bytes are automatically fetched from Azure by the parent class.
        
        Args:
            raw_bytes (bytes): The raw image data to be processed.
        Returns:
            io.BytesIO: A byte stream of the validated grayscale image ready for AI processing.
        """
        loop = asyncio.get_running_loop()
        is_valid_grayscale = await loop.run_in_executor(None, validate_grayscale_image, raw_bytes)
        
        
        if not is_valid_grayscale:
            raise ValueError("Validation Failed: Image already contains color.")

        return await super().preprocess_input(raw_bytes, **kwargs)

color_restorer = ColorRestorer()