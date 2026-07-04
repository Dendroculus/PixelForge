import io

from core.config import settings
from core.model_registry import ModelRegistry
from provider.ai_provider import BaseAIProvider
from services.ai.pipeline.image_pipeline_service import ImagePipelineService
from services.azure.storage import StorageService


class ObjectRemover(ImagePipelineService):
    """
    Service for object removal using image + mask inpainting.
    """

    def __init__(self, provider: BaseAIProvider = None,max_concurrent_remote_jobs: int = settings.MAX_CONCURRENT_JOBS):
        super().__init__(
            model_type="objectremove",
            provider=provider,
            max_concurrent_remote_jobs=max_concurrent_remote_jobs,
        )

    async def run_object_remove(
        self,
        safe_filename: str,
        mask_filename: str,
        job_id: str,
    ) -> bool:
        return await self.run(
            safe_filename,
            job_id,
            mask_filename=mask_filename,
        )

    async def _process_with_ai(self, image_stream: io.BytesIO, **kwargs) -> str:
        mask_filename = kwargs["mask_filename"]

        mask_bytes = await StorageService.get_upload_bytes(mask_filename)
        mask_stream = io.BytesIO(mask_bytes)
        mask_stream.seek(0)

        model_id = ModelRegistry.get_replicate_id(self.model_type)
        image_key = ModelRegistry.get_input_key(self.model_type)
        mask_key = ModelRegistry.get_mask_key(self.model_type)

        params = self.build_model_params(**kwargs)
        params[image_key] = image_stream
        params[mask_key] = mask_stream

        try:
            return await self.provider.run_model(model_id, params=params)
        finally:
            image_stream.close()
            mask_stream.close()


object_remover = ObjectRemover()