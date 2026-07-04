# 在 PixelForge 中添加新的 AI 功能

> 一份实用的开发者指南，用于在 PixelForge 中添加新的 AI 图像功能，同时不破坏已有的 backend/frontend pipeline。

---

## 1. 核心 Workflow

PixelForge 的 AI 功能应该遵循统一流程：

```txt
POST /{feature}/init
  -> verify Turnstile
  -> check usage limit
  -> create job_id
  -> create safe_filename
  -> return Azure upload_url

Frontend 直接上传图片到 Azure

POST /{feature}/start
  -> reserve queue slot
  -> increment usage
  -> run AI job in background

GET /result/{job_id}
  -> poll until ready, failed, or processing
```

普通功能只需要 **一张 uploaded image**。

特殊功能，例如 Object Remove，需要额外文件：

```txt
Object Remove:
original image + generated mask image -> AI model
```

---

## 2. 命名规则

选择一个稳定的 `feature key`，并在 backend、frontend、usage、storage、API 中保持一致。

例子：

| Purpose | Example |
|---|---|
| Feature key | `cartoonize` |
| Display name | `Cartoonize` |
| Frontend route | `/cartoonize` |
| Init endpoint | `/cartoonize/init` |
| Start endpoint | `/cartoonize/start` |
| Usage key | `cartoonize` |
| Storage key prefix | `cartoonize_*` |

推荐格式：

```txt
lowercase
no spaces
no uppercase
short but clear
```

好的例子：

```txt
upscale
rembg
colorrestore
objectremove
cartoonize
denoise
```

避免：

```txt
ObjectRemove
object-remove
object remove
removeObjectAI
```

注意：

```txt
Backend feature key 可以是 objectremove。
Frontend route 可以是 /object-remove。
```

不要混淆内部 feature key 和公开 URL。

---

## 3. Backend Checklist

普通的一图 AI 功能，通常需要编辑或创建：

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

特殊功能如果有额外上传或自定义 model input，还需要检查：

```txt
backend/services/job/job_initializer.py
backend/services/ai/features/<feature_service>.py
```

---

## 4. Backend Step-by-Step

示例功能：

```txt
feature key: cartoonize
display name: Cartoonize
```

### 4.1 更新 `backend/domain/ai_features.py`

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

为什么重要：

- FastAPI 会验证 `/{feature}/init` 中的 `{feature}`
- 不支持的 feature 会更早被拒绝
- Display name 可以用于 user-facing backend response

### 4.2 更新 `backend/core/config.py`

```py
CARTOONIZE_DAILY_USAGE_LIMIT: int = 5
```

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

会被这些 endpoint 使用：

```txt
GET /usage?feature=cartoonize
POST /cartoonize/init
POST /cartoonize/start
```

### 4.3 更新 `backend/core/model_registry.py`

普通 model：

```py
"cartoonize": {
    "replicate_id": "owner/model:version_hash",
    "input_key": "image",
},
```

带参数的 model：

```py
"cartoonize": {
    "replicate_id": "owner/model:version_hash",
    "input_key": "image",
    "style_key": "style",
},
```

这样 model ID 不会散落在多个文件中。

### 4.4 更新 `backend/api/schemas/ai_tools.py`

简单功能：

```py
class StartCartoonizeRequest(BaseModel):
    job_id: str
    safe_filename: str
```

带 options：

```py
class StartCartoonizeRequest(BaseModel):
    job_id: str
    safe_filename: str
    style: str = "anime"
```

带额外文件：

```py
class StartObjectRemoveRequest(BaseModel):
    job_id: str
    safe_filename: str
    mask_filename: str
```

### 4.5 创建 `backend/api/routes/ai_tools/cartoonize.py`

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

如果有 extra args：

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

最终调用顺序：

```txt
reserve_and_queue_job(...)
  -> process_func(job_id, safe_filename, *process_args, client_ip)
```

### 4.6 更新 `backend/api/routes/router.py`

```py
from api.routes.ai_tools import color_restore, object_remove, rembg, upscale, cartoonize
```

```py
router.include_router(cartoonize.router)
```

