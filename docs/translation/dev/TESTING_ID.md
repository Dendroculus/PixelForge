# Pengujian PixelForge

Dokumen ini mencatat skrip verifikasi lokal untuk backend PixelForge, pipeline AI, batas penggunaan, dan pemeriksaan build.

Skrip ini ditujukan untuk development lokal. Skrip mengasumsikan backend berjalan secara lokal dan pengaturan bypass test lokal sudah diaktifkan jika diperlukan.

> **Catatan khusus Windows:** skrip PowerShell di `scripts/testing/*.ps1` dan file helper lokal `.bat` ditujukan untuk environment development Windows. Pengguna macOS/Linux perlu mem-port perintah ke Bash atau menjalankan pengecekan API yang setara secara manual.

---

## Pemeriksaan API Backend

Jalankan dari root repository.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\testing\check_backend_limits_and_usage.ps1
```

Memverifikasi:

- `/api/limits`
- `/api/usage`
- Bentuk limit fitur
- Konsistensi response runtime limit

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\testing\check_backend_error_responses.ps1
```

Memverifikasi response error backend yang terstruktur.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\testing\check_backend_invalid_image_upload.ps1
```

Memverifikasi bahwa data gambar upload yang invalid gagal secara aman dengan error terstruktur.

---

## Pemeriksaan Batas Penggunaan

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\testing\check_backend_usage_limit.ps1
```

Memverifikasi bahwa semua fitur AI mengembalikan response `RATE_LIMITED` yang terstruktur saat kuota penggunaan habis.

Skrip ini sementara mengisi tabel usage lokal, memanggil endpoint init, memvalidasi response, lalu mengembalikan state usage current-hour sebelumnya.

Fitur yang dicakup:

- `upscale`
- `rembg`
- `colorrestore`
- `objectremove`

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

Object Remove membutuhkan source image dan mask image.

Mask image harus memiliki dimensi yang sama dengan source image:

- Pixel hitam = area yang dipertahankan
- Pixel putih = area yang ingin dihapus

Jika `object_remove_test_mask.png` belum ada, buat mask sederhana dari root repository:

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

## Pemeriksaan Build Frontend

```powershell
cd E:\GitHub\pixelforge\frontend
npm run build
```

Build yang berhasil memastikan bundle frontend production dapat dikompilasi.

---

## Pemeriksaan Compile Backend

```powershell
cd E:\GitHub\pixelforge\backend
python -m compileall .
```

Agar output tidak terlalu ramai, exclude virtual environment:

```powershell
python -m compileall api app core database domain limiter provider repository services utils
```

---

## Pemeriksaan Manual UI

Setelah perubahan backend dan frontend, verifikasi manual:

1. Upload gambar di atas public pixel limit ke tool AI
2. Pastikan gambar di-resize sebelum upload
3. Pastikan alert resize muncul
4. Pastikan preview tetap berjalan
5. Pastikan job AI tetap mencapai status ready

Pemeriksaan ini memvalidasi flow auto-resize browser-side yang tidak dijalankan oleh skrip API PowerShell langsung.
