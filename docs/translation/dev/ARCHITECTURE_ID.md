<div align="center">

[EN](../../ARCHITECTURE.md) | [中文](./ARCHITECTURE_ZH.md) | ID

</div>

# Arsitektur PixelForge

PixelForge adalah studio gambar open-source yang menyediakan alat gambar berbasis browser dan pemrosesan gambar berbantuan AI melalui frontend React dan backend FastAPI.

Sistem ini dirancang dengan pemisahan tanggung jawab yang jelas:

- **Frontend:** antarmuka pengguna, alat client-side, alur upload, UI progres, dan polling.
- **Backend:** inisialisasi job yang aman, usage limit, URL upload cloud, orkestrasi job AI, eksekusi provider, penyimpanan hasil, dan cleanup.
- **Layanan cloud:** Azure Blob Storage untuk upload/hasil sementara, Replicate untuk inferensi AI, PostgreSQL untuk pelacakan usage, Cloudflare Turnstile untuk proteksi bot, dan Discord webhook untuk notifikasi feedback.

---

## 1. Gambaran Sistem Tingkat Tinggi

```mermaid
flowchart LR
    User[User Browser] --> FE[React Frontend]

    FE -->|Initialize job| API[FastAPI Backend]
    API -->|Verify token| Turnstile[Cloudflare Turnstile]
    API -->|Check quota| DB[(PostgreSQL)]
    API -->|Generate SAS URL| Azure[(Azure Blob Storage)]

    FE -->|Direct upload via SAS| Azure
    FE -->|Start job| API

    API --> Queue[Job Queue / Background Task]
    Queue --> Services[AI Feature Services]
    Services --> Provider[AI Provider Abstraction]
    Provider --> Replicate[Replicate Models]

    Services -->|Download AI output| OutputURL[Remote Output URL]
    Services -->|Save result| Azure

    FE -->|Poll status| API
    API -->|Check result/failure marker| Azure
    FE -->|Download result URL| Azure

    API --> Janitor[Janitor Service]
    Janitor -->|Cleanup expired blobs| Azure
    Janitor -->|Cleanup usage records| DB
```

---

## 2. Technology Stack

### Frontend

- React
- Vite
- React Router
- Tailwind CSS
- Framer Motion
- Cloudflare Turnstile widget
- Utilitas gambar client-side untuk alat non-AI

### Backend

- FastAPI
- Uvicorn
- Pydantic Settings
- SlowAPI rate limiting
- asyncpg
- Azure Blob Storage SDK
- Replicate Python SDK
- Pillow / utilitas validasi gambar
- httpx / aiohttp

### Infrastruktur dan Layanan Eksternal

- Azure Blob Storage
- PostgreSQL
- Replicate
- Cloudflare Turnstile
- Discord webhook
- Deployment frontend Vercel
- Deployment backend DigitalOcean

---

## 3. Struktur Repository

```txt
PixelForge/
├── backend/
│   ├── api/
│   │   ├── routes/
│   │   └── schemas/
│   ├── app/
│   │   ├── factory.py
│   │   ├── lifecycle.py
│   │   ├── logging/
│   │   ├── middleware.py
│   │   └── routers.py
│   ├── core/
│   │   ├── config.py
│   │   ├── model_registry.py
│   │   └── security.py
│   ├── database/
│   │   └── db_pool.py
│   ├── domain/
│   │   └── ai_features.py
│   ├── limiter/
│   │   ├── rate_limiter.py
│   │   └── usage_service.py
│   ├── provider/
│   │   ├── ai_provider.py
│   │   └── replicate_client.py
│   ├── repository/
│   │   └── usage_repo.py
│   ├── services/
│   │   ├── ai/
│   │   ├── azure/
│   │   ├── job/
│   │   ├── maintenance/
│   │   ├── notification/
│   │   └── security/
│   ├── scripts/
│   └── utils/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── content/
│   │   │   ├── bot/
│   │   │   ├── feature/
│   │   │   ├── modals/
│   │   │   └── navigation/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── config.js
│   │   ├── main.jsx
│   │   └── routes.js
│   ├── public/
│   └── vite.config.js
│
└── docs/
```

---

## 4. Arsitektur Frontend

