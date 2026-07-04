# Menambahkan Fitur AI Baru ke PixelForge

> Panduan developer untuk menambahkan fitur AI image baru ke PixelForge tanpa merusak pipeline backend/frontend yang sudah ada.

---

## 1. Workflow Utama

Semua fitur AI PixelForge sebaiknya mengikuti alur ini:

```txt
POST /{feature}/init
  -> verify Turnstile
  -> check usage limit
  -> create job_id
  -> create safe_filename
  -> return Azure upload_url

Frontend upload image langsung ke Azure

POST /{feature}/start
  -> reserve queue slot
  -> increment usage
  -> run AI job in background

GET /result/{job_id}
  -> poll sampai status ready, failed, atau processing
```

Fitur normal hanya membutuhkan satu uploaded image.

Fitur khusus seperti Object Remove membutuhkan file tambahan:

```txt
Object Remove:
original image + generated mask image -> AI model
```

---

## 2. Naming Rules

Pilih satu `feature key` dan gunakan konsisten di backend, frontend, usage, storage, dan API.

Contoh:

| Purpose | Example |
|---|---|
| Feature key | `cartoonize` |
| Display name | `Cartoonize` |
| Frontend route | `/cartoonize` |
| Init endpoint | `/cartoonize/init` |
| Start endpoint | `/cartoonize/start` |
| Usage key | `cartoonize` |
| Storage key prefix | `cartoonize_*` |

Gunakan format:

```txt
lowercase
tanpa spasi
tanpa uppercase
singkat tapi jelas
```

Contoh bagus:

```txt
upscale
rembg
colorrestore
objectremove
cartoonize
denoise
```

Hindari:

```txt
ObjectRemove
object-remove
object remove
removeObjectAI
```

Catatan:

```txt
Backend feature key boleh objectremove.
Frontend route boleh /object-remove.
```

Jangan campur internal feature key dengan URL publik.

---

## 3. Backend Checklist

Untuk fitur AI normal satu gambar, biasanya edit atau buat:

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

Untuk fitur khusus dengan upload tambahan atau input custom, cek juga:

```txt
backend/services/job/job_initializer.py
backend/services/ai/features/<feature_service>.py
```

---

## 4. Backend Step-by-Step

Contoh fitur:

```txt
feature key: cartoonize
display name: Cartoonize
```

### 4.1 Update `backend/domain/ai_features.py`

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

Kenapa penting:

- FastAPI validasi `{feature}` dari route seperti `/{feature}/init`
- Feature yang tidak didukung ditolak lebih awal
- Display name bisa dipakai untuk response user-facing

### 4.2 Update `backend/core/config.py`

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

Dipakai oleh:

```txt
GET /usage?feature=cartoonize
POST /cartoonize/init
POST /cartoonize/start
```

### 4.3 Update `backend/core/model_registry.py`

Model normal:

```py
"cartoonize": {
    "replicate_id": "owner/model:version_hash",
    "input_key": "image",
},
```

Model dengan parameter tambahan:

```py
"cartoonize": {
    "replicate_id": "owner/model:version_hash",
    "input_key": "image",
    "style_key": "style",
},
```

Tujuannya supaya model ID tidak tersebar di banyak file.

### 4.4 Update `backend/api/schemas/ai_tools.py`

Fitur sederhana:

```py
class StartCartoonizeRequest(BaseModel):
    job_id: str
    safe_filename: str
```

Fitur dengan opsi:

```py
class StartCartoonizeRequest(BaseModel):
    job_id: str
    safe_filename: str
    style: str = "anime"
```

Fitur dengan file tambahan:

```py
class StartObjectRemoveRequest(BaseModel):
    job_id: str
    safe_filename: str
    mask_filename: str
```

### 4.5 Create `backend/api/routes/ai_tools/cartoonize.py`

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

Jika ada extra args:

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

Urutan akhirnya:

```txt
reserve_and_queue_job(...)
  -> process_func(job_id, safe_filename, *process_args, client_ip)
```

### 4.6 Update `backend/api/routes/router.py`

```py
from api.routes.ai_tools import color_restore, object_remove, rembg, upscale, cartoonize
```

```py
router.include_router(cartoonize.router)
```

### 4.7 Create `backend/services/ai/features/cartoonizer.py`

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

Jika butuh input custom, override `_process_with_ai()`:

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

### 4.8 Update `backend/services/job/job_manager.py`

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

Dengan extra args:

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

### 4.9 Update `backend/services/job/job_initializer.py` hanya untuk special upload

