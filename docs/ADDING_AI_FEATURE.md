# Adding a New AI Feature to PixelForge

> A practical developer guide for adding a new AI-powered image feature to PixelForge without breaking the shared backend/frontend pipeline.

---

## 1. The Big Picture

PixelForge AI features follow a consistent workflow:

```txt
POST /{feature}/init
  -> verify Turnstile
  -> check usage limit
  -> create job_id
  -> create safe_filename
  -> return Azure upload_url

Frontend uploads image directly to Azure

POST /{feature}/start
  -> reserve queue slot
  -> increment usage
  -> run AI job in background

GET /result/{job_id}
  -> poll until ready, failed, or processing
```

Most features only need **one uploaded image**.

Some special features, like **Object Remove**, need extra generated files such as a mask image:

```txt
Object Remove:
original image + generated mask image -> AI model
```

---

## 2. Naming Rules

Choose one stable feature key and reuse it everywhere.

Example:

| Purpose | Example |
|---|---|
| Feature key | `cartoonize` |
| Display name | `Cartoonize` |
| Frontend route | `/cartoonize` |
| Init endpoint | `/cartoonize/init` |
| Start endpoint | `/cartoonize/start` |
| Usage key | `cartoonize` |
| Storage key prefix | `cartoonize_*` |

Recommended format:

```txt
lowercase
no spaces
no uppercase
short but clear
```

Good examples:

```txt
upscale
rembg
colorrestore
objectremove
cartoonize
denoise
```

Avoid:

```txt
ObjectRemove
object-remove
object remove
removeObjectAI
```

---

## 3. Backend Files

### Backend checklist

For a normal one-image AI feature, usually edit or create these files:

```txt
backend/domain/ai_features.py
backend/core/config.py
backend/core/model_registry.py
backend/api/schemas/ai_tools.py
backend/api/routes/ai_tools/<feature>.py
backend/api/routes/router.py
backend/services/ai/features/<feature_service>.py
backend/services/job/job_manager.py
```

For special features with extra uploads or custom model inputs, also check:

```txt
backend/services/job/job_initializer.py
backend/services/ai/features/<feature_service>.py
```

---

## 4. Backend Step-by-Step

Assume we are adding:

```txt
feature key: cartoonize
display name: Cartoonize
```

---

### 4.1 Update `backend/domain/ai_features.py`

Add the feature key to `FeatureType`.

```py
from typing import Literal

FeatureType = Literal[
    "upscale",
    "rembg",
    "colorrestore",
    "objectremove",
    "cartoonize",
]


FEATURE_DISPLAY_NAMES: dict[FeatureType, str] = {
    "upscale": "Upscale",
    "rembg": "RemBG",
    "colorrestore": "Color Restore",
    "objectremove": "Object Remove",
    "cartoonize": "Cartoonize",
}
```

Why this matters:

- FastAPI validates `{feature}` path parameters from routes like `/{feature}/init`
- Unsupported feature names are rejected before reaching the job logic
- Display names are used for user-facing backend responses

---

### 4.2 Update `backend/core/config.py`

Add a daily limit setting:

```py
CARTOONIZE_DAILY_USAGE_LIMIT: int = 5
```

Then add it to `FEATURE_LIMITS`:

```py
@property
def FEATURE_LIMITS(self) -> Dict[str, int]:
    return {
        "upscale": self.UPSCALE_DAILY_USAGE_LIMIT,
        "rembg": self.REMBG_DAILY_USAGE_LIMIT,
        "colorrestore": self.COLOR_RESTORE_DAILY_USAGE_LIMIT,
        "objectremove": self.OBJECT_REMOVE_DAILY_USAGE_LIMIT,
        "cartoonize": self.CARTOONIZE_DAILY_USAGE_LIMIT,
        "feedback": self.FEEDBACK_DAILY_USAGE_LIMIT,
    }
```

Why this matters:

- `/usage?feature=cartoonize` needs this
- `/{feature}/init` checks this before allowing uploads
- `/cartoonize/start` checks again before reserving the job

---

### 4.3 Update `backend/core/model_registry.py`

Register the AI model.

For a normal image-to-image model:

```py
"cartoonize": {
    "replicate_id": "owner/model:version_hash",
    "input_key": "image",
},
```

For a model with extra parameters:

```py
"cartoonize": {
    "replicate_id": "owner/model:version_hash",
    "input_key": "image",
    "style_key": "style",
},
```

