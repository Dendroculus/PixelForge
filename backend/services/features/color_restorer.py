from services.base_class.image_pipeline_service import ImagePipelineService
from services.adapter.ai_provider import BaseAIProvider
from core.config import MAX_CONCURENT_JOBS
from utils.color_validation import validate_grayscale_image

class ColorRestorer(ImagePipelineService):
    """
    Service for restoring image colors using the shared image pipeline.
    """

    def __init__(self, provider: BaseAIProvider = None, max_concurrent_remote_jobs: int = MAX_CONCURENT_JOBS):
        super().__init__(
            model_type="colorrestore",
            provider=provider,
            max_concurrent_remote_jobs=max_concurrent_remote_jobs,
        )

    async def run_restore(self, safe_filename: str, job_id: str) -> bool:
        """
        Overrides the base run method to include a pre-check for grayscale validation before processing.
        This ensures that only valid black and white images are processed for color restoration.
        
        Args:
            safe_filename (str): The sanitized filename of the uploaded image.
            job_id (str): The unique identifier for the processing job.
            
        Returns:
            bool: True if processing should continue, False if validation fails.
        """
        try:
            file_bytes = await self.storage.download_bytes(safe_filename)
        except Exception as e:
            await self.fail_job(job_id, f"Failed to retrieve image: {str(e)}")
            return False

        is_valid_grayscale = validate_grayscale_image(file_bytes)
        
        if not is_valid_grayscale:
            await self.fail_job(job_id, "This image already has color! Please upload a black and white image.")
            return False

        return await super().run(safe_filename, job_id)

color_restorer = ColorRestorer()