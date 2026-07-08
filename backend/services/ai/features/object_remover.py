"""Object removal AI feature service.

Object removal differs from the other AI tools because the remote model needs
both a source image and a mask image. This service extends the shared image
pipeline by loading the mask from Azure and passing both streams to the model.

The source image is prepared by ``ImagePipelineService.preprocess_input`` before
``_process_with_ai`` runs. That means the source may be downscaled by the shared
pipeline. To keep the inpainting model safe and accurate, this service resizes
the uploaded mask to match the prepared source-image dimensions.
"""

import io

from PIL import Image

from core.config import settings
from core.model_registry import ModelRegistry
from provider.ai_provider import BaseAIProvider
from services.ai.pipeline.image_pipeline_service import ImagePipelineService, PipelineResult
from services.azure.storage import StorageService


class ObjectRemover(ImagePipelineService):
    """Service for object removal using source image and mask inpainting."""

    def __init__(
        self,
        provider: BaseAIProvider = None,
        max_concurrent_remote_jobs: int = settings.MAX_CONCURRENT_JOBS,
    ):
        """Initialize the object-removal service.

        Args:
            provider:
                Optional AI provider implementation. Defaults to Replicate via
                the base pipeline.
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
    ) -> PipelineResult:
        """Run object removal for an uploaded image and mask.

        Args:
            safe_filename:
                Sanitized source image filename.
            mask_filename:
                Sanitized mask image filename.
            job_id:
                Current job identifier.

        Returns:
            PipelineResult:
                Successful result when the output is saved, otherwise a failed
                result with a user-safe code/message for the frontend.
        """
        return await self.run(
            safe_filename,
            job_id,
            mask_filename=mask_filename,
        )

    def _prepare_mask_for_source(
        self,
        source_bytes: bytes,
        mask_bytes: bytes,
    ) -> io.BytesIO:
        """Resize and encode the mask to match the prepared source image.

        Args:
            source_bytes:
                Bytes from the already-prepared source image stream.
            mask_bytes:
                Raw mask bytes downloaded from Azure.

        Returns:
            io.BytesIO:
                PNG mask stream positioned at byte 0.
        """
        with Image.open(io.BytesIO(source_bytes)) as source_img:
            source_img.load()
            source_size = source_img.size

        with Image.open(io.BytesIO(mask_bytes)) as mask_img:
            mask_img.load()

            if mask_img.size != source_size:
                mask_img = mask_img.resize(source_size, Image.Resampling.NEAREST)

            mask_img = mask_img.convert("RGBA")

            mask_stream = io.BytesIO()
            mask_img.save(
                mask_stream,
                format="PNG",
                optimize=True,
                compress_level=9,
            )
            mask_stream.seek(0)

            return mask_stream

    async def _process_with_ai(self, image_stream: io.BytesIO, **kwargs) -> str:
        """Execute the object-removal model with image and resized mask streams.

        Args:
            image_stream:
                Prepared source image stream. This may already be downscaled by
                the shared base pipeline.
            **kwargs:
                Must include ``mask_filename``.

        Returns:
            str:
                Remote result URL returned by the provider.
        """
        mask_filename = kwargs["mask_filename"]

        image_stream.seek(0)
        source_bytes = image_stream.read()
        image_stream.seek(0)

        mask_bytes = await StorageService.get_upload_bytes(mask_filename)
        self.validate_input_size(mask_bytes)
        self.validate_input_resolution(mask_bytes)

        mask_stream = self._prepare_mask_for_source(source_bytes, mask_bytes)

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