Frontend disusun di sekitar komponen workspace yang reusable dan halaman feature-specific.

### 4.1 Application Shell

`frontend/src/App.jsx` memiliki tanggung jawab utama layout aplikasi:

- Browser routing
- Navigasi global
- Global header
- Footer dan legal modal
- FAQ chatbot widget
- Suspense loader untuk halaman lazy-loaded

Routes dikelompokkan berdasarkan kategori di:

```txt
frontend/src/routes/
```

File route root tetap dipertahankan sebagai facade:

```txt
frontend/src/routes.js
```

`App.jsx` hanya mengimpor facade tersebut, sementara facade menggabungkan route array dari kategori seperti AI features, smart edit tools, optimize tools, utilities, landing pages, dan special pages. Setiap route tetap menggunakan lazy import terhadap page component agar initial bundle size lebih kecil.

---

### 4.2 Kategori Halaman

Halaman frontend dikelompokkan berdasarkan jenis tool:

```txt
pages/
├── AiFeatures/
│   ├── UpscaleImage.jsx
│   ├── RemoveBackground.jsx
│   ├── ColorRestoration.jsx
│   └── ObjectRemover.jsx
├── SmartEdit/
│   ├── ImageEditor.jsx
│   ├── ResizeImage.jsx
│   ├── CropImage.jsx
│   └── RotateFlip.jsx
├── Optimize/
│   ├── CompressImage.jsx
│   ├── ConvertFormat.jsx
│   └── MetadataWorkspace.jsx
├── Utilities/
│   ├── ColorPalette.jsx
│   └── WatermarkAdder.jsx
└── Special/
    ├── ComingSoon.jsx
    ├── FaqChatbotWidget.jsx
    └── NotFound.jsx
```

---

### 4.3 Halaman Fitur AI

Halaman fitur AI menggunakan shared workspace component:

```txt
components/Workspace/AiFeatureWorkspace.jsx
```

Setiap halaman AI menghubungkan bagian khusus fitur ke shared workspace:

| Page | Pipeline Hook | Controls | Feature Key |
|---|---|---|---|
| `UpscaleImage.jsx` | `useUpscalePipeline` | `UpscaleControls` | `upscale` |
| `RemoveBackground.jsx` | `useRemBGPipeline` | `RemoveBgControls` | `rembg` |
| `ColorRestoration.jsx` | `useColorRestorePipeline` | `ColorRestoreControls` | `colorrestore` |
| `ObjectRemover.jsx` | `useObjectRemovePipeline` | `ObjectRemoveControls` + mask canvas | `objectremove` |

Halaman AI sengaja dibuat tipis. Halaman hanya memiliki state UI spesifik seperti progress, scale, brush size, dan mask readiness. Shared pipeline hooks memiliki state upload, polling, cancellation, Turnstile token, result URL, dan usage-limit.

---

### 4.4 Frontend Pipeline Hooks

Workflow AI diabstraksikan melalui pipeline dan action hooks:

```txt
hooks/
├── actions/
│   ├── useActions.js
│   ├── useUpscaleActions.js
│   ├── useRemBGActions.js
│   ├── useColorRestoreActions.js
│   └── useObjectRemoveActions.js
├── pipeline/
│   ├── usePipeline.js
│   ├── useUpscalePipeline.js
│   ├── useRemBGPipeline.js
│   ├── useColorRestorePipeline.js
│   └── useObjectRemovePipeline.js
└── auth/
    └── useUsageLimit.js
```

Pipeline generik menangani perilaku bersama:

- State file terpilih
- State preview URL
- Penanganan Turnstile token
- Start job
- Polling
- State result URL
- Cancel behavior
- State tampilan usage limit
- State alert

Feature-specific action hook menangani API call dan perbedaan payload.

---

### 4.5 Client-Side Tools

Tool non-AI sebagian besar berjalan di browser dan menggunakan client hooks/utilities:

```txt
hooks/client/
hooks/workspace/
utils/image/
utils/file/
  fileValidation.js
  validators/
    errorMessages.js
    runtimeLimits.js
    mimeValidation.js
    imageMetadata.js
    imageOptimization.js
    resolutionValidation.js
    grayscaleValidation.js
utils/storage/
```

