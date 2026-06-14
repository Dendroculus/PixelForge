import io
import logging
from PIL import Image
from services.base_class.image_pipeline_service import ImagePipelineService
from services.adapter.ai_provider import BaseAIProvider
from core.config import MAX_CONCURENT_JOBS, MAX_PIXELS

logger = logging.getLogger(__name__)

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

    async def preprocess_input(self, raw_bytes: bytes, **kwargs) -> io.BytesIO:
        """
        Smart Downscaling: If the image exceeds 3 Megapixels (MAX_PIXELS), 
        resize it proportionally using high-quality LANCZOS resampling BEFORE 
        sending it to the AI.
        """
        try:
            with Image.open(io.BytesIO(raw_bytes)) as img:
                width, height = img.size
                total_pixels = width * height
                
                # If image is larger than 3 Megapixels, downscale it
                if total_pixels > MAX_PIXELS:
                    # Calculate scale factor to maintain exact aspect ratio
                    scale_factor = (MAX_PIXELS / total_pixels) ** 0.5
                    new_width = int(width * scale_factor)
                    new_height = int(height * scale_factor)
                    
                    # LANCZOS is the highest quality downsampling filter
                    img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                    logger.info(f"Job {kwargs.get('job_id')}: Downscaled {width}x{height} to {new_width}x{new_height}")
                
                # Save processed image to stream to send to Replicate
                out_stream = io.BytesIO()
                # If original format is missing, default to JPEG
                img.save(out_stream, format=img.format or "JPEG")
                out_stream.seek(0)
                return out_stream
        except Exception as e:
            logger.error(f"Preprocessing failed: {e}")
            # Fallback to original bytes if PIL fails
            stream = io.BytesIO(raw_bytes)
            stream.seek(0)
            return stream

    async def postprocess_output(self, result_bytes: bytes, **kwargs) -> bytes:
        """
        Convert Replicate's raw PNG to WebP to maintain transparency 
        while drastically reducing file size to stay under 10MB.
        """
        try:
            with Image.open(io.BytesIO(result_bytes)) as img:
                out_stream = io.BytesIO()
                img.save(out_stream, format="WEBP", quality=90, method=4)
                return out_stream.getvalue()
        except Exception as e:
            logger.error(f"Postprocessing failed: {e}")
            return result_bytes


bg_remover = BackgroundRemover()