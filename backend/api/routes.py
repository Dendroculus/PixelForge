import logging
from fastapi import APIRouter, Form, UploadFile, File, Depends, BackgroundTasks, HTTPException, status, Request

from core.security import process_and_sanitize_image
from core.rate_limiter import limiter
from services.storage import StorageService
from services.esrgan import ai_upscaler
from api.dependencies import valid_model_type, verify_turnstile
from core.config import LimitConfig as LC
from helper.utils import get_result_filename

logger = logging.getLogger(__name__)

router = APIRouter(tags=["upscale"])

async def process_image_task(job_id: str, safe_filename: str, model_type: str):
    logger.info(f"🚀 Background task started for Job {job_id} [{model_type}]")
    try:
        success = await ai_upscaler.run_upscale(safe_filename=safe_filename, job_id=job_id , model_type=model_type)
        if not success:
            logger.error(f"❌ Background task failed for Job {job_id}")
            await StorageService.mark_job_failed(job_id)
    except Exception as e:
        logger.error(f"❌ Exception in background task for Job {job_id}: {str(e)}")
        await StorageService.mark_job_failed(job_id)

@router.post(
    "/upscale", 
    status_code=status.HTTP_202_ACCEPTED,
    summary="Upload an image for upscaling",
    response_description="Returns the job ID for tracking the upscale process",
)
@limiter.limit(LC.UPLOAD_RATE_LIMIT)
async def upload_image(
    request: Request,
    background_tasks: BackgroundTasks, 
    cf_turnstile_response: str = Form(...),
    file: UploadFile = File(...),
    model_type: str = Depends(valid_model_type),
):
    
    await verify_turnstile(cf_turnstile_response)
    
    try:
        job_id, safe_filename, image_stream = await process_and_sanitize_image(file)    
        await StorageService.save_upload(image_stream, safe_filename)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload handling failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Failed to process upload"
        )
    
    background_tasks.add_task(process_image_task, job_id, safe_filename, model_type)
    
    return {"message": "Upload successful, processing started", "job_id": job_id}

@router.get(
    "/result/{job_id}",
    summary="Check upscaling result",
    response_description="Returns the status of the job and the URL if ready",
)
@limiter.limit(LC.POLL_RATE_LIMIT)
async def get_result(
    request: Request,
    job_id: str,
):
    if not job_id or not job_id.isalnum():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid job ID")

    try:
        is_failed = await StorageService.check_job_failed(job_id)
        if is_failed:
            return {"status": "failed", "message": "AI processing failed or ran out of memory."}
            
        result_filename = get_result_filename(job_id)
        exists = await StorageService.check_result_exists(result_filename)
        
        if exists:
            url = StorageService.get_result_url(result_filename)
            return {"status": "ready", "url": url}
        
        return {"status": "processing"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking result for job {job_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Error retrieving job status"
        )