### 4.7 创建 `backend/services/ai/features/cartoonizer.py`

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

如果需要自定义输入，override `_process_with_ai()`：

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

### 4.8 更新 `backend/services/job/job_manager.py`

```py
from services.ai.features.cartoonizer import cartoonizer
```

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

带 extra args：

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

### 4.9 只有特殊上传流程才更新 `backend/services/job/job_initializer.py`

普通功能不需要改这个文件。

Object Remove 需要额外 upload URL：

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

---

## 5. Frontend Checklist

普通 AI 功能通常需要创建或编辑：

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

如果功能有 custom UI、mask canvas 或额外上传，还要检查：

```txt
frontend/src/services/base/apiClient.js
frontend/src/components/Workspace/AiFeatureWorkspace.jsx
frontend/src/components/Workspace/display/<Feature>CustomEditor.jsx
frontend/src/data/modals/WorkspaceModals.jsx
```

---

## 6. Frontend Step-by-Step

### 6.1 创建 `frontend/src/services/features/cartoonizeService.js`

```js
import { apiClient } from '../base/apiClient';

export async function cartoonizeImage(file, turnstileToken) {
  return apiClient.executeAiJob('cartoonize', file, turnstileToken);
}
```

带 options：

```js
export async function cartoonizeImage(file, turnstileToken, style = 'anime') {
  return apiClient.executeAiJob('cartoonize', file, turnstileToken, { style });
}
```

有额外上传时，在 `apiClient.js` 中创建 custom method。

### 6.2 更新 `frontend/src/services/apiService.js`

```js
import { cartoonizeImage } from './features/cartoonizeService';
```

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

### 6.3 创建 `frontend/src/hooks/actions/useCartoonizeActions.js`

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

带 options：

```js
const apiCallFn = useCallback(
  (file, token, options = {}) => {
    return apiService.cartoonizeImage(file, token, options.style);
  },
  [],
);
```

### 6.4 创建 `frontend/src/hooks/pipeline/useCartoonizePipeline.js`

```js
import { usePipeline } from './usePipeline';
import { useCartoonizeActions } from '../actions/useCartoonizeActions';

export function useCartoonizePipeline(setProgress) {
  return usePipeline(setProgress, useCartoonizeActions, 'cartoonize');
}
```

Feature key 控制：

```txt
localStorage keys
usage limit calls
progress persistence
session persistence
```

### 6.5 创建 `frontend/src/components/Workspace/controls/AiFeatures/CartoonizeControls.jsx`

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

### 6.6 创建 `frontend/src/pages/AiFeatures/CartoonizeImage.jsx`

可以使用其他 AI page 作为 template。

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

  useSimulatedProgress(isProcessing, setProgress, turnstileToken, 'cartoonize');

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

### 6.7 创建 `frontend/src/data/feature/cartoonizeMarketing.jsx`

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

### 6.8 更新 `frontend/src/routes.js`

```js
{
  path: '/cartoonize',
  component: React.lazy(() => import('./pages/AiFeatures/CartoonizeImage')),
},
```

### 6.9 更新 `frontend/src/data/navConfig.js`

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

### 6.10 更新 `frontend/src/config.js`

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

### Pattern B: Feature with options

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

### Pattern C: Feature with extra generated upload

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

## 8. Cloudflare Turnstile Precautions

Turnstile 用于保护 AI endpoint，避免 abuse。添加新功能时，不要绕过这条 flow，除非是明确的 local testing。

### 8.1 Turnstile Checklist

```txt
[ ] Frontend sends cf_turnstile_response during POST /{feature}/init
[ ] Backend verifies token in JobInitializer
[ ] VITE_TURNSTILE_SITE_KEY exists in Vercel/frontend env
[ ] CLOUDFLARE_TURNSTILE_SECRET_KEY exists in backend env
[ ] ALLOWED_ORIGINS includes frontend production/preview domains
[ ] Redeploy frontend/backend after changing env vars
```

### 8.2 About `401` from `challenges.cloudflare.com`

DevTools 中可能出现：

```txt
GET https://challenges.cloudflare.com/... 401 Unauthorized
```

