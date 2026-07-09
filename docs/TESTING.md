# PixelForge Testing

This document lists local verification scripts for PixelForge backend, AI pipeline, usage limits, and build checks.

These scripts are intended for local development. They assume the backend is running locally and local test bypass settings are enabled where required.

> **Windows-only note:** the PowerShell scripts in `scripts/testing/*.ps1` and local `.bat` helper files are intended for Windows development environments. macOS/Linux users should port the commands to Bash or run equivalent API checks manually.

---

## Backend API Checks

Run from the repository root.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\testing\check_backend_limits_and_usage.ps1
```

Verifies:

- `/api/limits`
- `/api/usage`
- Feature limit shape
- Runtime limit response consistency

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\testing\check_backend_error_responses.ps1
```

Verifies structured backend error responses.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\testing\check_backend_invalid_image_upload.ps1
```

Verifies that invalid uploaded image data fails safely with a structured error.

---

## Usage Limit Checks

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\testing\check_backend_usage_limit.ps1
```

Verifies that all AI features return a structured `RATE_LIMITED` response when their usage quota is exhausted.

The script temporarily seeds the local usage table, calls the init endpoint, validates the response, and restores the previous current-hour usage state.

Covered features:

- `upscale`
- `rembg`
- `colorrestore`
- `objectremove`

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

Object Remove requires both a source image and a mask image.

The mask image must match the source image dimensions:

- Black pixels = keep area
- White pixels = area to remove

If `object_remove_test_mask.png` does not exist yet, generate a simple center mask from the repository root:

```powershell
@'
from pathlib import Path
from PIL import Image, ImageDraw

src = Path("frontend/public/demo/object_remove_before.png")
mask = Path("frontend/public/demo/object_remove_test_mask.png")

if not src.exists():
    raise SystemExit(f"Missing source image: {src}")

img = Image.open(src)
w, h = img.size

out = Image.new("L", (w, h), 0)
draw = ImageDraw.Draw(out)

box_w = int(w * 0.28)
box_h = int(h * 0.28)
left = (w - box_w) // 2
top = (h - box_h) // 2
right = left + box_w
bottom = top + box_h

draw.ellipse((left, top, right, bottom), fill=255)

mask.parent.mkdir(parents=True, exist_ok=True)
out.save(mask)

print(f"Created mask: {mask}")
print(f"Size: {w}x{h}")
'@ | .\backend\venv\Scripts\python.exe
```
---

## Frontend Build Check

```powershell
cd E:\GitHub\pixelforge\frontend
npm run build
```

A successful build confirms that the production frontend bundle compiles.

---

## Backend Compile Check

```powershell
cd E:\GitHub\pixelforge\backend
python -m compileall .
```

For less noise, exclude the virtual environment:

```powershell
python -m compileall api app core database domain limiter provider repository services utils
```

---

## Manual UI Check

After backend and frontend changes, manually verify:

1. Upload an image above the public pixel limit to an AI tool
2. Confirm the image is resized before upload
3. Confirm the resize alert appears
4. Confirm the preview still works
5. Confirm the AI job still reaches a ready result

This validates the browser-side auto-resize flow that direct PowerShell API scripts do not exercise.