If the model needs a custom helper, add one:

```py
@classmethod
def get_style_key(cls, model_type: str) -> str:
    if model_type not in cls._MODELS:
        raise ValueError(f"Model type '{model_type}' is not registered.")
    return cls._MODELS[model_type].get("style_key", "style")
```

Why this matters:

- Keeps model IDs centralized
- Prevents hardcoding Replicate IDs inside feature services
- Makes future provider/model changes easier

---

### 4.4 Update `backend/api/schemas/ai_tools.py`

Create a start request schema.

For simple one-image features:

```py
class StartCartoonizeRequest(BaseModel):
    job_id: str
    safe_filename: str
```

For tools with user options:

```py
class StartCartoonizeRequest(BaseModel):
    job_id: str
    safe_filename: str
    style: str = "anime"
```

For tools with extra uploaded files:

```py
class StartObjectRemoveRequest(BaseModel):
    job_id: str
    safe_filename: str
    mask_filename: str
```

Why this matters:

- Keeps request validation explicit
- Makes FastAPI error messages clearer
- Prevents frontend/backend payload mismatch

---

### 4.5 Create `backend/api/routes/ai_tools/cartoonize.py`

For a normal feature:

```py
from fastapi import APIRouter, BackgroundTasks, Request, status

from api.schemas.ai_tools import StartCartoonizeRequest
from core.config import settings
from limiter.rate_limiter import limiter
from services.job.job_dispatcher import reserve_and_queue_job
from services.job.job_manager import JobManager

router = APIRouter(tags=["ai_tools"])


@router.post("/cartoonize/start", status_code=status.HTTP_202_ACCEPTED)
@limiter.limit(settings.UPLOAD_RATE_LIMIT)
async def start_cartoonize(
    request: Request,
    payload: StartCartoonizeRequest,
    bg_tasks: BackgroundTasks,
):
    return await reserve_and_queue_job(
        "cartoonize",
        request,
        payload.job_id,
        payload.safe_filename,
        bg_tasks,
        JobManager.process_cartoonize,
    )
```

For a feature with extra args:

```py
return await reserve_and_queue_job(
    "cartoonize",
    request,
    payload.job_id,
    payload.safe_filename,
    bg_tasks,
    JobManager.process_cartoonize,
    payload.style,
)
```

Remember the order:

```txt
reserve_and_queue_job(...)
  -> process_func(job_id, safe_filename, *process_args, client_ip)
```

---

### 4.6 Update `backend/api/routes/router.py`

Import the new route module:

```py
from api.routes.ai_tools import color_restore, object_remove, rembg, upscale, cartoonize
```

Include it:

```py
router.include_router(cartoonize.router)
```

Recommended grouping:

```py
# Real AI tool routes
router.include_router(upscale.router)
router.include_router(rembg.router)
router.include_router(color_restore.router)
router.include_router(object_remove.router)
router.include_router(cartoonize.router)
```

---

### 4.7 Create `backend/services/ai/features/cartoonizer.py`

For a normal model:

```py
from services.ai.pipeline.image_pipeline_service import ImagePipelineService
from provider.ai_provider import BaseAIProvider
from core.config import settings


class Cartoonizer(ImagePipelineService):
    def __init__(
        self,
        provider: BaseAIProvider = None,
        max_concurrent_remote_jobs: int = settings.MAX_CONCURRENT_JOBS,
    ):
        super().__init__(
            model_type="cartoonize",
            provider=provider,
            max_concurrent_remote_jobs=max_concurrent_remote_jobs,
        )

    async def run_cartoonize(self, safe_filename: str, job_id: str) -> bool:
        return await self.run(safe_filename, job_id)


cartoonizer = Cartoonizer()
```

For a model that needs custom inputs, override `_process_with_ai()`:

```py
async def _process_with_ai(self, image_stream: io.BytesIO, **kwargs) -> str:
    model_id = ModelRegistry.get_replicate_id(self.model_type)
    params = self.build_model_params(**kwargs)

    image_key = ModelRegistry.get_input_key(self.model_type)
    params[image_key] = image_stream
    params["style"] = kwargs.get("style", "anime")

    try:
        return await self.provider.run_model(model_id, params=params)
    finally:
        image_stream.close()
```

---

### 4.8 Update `backend/services/job/job_manager.py`

Import the feature service:

```py
from services.ai.features.cartoonizer import cartoonizer
```