这通常来自 Cloudflare Private Access Token challenge。这个错误不一定表示 Turnstile 完全失败。

更重要的是检查：

```txt
[ ] Did Turnstile onSuccess run?
[ ] Does turnstileToken exist?
[ ] Was POST /{feature}/init sent?
[ ] Did backend return 200 from /{feature}/init?
```

如果 `/init` 根本没有发出，问题通常是 frontend validation，而不是 Turnstile。

如果 `/init` 发出了但失败，再检查 secret key、domain、allowed origins 和 backend response。

### 8.3 Local bypass

Local testing 可以使用：

```json
{
  "cf_turnstile_response": "manual_test_bypass",
  "filename": "test.png"
}
```

只能在以下条件启用：

```txt
ENVIRONMENT = local/dev/development
ALLOW_TURNSTILE_TEST_BYPASS = true
```

不要在 production 启用 bypass。

### 8.4 Preview deployment

如果使用 Vercel Preview Deployment：

```txt
[ ] Make sure preview URL is allowed by Turnstile/domain config
[ ] Make sure backend CORS allows preview URL
[ ] Make sure preview env vars are correct
```

Production/preview debug 顺序：

```txt
1. Open DevTools Network
2. Check if /{feature}/init was sent
3. Check if Turnstile token exists
4. Check if backend received request
5. Check if Azure upload succeeded
6. Check if /{feature}/start was sent
```

---

## 9. Manual Backend Testing

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

## 10. Testing Checklist

### Frontend

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
[ ] Result viewer displays
[ ] Download button works
[ ] Cancel/reset works
[ ] Usage limit updates
[ ] Refresh/session restore is safe
[ ] User-friendly validation appears for missing input
```

For special features like Object Remove:

```txt
[ ] User cannot process without mask
[ ] missing_mask modal appears if user forgot to paint
[ ] maskBlob is created after painting
[ ] Original image and mask image are both uploaded
```

### Backend

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

```txt
frontend uses: object-remove
backend expects: objectremove
```

Use:

```txt
objectremove for backend feature key
/object-remove only for public frontend route
```

### 2. Created route file but forgot `router.py`

If the route file is not included, FastAPI will not register the endpoint.

### 3. Added frontend route but forgot nav

The page can open by URL, but users cannot discover it.

### 4. Backend limit exists but frontend limit is missing

The usage card may show the wrong value.

### 5. Special feature forced into `executeAiJob()`

Do not force multi-upload features into the one-upload helper.

Use:

```js
executeObjectRemoveJob(file, maskBlob, token)
```

### 6. Missing result label

If `RESULT_LABELS[featureName]` is missing, the result viewer falls back to `Processed`.

### 7. User validation uses server error modal

If the user forgot mask/object selection, do not show `Processing Failed`.

Use a dedicated alert:

```js
setAppAlert({ show: true, type: 'missing_mask' });
```

Then show a friendly modal in `WorkspaceModals.jsx`.

---

## 12. Safe Git Workflow

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

Open a PR into `master`.

Before merge:

```bash
git diff master...feat/cartoonize --stat
git log --oneline --decorate -5
```

Vercel note:

```txt
Production deployment usually updates after merge/push to master.
Preview deployment is not always the same as production.
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
[ ] frontend/src/data/modals/WorkspaceModals.jsx
```

---

## 14. Maintainability Notes

PixelForge is maintainable because:

- Backend routes are grouped by purpose
- Shared AI job routes handle init, polling, and usage
- Each AI feature owns only its start route
- Model registry is centralized
- Frontend API calls are centralized
- Frontend pipeline reuses state and polling logic
- Workspace UI is reusable through `AiFeatureWorkspace`
- Special tools can override preview through `previewOverride`
- Modals can be triggered from a feature page with only `setAppAlert({ type })`

If the number of features grows, consider a shared feature registry to reduce manual edits in:

```txt
frontend/src/routes.js
frontend/src/data/navConfig.js
frontend/src/config.js
frontend/src/services/apiService.js
backend/domain/ai_features.py
backend/core/config.py
backend/core/model_registry.py
```
