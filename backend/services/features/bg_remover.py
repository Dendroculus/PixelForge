from services.base_class.image_pipeline_service import ImagePipelineService
from services.adapter.ai_provider import BaseAIProvider
from core.config import MAX_CONCURENT_JOBS


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


bg_remover = BackgroundRemover()