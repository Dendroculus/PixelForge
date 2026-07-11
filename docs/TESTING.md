# PixelForge Testing

This guide lists local verification commands for the backend API, AI pipeline, usage limits, frontend build, and documentation-sensitive workflows.

The PowerShell scripts under `scripts/testing/` are intended for local Windows development. They assume the backend is running locally and local Turnstile bypass settings are enabled where required:

```env
ENVIRONMENT=development
ALLOW_TURNSTILE_TEST_BYPASS=true
```

Never enable the manual bypass in production.

---

## Start the Application

From the repository root:

```powershell
.\scripts\start_app.bat
```

Or start each side manually:

```powershell
Push-Location .\backend
.\venv\Scripts\python.exe run.py
Pop-Location
```

```powershell
Push-Location .\frontend
npm run dev
Pop-Location
```

---

## Backend API Checks

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\testing\check_backend_limits_and_usage.ps1
```

Verifies `/api/limits`, `/api/usage`, feature-limit shape, and runtime-limit consistency.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\testing\check_backend_error_responses.ps1
```

Verifies structured backend error responses.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\testing\check_backend_invalid_image_upload.ps1
```

Verifies that invalid image data fails safely with a structured error.

---

## Usage-Limit Checks

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\testing\check_backend_usage_limit.ps1
```

The script temporarily seeds the local usage table, calls the init endpoint, validates the structured `RATE_LIMITED` response, and restores the previous current-hour state.

Covered features:

- `upscale`
- `rembg`
- `colorrestore`
- `objectremove`

Because the current quota identity is IP-based, these checks validate backend behavior but do not remove the known shared-NAT/shared-proxy limitation.

---

## AI Success Checks

Upscale:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\testing\check_ai_feature_success.ps1 `
  -Feature upscale
```

Remove Background:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\testing\check_ai_feature_success.ps1 `
  -Feature rembg `
  -FilePath ".\frontend\public\demo\rem_bg_before.jpg"
```

Restore Color:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\testing\check_ai_feature_success.ps1 `
  -Feature colorrestore `
  -FilePath ".\frontend\public\demo\res_color_before.jpg"
```

Object Remove requires a source image and a same-size mask:

- Black pixels: keep the area
- White pixels: remove the area

Generate a simple center mask when needed:

```powershell
@'
from pathlib import Path
from PIL import Image, ImageDraw

src = Path("frontend/public/demo/object_remove_before.png")
mask = Path("frontend/public/demo/object_remove_test_mask.png")

if not src.exists():
    raise SystemExit(f"Missing source image: {src}")

with Image.open(src) as img:
    width, height = img.size

out = Image.new("L", (width, height), 0)
draw = ImageDraw.Draw(out)
box_width = int(width * 0.28)
box_height = int(height * 0.28)
left = (width - box_width) // 2
top = (height - box_height) // 2
draw.ellipse(
    (left, top, left + box_width, top + box_height),
    fill=255,
)

mask.parent.mkdir(parents=True, exist_ok=True)
out.save(mask)
print(f"Created mask: {mask} ({width}x{height})")
'@ | .\backend\venv\Scripts\python.exe
```

Then run the object-removal success script with the source and mask arguments supported by `check_ai_feature_success.ps1`.

---

## Turnstile Flow Check

For every AI job:

1. Confirm the frontend receives a Turnstile token.
2. Confirm `POST /api/{feature}/init` verifies it.
3. Complete or fail the job.
4. Start another job and confirm a fresh token is requested.

Also submit feedback once and confirm it performs its own verification. In a non-development environment, temporarily removing the secret must cause verification to fail closed rather than bypassing protection.

---

## Frontend Checks

```powershell
npm --prefix frontend run lint
npm --prefix frontend run build
```

---

## Backend Compile Check

```powershell
Push-Location .\backend
python -m compileall api app core database domain limiter provider repository services utils
Pop-Location
```

---

## Manual UI Check

1. Upload an image above the public pixel limit to an AI tool.
2. Confirm it is resized before upload and the resize alert appears.
3. Confirm the preview remains correct.
4. Confirm the AI job reaches a ready result.
5. Run a second job and confirm Turnstile obtains a fresh token.
6. Test from two networks when checking proxy/IP behavior; do not assume a managed platform's direct peer is the visitor IP.

---

## Final Repository Checks

```powershell
git diff --check
git status --short
```

Search documentation for obsolete commands or personal absolute paths:

```powershell
Get-ChildItem -Recurse -File -Include *.md,*.bat,*.ps1 |
  Where-Object { $_.Name -notlike 'TESTING*.md' -and $_.Name -ne 'PACKAGE_NOTES.md' } |
  Select-String -Pattern 'python -m venv \.venv|uvicorn main:app --reload$|E:\\GitHub\\pixelforge'
```

The command should return no outdated documentation matches.