`utils/file/fileValidation.js` tetap menjadi entrypoint publik untuk validasi file, sedangkan `utils/file/validators/` berisi modul helper yang lebih fokus untuk runtime limits, pemeriksaan MIME, pembacaan metadata gambar, optimisasi resolusi di browser, pemeriksaan resolusi, pemeriksaan grayscale, dan pesan validasi.

Untuk upload AI, frontend dapat melakukan downscale pada gambar yang melewati batas pixel publik sebelum mengunggahnya ke Azure. Ini meningkatkan pengalaman pengguna dan mengurangi beban provider, tetapi validasi backend tetap menjadi batas keamanan utama karena validasi browser dapat dilewati.

Contoh:

- Image resize
- Image crop
- Rotate dan flip
- Compression
- Format conversion
- Metadata removal
- Watermark rendering
- Color palette extraction

Ini membuat operasi gambar ringan tetap cepat, privat, dan tidak bergantung pada job AI backend.

---

## 5. Arsitektur Backend

Backend mengikuti arsitektur FastAPI berlapis.

```txt
app factory
   ↓
middleware + routers
   ↓
routes / schemas
   ↓
services
   ↓
provider / repository / storage
   ↓
external systems
```

---

### 5.1 Application Factory

Aplikasi backend dibuat melalui:

```txt
backend/app/factory.py
```

Tanggung jawab:

- Mengonfigurasi logging
- Memvalidasi environment setting penting
- Membuat FastAPI app
- Mendaftarkan middleware
- Mendaftarkan routers
- Menambahkan behavior startup/shutdown melalui lifespan

---

### 5.2 Lifespan

Lifecycle aplikasi dikelola di:

```txt
backend/app/lifecycle.py
```

Startup:

- Inisialisasi PostgreSQL connection pool
- Menjalankan janitor background task

Shutdown:

- Membatalkan janitor task
- Menutup PostgreSQL pool

---

### 5.3 Middleware

Middleware dikonfigurasi di:

```txt
backend/app/middleware.py
```

Perilaku yang dikonfigurasi:

- Request logging
- CORS
- SlowAPI rate-limit exception handling

---

### 5.4 Routes

Routes dikelompokkan berdasarkan concern:

```txt
backend/api/routes/
├── router.py
├── ai_tools/
│   ├── upscale.py
│   ├── rembg.py
│   ├── color_restore.py
│   └── object_remove.py
├── jobs/
│   └── ai_jobs.py
├── ops/
│   └── health.py
└── public/
    └── feedback.py
```

Endpoint job bersama:

| Endpoint | Tujuan |
|---|---|
| `POST /{feature}/init` | Verifikasi client, cek quota, buat job ID, return SAS upload URL |
| `POST /upscale/start` | Queue upscale job |
| `POST /rembg/start` | Queue background-removal job |
| `POST /colorrestore/start` | Queue color-restoration job |
| `POST /objectremove/start` | Queue object-removal job |
| `GET /result/{job_id}` | Cek apakah result ready, failed, atau processing |
| `GET /usage?feature=...` | Return status usage saat ini |
| `POST /feedback` | Submit feedback ke Discord webhook |
| `GET /` | Health check |

---

## 6. Lifecycle Job AI

Job AI menggunakan workflow dua fase.

### Fase 1: Initialize

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant API as FastAPI
    participant CF as Turnstile
    participant DB as PostgreSQL
    participant Azure as Azure Blob

    FE->>API: POST /api/{feature}/init
    API->>CF: Verify Turnstile token
    API->>DB: Check 24h usage limit
    API->>API: Generate job_id and safe filename
    API->>Azure: Generate upload SAS URL
    API-->>FE: job_id, safe_filename, upload_url