Add the processor method:

```py
@classmethod
async def process_cartoonize(
    cls,
    job_id: str,
    safe_filename: str,
    client_ip: str,
) -> None:
    async def _run():
        return await cartoonizer.run_cartoonize(
            safe_filename=safe_filename,
            job_id=job_id,
        )

    await cls._process_feature(
        job_id,
        safe_filename,
        client_ip,
        "cartoonize",
        _run,
    )
```

For extra args:

```py
@classmethod
async def process_cartoonize(
    cls,
    job_id: str,
    safe_filename: str,
    style: str,
    client_ip: str,
) -> None:
    async def _run():
        return await cartoonizer.run_cartoonize(
            safe_filename=safe_filename,
            job_id=job_id,
            style=style,
        )

    await cls._process_feature(
        job_id,
        safe_filename,
        client_ip,
        "cartoonize",
        _run,
    )
```

---

### 4.9 Modify `backend/services/job/job_initializer.py` only for special upload flows

Normal features do not need changes here.

Special features like Object Remove need extra upload URLs.

Example:

```py
response = {
    "job_id": job_id,
    "safe_filename": safe_filename,
    "upload_url": StorageService.generate_upload_sas(safe_filename),
}

if feature == "objectremove":
    mask_filename = f"{job_id}-mask.png"
    response["mask_filename"] = mask_filename
    response["mask_upload_url"] = StorageService.generate_upload_sas(mask_filename)

return response
```

Why this matters:

- The frontend uploads directly to Azure
- The backend must provide all upload URLs before `/start`
- `/start` should receive filenames, not raw files

---

## 5. Frontend Files

### Frontend checklist

For a normal AI feature, usually edit or create these files:

```txt
frontend/src/services/features/<feature>Service.js
frontend/src/services/apiService.js
frontend/src/hooks/actions/use<Feature>Actions.js
frontend/src/hooks/pipeline/use<Feature>Pipeline.js
frontend/src/components/Workspace/controls/AiFeatures/<Feature>Controls.jsx
frontend/src/pages/AiFeatures/<Feature>Page.jsx
frontend/src/data/feature/<feature>Marketing.jsx
frontend/src/routes.js
frontend/src/data/navConfig.js
frontend/src/config.js
```

For special tools with custom UI or extra uploads, also check:

```txt
frontend/src/services/base/apiClient.js
frontend/src/components/Workspace/AiFeatureWorkspace.jsx
frontend/src/components/Workspace/display/<Feature>CustomEditor.jsx
```

---

## 6. Frontend Step-by-Step

Assume we are adding:

```txt
feature key: cartoonize
display name: Cartoonize
```

---

### 6.1 Create `frontend/src/services/features/cartoonizeService.js`

For normal features:

```js
import { apiClient } from '../base/apiClient';

export async function cartoonizeImage(file, turnstileToken) {
  return apiClient.executeAiJob('cartoonize', file, turnstileToken);
}
```

For options:

```js
export async function cartoonizeImage(file, turnstileToken, style = 'anime') {
  return apiClient.executeAiJob('cartoonize', file, turnstileToken, { style });
}
```

For extra uploads, create a custom method inside `apiClient.js`, then call it here.

---

### 6.2 Update `frontend/src/services/apiService.js`

Import the service:

```js
import { cartoonizeImage } from './features/cartoonizeService';
```

Add it to the exported object:

```js
export const apiService = {
  uploadImage,
  removeBackgroundImage,
  colorRestoreImage,
  removeObjectFromImage,
  cartoonizeImage,
  submitFeedback,
  pollResult,
};
```

---

### 6.3 Create `frontend/src/hooks/actions/useCartoonizeActions.js`

```js
import { useCallback } from 'react';
import { apiService } from '@/services/apiService';
import { useActions } from './useActions';

export function useCartoonizeActions(props) {
  const apiCallFn = useCallback(
    (file, token) => apiService.cartoonizeImage(file, token),
    [],
  );

  return useActions({ ...props, apiCallFn });
}
```

With options:

```js
const apiCallFn = useCallback(
  (file, token, options = {}) => {
    return apiService.cartoonizeImage(file, token, options.style);
  },
  [],
);
```

---

### 6.4 Create `frontend/src/hooks/pipeline/useCartoonizePipeline.js`

