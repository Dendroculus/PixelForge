# Pengujian PixelForge

Panduan ini berisi command verifikasi lokal untuk API backend, pipeline AI, usage limit, build frontend, dan workflow yang sensitif terhadap dokumentasi.

Script PowerShell di `scripts/testing/` ditujukan untuk development lokal Windows. Script mengasumsikan backend berjalan lokal dan bypass Turnstile lokal diaktifkan bila diperlukan:

```env
ENVIRONMENT=development
ALLOW_TURNSTILE_TEST_BYPASS=true
```

Jangan pernah mengaktifkan manual bypass di production.

---

## Menjalankan Aplikasi

Dari root repository:

```powershell
.\scripts\start_app.bat
```

Atau jalankan masing-masing secara manual:

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

## Pemeriksaan API Backend

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\testing\check_backend_limits_and_usage.ps1
```

Memverifikasi `/api/limits`, `/api/usage`, bentuk feature limit, dan konsistensi runtime limit.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\testing\check_backend_error_responses.ps1
```

Memverifikasi structured error response backend.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\testing\check_backend_invalid_image_upload.ps1
```

Memverifikasi bahwa data gambar invalid gagal secara aman dengan structured error.

---

## Pemeriksaan Usage Limit

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\testing\check_backend_usage_limit.ps1
```

Script sementara mengisi usage table lokal, memanggil init endpoint, memvalidasi response `RATE_LIMITED`, lalu mengembalikan state jam berjalan sebelumnya.

Fitur yang dicakup:

- `upscale`
- `rembg`
- `colorrestore`
- `objectremove`

Karena identitas quota saat ini berbasis IP, pemeriksaan ini memvalidasi behavior backend tetapi tidak menghilangkan keterbatasan shared NAT/shared proxy.

---

## Pemeriksaan Keberhasilan AI

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

Object Remove memerlukan source image dan mask dengan ukuran yang sama:

- Pixel hitam: pertahankan area
- Pixel putih: hapus area

Buat simple center mask bila diperlukan:

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

Kemudian jalankan success script object removal menggunakan argument source dan mask yang didukung `check_ai_feature_success.ps1`.

---

## Pemeriksaan Alur Turnstile

Untuk setiap job AI:

1. Pastikan frontend menerima token Turnstile.
2. Pastikan `POST /api/{feature}/init` memverifikasinya.
3. Selesaikan atau gagalkan job.
4. Mulai job lain dan pastikan token baru diminta.

Kirim feedback sekali dan pastikan verifikasi dilakukan terpisah. Pada environment non-development, menghapus secret sementara harus menyebabkan verifikasi fail-closed, bukan melewati perlindungan.

---

## Pemeriksaan Frontend

```powershell
npm --prefix frontend run lint
npm --prefix frontend run build
```

---

## Pemeriksaan Compile Backend

```powershell
Push-Location .\backend
python -m compileall api app core database domain limiter provider repository services utils
Pop-Location
```

---

## Pemeriksaan Manual UI

1. Upload gambar di atas public pixel limit ke tool AI.
2. Pastikan gambar di-resize sebelum upload dan alert resize muncul.
3. Pastikan preview tetap benar.
4. Pastikan job AI mencapai result ready.
5. Jalankan job kedua dan pastikan Turnstile memperoleh token baru.
6. Test dari dua network saat memeriksa behavior proxy/IP; jangan menganggap direct peer platform terkelola adalah IP pengunjung.

---

## Pemeriksaan Final Repository

```powershell
git diff --check
git status --short
```

Cari command lama atau personal absolute path dalam dokumentasi:

```powershell
Get-ChildItem -Recurse -File -Include *.md,*.bat,*.ps1 |
  Where-Object { $_.Name -notlike 'TESTING*.md' -and $_.Name -ne 'PACKAGE_NOTES.md' } |
  Select-String -Pattern 'python -m venv \.venv|uvicorn main:app --reload$|E:\\GitHub\\pixelforge'
```

Command seharusnya tidak mengembalikan match dokumentasi yang outdated.