```

Initialization tidak menjalankan model AI. Fase ini hanya menyiapkan upload yang aman dan memvalidasi bahwa request diperbolehkan.

Initialization mengecek apakah usage masih tersedia, tetapi tidak mengonsumsi usage. Usage baru di-reserve saat job dimulai, setelah tahap upload.

Verifikasi Turnstile dilakukan pada setiap initialization request. Token digunakan satu kali dalam alur aplikasi dan direset sebelum job berikutnya.

---

### Fase 2: Upload dan Start

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant Azure as Azure Blob
    participant API as FastAPI
    participant Queue as JobManager
    participant AI as AI Service
    participant Replicate as Replicate
    participant DB as PostgreSQL

    FE->>FE: Validate image and auto-resize if above public pixel limit
    FE->>Azure: PUT image via SAS URL
    FE->>API: POST /api/{feature}/start
    API->>Queue: Reserve queue slot
    API->>DB: Increment usage counter
    API-->>FE: 202 Accepted

    Queue->>Azure: Download uploaded image
    Queue->>AI: Validate size and hard pixel safety cap
    Queue->>AI: Preprocess and downscale for provider limits if needed
    AI->>Replicate: Run model
    AI->>AI: Download model output
    AI->>AI: Postprocess result
    AI->>Azure: Save final result
    Queue->>Azure: Delete temporary upload
    Queue->>Queue: Release queue slot
```

---

### Fase 3: Poll Result

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant API as FastAPI
    participant Azure as Azure Blob

    loop Until complete
        FE->>API: GET /api/result/{job_id}
        API->>Azure: Check failure marker
        API->>Azure: Check result blob
        API-->>FE: processing / failed / ready
    end

    FE->>Azure: Download result via SAS URL
```

---

## 7. Layer Service Fitur AI

Service fitur AI berada di:

```txt
backend/services/ai/
├── features/
│   ├── upscale.py
│   ├── bg_remover.py
│   ├── color_restorer.py
│   └── object_remover.py
└── pipeline/
    └── image_pipeline_service.py
```

Semua fitur AI menggunakan `ImagePipelineService`, yang mengimplementasikan template method pipeline:

1. Download upload bytes dari Azure
2. Validasi ukuran byte input
3. Validasi resolusi input terhadap hard safety cap pixel backend
4. Preprocess input dan downscale untuk batas provider jika diperlukan
5. Eksekusi remote model
6. Download remote result
7. Postprocess output
8. Validasi output size
9. Simpan final result ke Azure

Feature services hanya override bagian yang mereka perlukan:

| Service | Perilaku Khusus |
|---|---|
| `AIUpscaler` | Downscale sebelum model, compress/cap output |
| `BackgroundRemover` | Downscale input, output WEBP dengan alpha |
| `ColorRestorer` | Validasi grayscale input sebelum model |
| `ObjectRemover` | Load mask image dan kirim image + mask ke model |

---

## 8. Arsitektur Provider

Abstraksi AI provider berada di:

```txt
backend/provider/
├── ai_provider.py
└── replicate_client.py
```

`BaseAIProvider` mendefinisikan kontrak provider.

`ReplicateProvider` mengimplementasikan kontrak tersebut menggunakan Replicate.

Desain ini memungkinkan provider masa depan, seperti RunPod atau layanan inference lain, ditambahkan tanpa menulis ulang feature services.

---

## 9. Model Registry

Identifier model dan key khusus provider dipusatkan di:

```txt
backend/core/model_registry.py
```

Registry menyimpan:

- Replicate model IDs
- Parameter default model
- Input key names
- Mask key names untuk object removal

Ini mencegah detail provider tersebar di seluruh aplikasi.

---

## 10. Arsitektur Storage

Azure Blob Storage dikelola melalui:

```txt
backend/services/azure/
├── storage.py
└── storage_utils.py
```

Backend menggunakan dua container:

| Container | Tujuan |
|---|---|
| `uploads` | Source image sementara dan mask object-removal |
| `results` | Output AI yang sudah diproses dan failure marker |

Tanggung jawab storage:

- Generate write-only upload SAS URL
- Generate read-only result SAS URL
- Download uploaded file untuk backend processing
- Save processed result
- Delete temporary uploads
- Store failure markers
- Cleanup expired results

---

## 11. Usage Limits dan Rate Limiting

Usage tracking dipisahkan di:

```txt
backend/limiter/
├── rate_limiter.py
└── usage_service.py