```js
import { usePipeline } from './usePipeline';
import { useCartoonizeActions } from '../actions/useCartoonizeActions';

export function useCartoonizePipeline(setProgress) {
  return usePipeline(setProgress, useCartoonizeActions, 'cartoonize');
}
```

The feature key matters because it controls:

- localStorage keys
- usage limit calls
- progress persistence
- session persistence

---

### 6.5 Create `frontend/src/components/Workspace/controls/AiFeatures/CartoonizeControls.jsx`

```jsx
import PropTypes from 'prop-types';
import BaseToolControls from './BaseToolControls';

export default function CartoonizeControls(props) {
  const getProgressText = () => {
    if (props.progress < 30) return 'Uploading to Cloud GPUs...';
    if (props.progress < 50) return 'Analyzing image style...';
    if (props.progress < 70) return 'Running cartoon model...';
    if (props.progress < 90) return 'Refining outlines and colors...';
    if (props.progress < 99) return 'Polishing final output...';
    return 'Finalizing download...';
  };

  return (
    <BaseToolControls
      {...props}
      progressText={getProgressText()}
      submitText="Cartoonize Image"
    />
  );
}

CartoonizeControls.propTypes = {
  isProcessing: PropTypes.bool.isRequired,
  isWaitingForToken: PropTypes.bool.isRequired,
  resultUrl: PropTypes.string,
  progress: PropTypes.number.isRequired,
  jobId: PropTypes.string,
  handleCancel: PropTypes.func.isRequired,
  handleProcess: PropTypes.func.isRequired,
  turnstileRef: PropTypes.object.isRequired,
  setTurnstileToken: PropTypes.func.isRequired,
};
```

---

### 6.6 Create `frontend/src/pages/AiFeatures/CartoonizeImage.jsx`

```jsx
import { useState } from 'react';
import AiFeatureWorkspace from '@/components/Workspace/AiFeatureWorkspace';
import CartoonizeControls from '@/components/Workspace/controls/AiFeatures/CartoonizeControls';
import { useCartoonizePipeline } from '@/hooks/pipeline/useCartoonizePipeline';
import { useSimulatedProgress } from '@/hooks/workspace/Core/useSimulatedProgress';
import { marketingProps } from '@/data/feature/cartoonizeMarketing';

export default function CartoonizeImage() {
  const [progress, setProgress] = useState(0);

  const {
    selectedFile,
    previewUrl,
    isProcessing,
    resultUrl,
    jobId,
    handleFileSelect,
    handleCancel,
    handleProcess,
    turnstileRef,
    setTurnstileToken,
    turnstileToken,
    appAlert,
    setAppAlert,
    usesRemaining,
    resetTimestamp,
    isLoading,
    maxLimit,
    isWaitingForToken,
  } = useCartoonizePipeline(setProgress);

  useSimulatedProgress(
    isProcessing,
    setProgress,
    turnstileToken,
    'cartoonize',
  );

  return (
    <AiFeatureWorkspace
      selectedFile={selectedFile}
      previewUrl={previewUrl}
      isProcessing={isProcessing}
      resultUrl={resultUrl}
      jobId={jobId}
      usesRemaining={usesRemaining}
      resetTimestamp={resetTimestamp}
      isLoading={isLoading}
      maxLimit={maxLimit}
      appAlert={appAlert}
      setAppAlert={setAppAlert}
      featureName="cartoonize"
      featureText="cartoon generations"
      marketingProps={marketingProps}
      onFileSelect={handleFileSelect}
      onCancel={handleCancel}
      leftControls={
        <CartoonizeControls
          isProcessing={isProcessing}
          isWaitingForToken={isWaitingForToken}
          resultUrl={resultUrl}
          progress={progress}
          jobId={jobId}
          handleCancel={handleCancel}
          handleProcess={handleProcess}
          turnstileRef={turnstileRef}
          setTurnstileToken={setTurnstileToken}
        />
      }
      downloadPrefix="Cartoonized-"
      rightPanelClassName="flex-1 min-h-105 relative rounded-2xl border border-white/50 bg-white/30 flex items-center justify-center overflow-hidden shadow-inner"
      previewImageClassName={`max-h-96 w-full object-contain p-2 transition-all duration-700 ${isProcessing ? 'scale-105 opacity-60 blur-sm' : 'opacity-100'}`}
      resultContainerClassName="w-full h-full"
    />
  );
}
```

---

### 6.7 Create `frontend/src/data/feature/cartoonizeMarketing.jsx`

