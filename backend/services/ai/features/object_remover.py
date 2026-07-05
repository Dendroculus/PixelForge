"""Object removal AI feature service.

Object removal differs from the other AI tools because the remote model needs
both a source image and a mask image. This service extends the shared image
pipeline by loading the mask from Azure and passing both streams to the model.
"""

import io

from core.config import settings
from core.model_registry import ModelRegistry
from provider.ai_provider import BaseAIProvider
from services.ai.pipeline.image_pipeline_service import ImagePipelineService
from services.azure.storage import StorageService


class ObjectRemover(ImagePipelineService):
    """Service for object removal using source image and mask inpainting."""

    def __init__(
        self,
        provider: BaseAIProvider = None,
        max_concurrent_remote_jobs: int = settings.MAX_CONCURRENT_JOBS,
    ):
        """Initialize the object removal service.

        Args:
            provider:
                Optional AI provider implementation.
            max_concurrent_remote_jobs:
                Maximum concurrent remote AI jobs for this service instance.
        """
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
        """Run object removal for an uploaded image and mask.

        Args:
            safe_filename:
                Sanitized source image filename.
            mask_filename:
                Sanitized mask image filename.
            job_id:
                Current job identifier.

        Returns:
            bool:
                ``True`` when the result is saved successfully, otherwise
                ``False``.
        """
        return await self.run(
            safe_filename,
            job_id,
            mask_filename=mask_filename,
        )

    async def _process_with_ai(self, image_stream: io.BytesIO, **kwargs) -> str:
        """Execute the object-removal model with image and mask streams.

        Args:
            image_stream:
                Prepared source image stream.
            **kwargs:
                Must include ``mask_filename``.

        Returns:
            str:
                Remote result URL returned by the provider.
        """
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