backend/repository/
└── usage_repo.py
```

### Rate Limiting

SlowAPI membatasi request menggunakan client IP yang dikembalikan oleh `get_real_client_ip()`.

Resolusi client IP menggunakan pendekatan fail-closed:

1. Saat `TRUST_PROXY_HEADERS=false`, forwarded header diabaikan dan direct socket peer (`request.client.host`) digunakan.
2. Saat proxy trust diaktifkan, direct peer harus termasuk dalam `TRUSTED_PROXY_CIDRS` atau `CLOUDFLARE_SUBNETS`; jika tidak, `CF-Connecting-IP`, `X-Forwarded-For`, dan `X-Real-IP` diabaikan.
3. `CF-Connecting-IP` hanya diterima ketika direct peer merupakan alamat Cloudflare yang sudah diverifikasi.
4. Selain itu, `X-Forwarded-For` diperiksa dari kanan ke kiri. Hanya hop proxy tepercaya yang dikonfigurasi yang dilewati, dan alamat tidak tepercaya pertama dianggap sebagai client.
5. `X-Real-IP` hanya digunakan sebagai fallback terakhir dari proxy yang sudah di-allowlist.
6. Alamat IP malformed dan CIDR yang tidak valid diabaikan serta dicatat di log.

Uvicorn sebaiknya dijalankan dengan `--no-proxy-headers` agar resolver aplikasi menerima socket peer asli, bukan nilai yang sudah ditulis ulang oleh server. Jangan pernah mempercayai `0.0.0.0/0`, `::/0`, atau konfigurasi forwarded header tanpa batas.

Ketika PixelForge berjalan di belakang managed platform dan proxy trust dinonaktifkan, beberapa pengunjung dapat terlihat menggunakan alamat proxy platform yang sama. Konfigurasi ini tahan terhadap spoofed header, tetapi dapat membuat rate limit dan usage limit berbasis IP kurang akurat. Proxy trust hanya boleh diaktifkan setelah direct proxy CIDR dan perilaku forwarded header platform sudah diverifikasi.

### Usage Limits

Usage saat ini dilacak berdasarkan resolved IP dan feature:

```txt
{client_ip}:{feature}
```

Usage record disimpan per jam di:

```sql
ip_usage_hourly
```

Ini mendukung rolling 24-hour usage window sekaligus menjaga cleanup tetap sederhana. Karena identity saat ini berbasis IP, pengguna di balik NAT, jaringan operator, atau reverse proxy yang sama dapat berbagi quota, sedangkan satu pengguna dapat memperoleh identity berbeda setelah berpindah jaringan.

---
## 12. Queue dan Job Management

Orkestrasi job ditangani oleh:

```txt
backend/services/job/
├── job_initializer.py
├── job_dispatcher.py
├── job_manager.py
└── queue_service.py
```

### JobInitializer

Menyiapkan job sebelum processing:

- Verify Turnstile
- Check daily usage
- Generate job ID
- Generate safe filenames
- Generate upload SAS URLs

### JobDispatcher

Digunakan oleh route handler untuk:

- Resolve client IP
- Reserve queue capacity
- Add background task
- Return response `202 Accepted` yang konsisten

### JobManager

Memiliki processing lifecycle:

- Reserve queue slot
- Increment usage
- Execute feature service
- Delete temporary upload
- Mark failed jobs
- Refund usage on failure
- Release queue slot

### QueueService

Melacak active jobs secara in-process dan mencegah backend process overload.

---

## 13. Arsitektur Keamanan

Keamanan PixelForge berfokus pada pembatasan abuse, upload tidak aman, dan exposure yang tidak disengaja.

### Bot Protection

Cloudflare Turnstile melindungi setiap AI job initialization dan setiap feedback submission.

Setiap request `POST /api/{feature}/init` harus menyertakan Turnstile token baru, lalu backend memverifikasi token tersebut ke Cloudflare sebelum mengecek quota atau memberikan metadata upload. Verifikasi yang berhasil sebelumnya tidak membuat approval yang dapat digunakan kembali. Frontend mereset token setelah job selesai, dibatalkan, atau gagal sehingga job berikutnya memperoleh token baru.

Feedback submission melakukan verifikasi Turnstile tersendiri. Manual bypass hanya tersedia untuk environment local/development yang diaktifkan secara eksplisit. Di production, Turnstile secret yang hilang dianggap sebagai configuration error dan verification akan fail closed.

### File Safety

Backend memvalidasi dan membatasi data upload melalui:

- MIME/type validation
- Safe generated filenames
- File size limits
- Public upload resolution limits
- Backend hard pixel safety limits
- Provider-oriented downscaling before AI execution
- Controlled CPU concurrency
- Azure SAS expiration

### Storage Safety

Frontend upload langsung ke Azure menggunakan short-lived SAS URL. Backend membuat filename menggunakan job ID sehingga tidak bergantung pada path dari client.

### Usage Protection

Feature usage limits mencegah satu client melakukan panggilan AI tanpa batas.

### Cleanup

Temporary upload dan result dihapus otomatis oleh job flow dan janitor service.

---

## 14. Feedback Flow

Feedback submission menggunakan:

```txt
frontend feedback form
   ↓