```jsx
export const marketingProps = {
  subtitle: 'Turn photos into clean cartoon-style artwork with AI.',
  features: [
    {
      title: 'AI stylization',
      description: 'Transform normal photos into stylized cartoon images.',
    },
    {
      title: 'Fast workflow',
      description: 'Upload, process, and download from one workspace.',
    },
    {
      title: 'Private by design',
      description: 'Temporary uploads and generated results expire automatically.',
    },
  ],
  steps: [
    {
      title: 'Upload image',
      description: 'Choose a JPG, PNG, or WEBP image.',
    },
    {
      title: 'Run AI',
      description: 'PixelForge sends your image to the selected AI model.',
    },
    {
      title: 'Download result',
      description: 'Save the cartoonized image when processing finishes.',
    },
  ],
};
```

---

### 6.8 Update `frontend/src/routes.js`

Add:

```js
{
  path: '/cartoonize',
  component: React.lazy(() => import('./pages/AiFeatures/CartoonizeImage')),
},
```

---

### 6.9 Update `frontend/src/data/navConfig.js`

Add the tool to the AI Features section:

```js
{
  id: 'cartoonize',
  to: "/cartoonize",
  label: "Cartoonize",
  isAi: true,
  icon: "M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c.251.023.501.05.75.082m-.75-.082a24.301 24.301 0 00-4.5 0m4.5 0v.001M5 14.5h14M5 14.5l-1.5 6h17l-1.5-6M14.25 3.104v5.714c0 .597.237 1.169.659 1.591L19 14.5",
  desc: "Turn photos into stylized cartoon artwork.",
}
```

---

### 6.10 Update `frontend/src/config.js`

Add feature limit:

```js
export const FEATURE_LIMITS = {
  default: 3,
  upscale: 3,
  rembg: 5,
  colorrestore: 5,
  objectremove: 5,
  cartoonize: 5,
  feedback: 3,
};
```

Add result label:

```js
export const RESULT_LABELS = {
  upscale: 'Upscaled',
  rembg: 'Background Removed',
  colorrestore: 'Color Restored',
  objectremove: 'Object Removed',
  cartoonize: 'Cartoonized',
};
```

---

## 7. Special Feature Patterns

### Pattern A: Normal one-image feature

Use this when the AI model only needs one image.

```txt
Frontend:
executeAiJob(feature, file, token)

Backend:
/{feature}/init returns:
- job_id
- safe_filename
- upload_url

/{feature}/start receives:
- job_id
- safe_filename
```

Examples:

```txt
upscale
rembg
colorrestore
```

---

### Pattern B: Feature with options

Use this when the AI model needs one image plus settings.

```txt
Frontend:
executeAiJob(feature, file, token, { style })

Backend:
/{feature}/start receives:
- job_id
- safe_filename
- style
```

Examples:

```txt
cartoonize with style
upscale with scale
```

---

### Pattern C: Feature with extra generated upload

Use this when the model needs more than one file.

```txt
Frontend:
custom execute<Feature>Job(file, extraBlob, token)

Backend:
/{feature}/init returns:
- job_id
- safe_filename
- upload_url
- extra_filename
- extra_upload_url

/{feature}/start receives:
- job_id
- safe_filename
- extra_filename
```

Example:

```txt
objectremove
```

---

## 8. Manual Backend Testing

Example PowerShell flow:

```powershell
$init = Invoke-RestMethod `
  -Uri "http://127.0.0.1:8000/cartoonize/init" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"cf_turnstile_response":"manual_test_bypass","filename":"test.png"}'
```

Upload to Azure:

```powershell
Invoke-WebRequest `
  -Uri $init.upload_url `
  -Method Put `
  -Headers @{
    "x-ms-blob-type" = "BlockBlob"
    "Content-Type" = "image/png"
  } `
  -InFile "test.png"
