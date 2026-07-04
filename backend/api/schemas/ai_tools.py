from pydantic import BaseModel, Field

class InitRequest(BaseModel):
    cf_turnstile_response: str
    filename: str


class StartUpscaleRequest(BaseModel):
    job_id: str
    safe_filename: str
    scale: int = Field(default=2, ge=1, le=4)


class StartRembgRequest(BaseModel):
    job_id: str
    safe_filename: str


class StartColorRestoreRequest(BaseModel):
    job_id: str
    safe_filename: str