POST /api/feedback
   ↓
Turnstile verification
   ↓
usage/rate limit
   ↓
Discord webhook
```

Feedback service membuat Discord embed dan mengirimkannya secara asinkron.

---

## 15. Logging

Logging dikonfigurasi di:

```txt
backend/app/logging/
├── logging_config.py
├── logging_formatter.py
└── request_logging.py
```

Fitur logging:

- Format timestamp/severity/component yang konsisten
- Console output
- Optional rotating file logs
- Noise dari third-party libraries dikurangi
- Request duration logging

Contoh bentuk log:

```txt
2026-01-01 12:00:00 | INFO     | job-manager            | upscale done job=...
```

---

## 16. Cleanup dan Maintenance

Janitor service berjalan di lifespan aplikasi.

Tanggung jawab:

- Menghapus Azure result blobs yang kedaluwarsa
- Menghapus usage tracking records lama

Script reset untuk local development:

```txt
backend/scripts/reset_usage.py
```

hanya mereset usage counters di environment development yang diperbolehkan.

---

## 17. Konfigurasi Environment

Konfigurasi runtime dipusatkan di:

```txt
backend/core/config.py
```

Environment variable backend yang penting:

```txt
DATABASE_URL
AZURE_CONNECTION_STRING
REPLICATE_API_TOKEN
CLOUDFLARE_TURNSTILE_SECRET_KEY
DISCORD_WEBHOOK_URL
ALLOWED_ORIGINS

ENVIRONMENT
ALLOW_TURNSTILE_TEST_BYPASS

TRUST_PROXY_HEADERS
TRUSTED_PROXY_CIDRS
CLOUDFLARE_SUBNETS
REQUIRE_CLOUDFLARE_PROXY

LOG_LEVEL
LOG_TO_FILE
LOG_DIR
LOG_FILE_NAME
LOG_MAX_BYTES
LOG_BACKUP_COUNT
```

Environment variable frontend yang penting:

```txt
VITE_API_BASE_URL
VITE_TURNSTILE_SITE_KEY
VITE_DEBUG_API
```

Turnstile site key merupakan konfigurasi frontend yang boleh terlihat publik. Turnstile secret key, kredensial provider, database URL, Azure connection string, dan Discord webhook URL harus tetap berada di backend.

Default proxy yang aman:

```env
TRUST_PROXY_HEADERS=false
TRUSTED_PROXY_CIDRS=
CLOUDFLARE_SUBNETS=
REQUIRE_CLOUDFLARE_PROXY=false
```

Limit penting:

```txt
UPLOAD_RATE_LIMIT
POLL_RATE_LIMIT
FEEDBACK_RATE_LIMIT

UPSCALE_DAILY_USAGE_LIMIT
REMBG_DAILY_USAGE_LIMIT
COLOR_RESTORE_DAILY_USAGE_LIMIT
OBJECT_REMOVE_DAILY_USAGE_LIMIT
FEEDBACK_DAILY_USAGE_LIMIT

MAX_FILE_SIZE_MB
MAX_MEGAPIXELS
MAX_IMAGE_DIMENSION
MAX_CONCURRENT_JOBS
MAX_CONCURRENT_CPU_JOBS
```

---
## 18. Model Deployment

```mermaid
flowchart TD
    Browser[Browser] --> Vercel[Vercel Frontend]
    Vercel --> DO[DigitalOcean FastAPI Backend]

    DO --> Postgres[(PostgreSQL)]
    DO --> Azure[(Azure Blob Storage)]
    DO --> Replicate[Replicate]
    DO --> Cloudflare[Cloudflare Turnstile]
    DO --> Discord[Discord Webhook]