Fitur normal tidak perlu ubah file ini.

Object Remove membutuhkan upload URL tambahan:

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

Untuk fitur AI normal, biasanya buat atau edit:

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

Untuk fitur dengan custom UI, mask canvas, atau upload tambahan, cek juga:

```txt
frontend/src/services/base/apiClient.js
frontend/src/components/Workspace/AiFeatureWorkspace.jsx
frontend/src/components/Workspace/display/<Feature>CustomEditor.jsx
frontend/src/data/modals/WorkspaceModals.jsx
```

---

## 6. Frontend Step-by-Step

### 6.1 Create `frontend/src/services/features/cartoonizeService.js`

```js
import { apiClient } from '../base/apiClient';

export async function cartoonizeImage(file, turnstileToken) {
  return apiClient.executeAiJob('cartoonize', file, turnstileToken);
}
```

Dengan opsi:

```js
export async function cartoonizeImage(file, turnstileToken, style = 'anime') {
  return apiClient.executeAiJob('cartoonize', file, turnstileToken, { style });
}
```

Untuk fitur extra upload, buat custom method di `apiClient.js`.

### 6.2 Update `frontend/src/services/apiService.js`

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

Dengan options:

```js
const apiCallFn = useCallback(
  (file, token, options = {}) => {
    return apiService.cartoonizeImage(file, token, options.style);
  },
  [],
);
```

### 6.4 Create `frontend/src/hooks/pipeline/useCartoonizePipeline.js`

```js
import { usePipeline } from './usePipeline';
import { useCartoonizeActions } from '../actions/useCartoonizeActions';

export function useCartoonizePipeline(setProgress) {
  return usePipeline(setProgress, useCartoonizeActions, 'cartoonize');
}
```

Feature key mengontrol:

```txt
localStorage keys
usage limit calls
progress persistence
session persistence
```

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

### 6.6 Create `frontend/src/pages/AiFeatures/CartoonizeImage.jsx`

Gunakan page AI lain sebagai template.

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

### 6.8 Update `frontend/src/routes.js`

```js
{
  path: '/cartoonize',
  component: React.lazy(() => import('./pages/AiFeatures/CartoonizeImage')),
},
```

### 6.9 Update `frontend/src/data/navConfig.js`

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

### 6.10 Update `frontend/src/config.js`

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

Turnstile melindungi endpoint AI dari abuse. Saat menambah fitur baru, jangan bypass flow ini kecuali untuk local testing yang jelas.

### 8.1 Checklist Turnstile

```txt
[ ] Frontend mengirim cf_turnstile_response saat POST /{feature}/init
[ ] Backend memverifikasi token di JobInitializer
[ ] VITE_TURNSTILE_SITE_KEY tersedia di Vercel/frontend env
[ ] CLOUDFLARE_TURNSTILE_SECRET_KEY tersedia di backend env
[ ] ALLOWED_ORIGINS mencakup domain frontend production/preview
[ ] Setelah mengubah env var, redeploy frontend/backend
```

### 8.2 Tentang error `401` dari `challenges.cloudflare.com`

Di DevTools, kamu bisa melihat:

```txt
GET https://challenges.cloudflare.com/... 401 Unauthorized
```

Ini sering berasal dari Cloudflare Private Access Token challenge. Error ini tidak selalu berarti Turnstile gagal total.

Yang lebih penting dicek:

```txt
[ ] Apakah Turnstile onSuccess terpanggil?
[ ] Apakah turnstileToken terisi?
[ ] Apakah POST /{feature}/init terkirim?
[ ] Apakah backend return 200 dari /{feature}/init?
```

Jika `/init` tidak pernah terkirim, masalah kemungkinan besar di frontend validation, bukan Turnstile.

Jika `/init` terkirim tapi gagal, baru cek secret key, domain, allowed origins, dan backend response.

### 8.3 Local bypass

Untuk local testing:

```json
{
  "cf_turnstile_response": "manual_test_bypass",
  "filename": "test.png"
}
```

Hanya aktifkan jika:

```txt
ENVIRONMENT = local/dev/development
ALLOW_TURNSTILE_TEST_BYPASS = true
```

Jangan aktifkan bypass di production.

### 8.4 Preview deployment

Jika memakai Vercel Preview Deployment:

```txt
[ ] Pastikan preview URL diizinkan oleh konfigurasi Turnstile/domain
[ ] Pastikan backend CORS mengizinkan preview URL
[ ] Pastikan env var preview sesuai kebutuhan
```