```

Start job:

```powershell
$body = @{
  job_id = $init.job_id
  safe_filename = $init.safe_filename
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://127.0.0.1:8000/cartoonize/start" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

Poll result:

```powershell
$result = Invoke-RestMethod "http://127.0.0.1:8000/result/$($init.job_id)"
$result
$result.url
```

Open result:

```powershell
Start-Process $result.url
```

---

## 9. Frontend Testing Checklist

After adding the feature:

```txt
[ ] Route opens correctly
[ ] Navbar item appears
[ ] Upload works
[ ] Turnstile token is received
[ ] Init endpoint is called
[ ] Azure upload succeeds
[ ] Start endpoint is called
[ ] Progress bar appears
[ ] Polling reaches ready
[ ] Result viewer displays before/after
[ ] Download button works
[ ] Cancel/reset works
[ ] Usage limit updates
[ ] Refresh/session restore does not break
```

---

## 10. Backend Testing Checklist

```txt
[ ] Feature key exists in FeatureType
[ ] Display name exists in FEATURE_DISPLAY_NAMES
[ ] Daily limit exists in FEATURE_LIMITS
[ ] Model exists in ModelRegistry
[ ] Start request schema exists
[ ] Route file exists
[ ] Route is included in router.py
[ ] JobManager processor exists
[ ] Feature service exists
[ ] /{feature}/init works
[ ] Azure upload works
[ ] /{feature}/start works
[ ] /result/{job_id} returns processing then ready
[ ] Failed jobs are marked failed
[ ] Usage is refunded on failure
```

---

## 11. Common Mistakes

### 1. Feature key mismatch

Example bug:

```txt
frontend uses: object-remove
backend expects: objectremove
```

Fix:

```txt
Use objectremove everywhere for the backend feature key.
Use /object-remove only as the user-facing route if desired.
```

---

### 2. Adding a route file but forgetting `router.py`

If the file exists but is not included in `backend/api/routes/router.py`, FastAPI will never register it.

---

### 3. Adding frontend route but forgetting nav

The page may work directly by URL, but users cannot discover it.

---

### 4. Adding backend feature limit but forgetting frontend limit

The backend may allow usage, but the frontend usage card can show the wrong number.

---

### 5. Special feature forced into `executeAiJob()`

Do not force multi-upload features into the standard one-upload helper.

Use a specialized method:

```js
executeObjectRemoveJob(file, maskBlob, token)
```

---

### 6. Missing result label

If `RESULT_LABELS[featureName]` is missing, the result viewer falls back to `Processed`.

That is safe, but less polished.

---

## 12. Safe Git Workflow

Always work from a feature branch.

```bash
git switch master
git pull origin master
git switch -c feat/cartoonize
```

After implementation:

```bash
git status
git add .
git commit -m "feat: add cartoonize AI feature"
git push -u origin feat/cartoonize
```

Then open a pull request into `master`.

Before merging:

```bash
git diff master...feat/cartoonize --stat
git log --oneline --decorate -5
```

---

## 13. Quick Reference

### Normal AI feature

```txt
Backend:
[ ] domain/ai_features.py
[ ] core/config.py
[ ] core/model_registry.py
[ ] api/schemas/ai_tools.py
[ ] api/routes/ai_tools/<feature>.py
[ ] api/routes/router.py
[ ] services/ai/features/<feature_service>.py
[ ] services/job/job_manager.py

Frontend:
[ ] services/features/<feature>Service.js
[ ] services/apiService.js
[ ] hooks/actions/use<Feature>Actions.js
[ ] hooks/pipeline/use<Feature>Pipeline.js
[ ] components/Workspace/controls/AiFeatures/<Feature>Controls.jsx
[ ] pages/AiFeatures/<Feature>Page.jsx
[ ] data/feature/<feature>Marketing.jsx
[ ] routes.js
[ ] data/navConfig.js
[ ] config.js
```

### Special AI feature

```txt
Also check:
[ ] backend/services/job/job_initializer.py
[ ] frontend/src/services/base/apiClient.js
[ ] frontend/src/components/Workspace/AiFeatureWorkspace.jsx
[ ] frontend/src/components/Workspace/display/<Feature>CustomEditor.jsx
```

---

## 14. Maintainability Notes

PixelForge is maintainable because:

- Backend route groups are separated by purpose
- Shared AI job routes handle init, polling, and usage
- Each AI feature owns only its start route
- Model configuration is centralized
- Frontend API calls are centralized
- Frontend pipelines reuse shared state and polling logic
- Workspace UI is reusable through `AiFeatureWorkspace`
- Special tools can override preview UI through `previewOverride`

As the number of features grows, consider creating a stronger shared feature registry to reduce repeated edits across:

```txt
frontend/src/routes.js
frontend/src/data/navConfig.js
frontend/src/config.js
frontend/src/services/apiService.js
backend/domain/ai_features.py
backend/core/config.py
backend/core/model_registry.py
```

A registry-based approach would make adding future features faster and safer.