```

Frontend dan backend dideploy secara terpisah.

Frontend memanggil backend melalui API base URL yang dikonfigurasi. Backend menangani CORS menggunakan allowed origins yang dikonfigurasi.

---

## 19. Prinsip Desain

PixelForge mengikuti prinsip arsitektur berikut:

1. **Thin routes**  
   Route handler memvalidasi request shape dan mendelegasikan ke service.

2. **Shared pipelines**  
   Logika workflow AI yang berulang berada di shared image pipeline.

3. **Feature-specific hooks**  
   Halaman frontend tetap readable dengan mendelegasikan API workflow ke hooks.

4. **Provider abstraction**  
   AI services tidak bergantung langsung pada kode spesifik Replicate.

5. **Secure temporary storage**  
   Uploads dan results bersifat short-lived dan cleanup-aware.

6. **Fail-safe cleanup**  
   Failed jobs membuat markers, refund usage, dan release queue slots.

7. **Local development safety**  
   Script destruktif dijaga oleh environment checks.

---

## 20. Menambahkan Fitur AI Baru

Untuk menambahkan fitur AI baru:

1. Tambahkan feature key ke backend domain type.
2. Tambahkan usage limit ke settings.
3. Register model di `ModelRegistry`.
4. Buat feature service di `services/ai/features`.
5. Tambahkan request schemas jika diperlukan.
6. Tambahkan route di `api/routes/ai_tools`.
7. Masukkan route ke central API router.
8. Tambahkan frontend service/action hook.
9. Tambahkan frontend pipeline hook.
10. Tambahkan feature page dan controls.
11. Tambahkan navigation dan marketing data.
12. Tambahkan usage/progress labels.

Pola yang direkomendasikan:

```txt
backend feature service
   ↓
backend route
   ↓
frontend service function
   ↓
frontend action hook
   ↓
frontend pipeline hook
   ↓
frontend page
```

---

## 21. Catatan Arsitektur yang Diketahui

- `QueueService` bersifat process-local. Jika backend dijalankan dalam beberapa instance, setiap instance memiliki queue counter sendiri.
- Azure SAS URLs bersifat short-lived dan tidak boleh disimpan jangka panjang.
- Frontend tidak boleh mengirim secrets. Semua provider tokens dan Azure credentials tetap berada di backend.
- Client-side tools sebaiknya tetap browser-only kecuali membutuhkan AI processing.
- Direct upload menjaga transfer file besar agar tidak melewati request body backend.

---

## 22. Peta Dokumentasi

Dokumentasi PixelForge dikelompokkan berdasarkan audiens dan tujuan.

```txt
Dokumentasi komunitas root:
README.md
CONTRIBUTING.md
CODE_OF_CONDUCT.md
SECURITY.md
LICENSE

Dokumentasi developer:
docs/
├── ARCHITECTURE.md
├── ADDING_AI_FEATURE.md
├── assets/
│   ├── TECH_STACKS.png
│   └── tech_stacks_generator.html
└── translation/
    ├── landing/
    │   ├── README_ID.md
    │   └── README_CN.md
    ├── dev/
    │   ├── ADDING_AI_FEATURE_ID.md
    │   ├── ADDING_AI_FEATURE_ZH.md
    │   ├── ARCHITECTURE_ID.md
    │   └── ARCHITECTURE_ZH.md
    └── community/
        ├── CONTRIBUTING_ID.md
        ├── CONTRIBUTING_ZH.md
        ├── CODE_OF_CONDUCT_ID.md
        ├── CODE_OF_CONDUCT_ZH.md
        ├── SECURITY_ID.md
        └── SECURITY_ZH.md
```

Dokumentasi yang direkomendasikan untuk ditambahkan nanti:

```txt
docs/
├── API.md
├── DEPLOYMENT.md
└── TESTING.md
```

`ARCHITECTURE.md` sebaiknya tetap high-level. Detail implementasi sebaiknya berada di module docstring dan panduan khusus fitur.