Urutan debug production/preview:

```txt
1. Buka DevTools Network
2. Cek apakah /{feature}/init terkirim
3. Cek apakah Turnstile token ada
4. Cek apakah backend menerima request
5. Cek apakah Azure upload berhasil
6. Cek apakah /{feature}/start terpanggil
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

Upload ke Azure:

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
[ ] Route terbuka
[ ] Navbar item muncul
[ ] Upload berhasil
[ ] Turnstile token diterima
[ ] Init endpoint terpanggil
[ ] Azure upload sukses
[ ] Start endpoint terpanggil
[ ] Progress bar muncul
[ ] Polling mencapai ready
[ ] Result viewer tampil
[ ] Download button bekerja
[ ] Cancel/reset bekerja
[ ] Usage limit update
[ ] Refresh/session restore aman
[ ] Validasi user-friendly muncul untuk input yang kurang
```

Untuk fitur khusus seperti Object Remove:

```txt
[ ] User tidak bisa process tanpa mask
[ ] Modal missing_mask muncul jika user lupa paint
[ ] Setelah paint, maskBlob berhasil dibuat
[ ] Original image dan mask image ter-upload
```

### Backend

```txt
[ ] Feature key ada di FeatureType
[ ] Display name ada di FEATURE_DISPLAY_NAMES
[ ] Daily limit ada di FEATURE_LIMITS
[ ] Model ada di ModelRegistry
[ ] Start request schema ada
[ ] Route file ada
[ ] Route include di router.py
[ ] JobManager processor ada
[ ] Feature service ada
[ ] /{feature}/init bekerja
[ ] Azure upload bekerja
[ ] /{feature}/start bekerja
[ ] /result/{job_id} return processing lalu ready
[ ] Failed jobs marked failed
[ ] Usage refunded saat gagal
```

---

## 11. Common Mistakes

### 1. Feature key mismatch

```txt
frontend uses: object-remove
backend expects: objectremove
```

Gunakan:

```txt
objectremove untuk backend feature key
/object-remove hanya untuk frontend route publik
```

### 2. Route file dibuat tapi lupa `router.py`

Jika file route tidak di-include, FastAPI tidak akan mendaftarkan endpoint.

### 3. Frontend route ada tapi nav lupa

Page bisa dibuka langsung, tapi user tidak bisa menemukannya.

### 4. Backend limit ada tapi frontend limit lupa

Usage card bisa menampilkan angka yang salah.

### 5. Special feature dipaksa ke `executeAiJob()`

Jangan paksa multi-upload feature ke helper satu upload.

Gunakan:

```js
executeObjectRemoveJob(file, maskBlob, token)
```

### 6. Missing result label

Jika `RESULT_LABELS[featureName]` tidak ada, result viewer fallback ke `Processed`.

### 7. User validation memakai server error modal

Jika user lupa mask/object selection, jangan tampilkan `Processing Failed`.

Gunakan alert khusus:

```js
setAppAlert({ show: true, type: 'missing_mask' });
```

Lalu tampilkan modal user-friendly di `WorkspaceModals.jsx`.

---

## 12. Safe Git Workflow

```bash
git switch master
git pull origin master
git switch -c feat/cartoonize
```

Setelah implementasi:

```bash
git status
git add .
git commit -m "feat: add cartoonize AI feature"
git push -u origin feat/cartoonize
```

Buka PR ke `master`.

Sebelum merge:

```bash
git diff master...feat/cartoonize --stat
git log --oneline --decorate -5
```

Vercel note:

```txt
Production deployment biasanya update setelah merge/push ke master.
Preview deployment tidak selalu sama dengan production.
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

PixelForge maintainable karena:

- Backend route dipisah berdasarkan tujuan
- Shared AI job routes menangani init, polling, dan usage
- Setiap AI feature punya start route sendiri
- Model registry tersentralisasi
- Frontend API calls tersentralisasi
- Frontend pipeline reuse state dan polling logic
- Workspace UI reusable lewat `AiFeatureWorkspace`
- Special tools bisa override preview dengan `previewOverride`
- Modal bisa dipicu dari feature page hanya dengan `setAppAlert({ type })`

Jika fitur makin banyak, pertimbangkan shared feature registry untuk mengurangi edit manual di:

```txt
frontend/src/routes.js
frontend/src/data/navConfig.js
frontend/src/config.js
frontend/src/services/apiService.js
backend/domain/ai_features.py
backend/core/config.py
backend/core/model_registry.py
```
