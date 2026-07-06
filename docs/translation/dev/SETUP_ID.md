# Panduan Setup PixelForge

Panduan visual langkah demi langkah untuk mengonfigurasi layanan eksternal yang dibutuhkan PixelForge.

PixelForge menggunakan:

| Layanan | Digunakan untuk | Environment variable |
|---|---|---|
| Azure Blob Storage | Upload sementara dan hasil gambar | `AZURE_CONNECTION_STRING` |
| Replicate | Inferensi model AI | `REPLICATE_API_TOKEN` |
| Cloudflare Turnstile | Proteksi bot | `CLOUDFLARE_TURNSTILE_SITE_KEY`, `CLOUDFLARE_TURNSTILE_SECRET_KEY` |
| PostgreSQL | Pelacakan usage dan data backend | `DATABASE_URL` |
| Discord Webhook | Notifikasi feedback | `DISCORD_WEBHOOK_URL` |

> [!IMPORTANT]
> Jangan pernah commit secret, token, connection string, database URL, atau webhook URL asli ke Git.

---

## Daftar Isi

- [1. Setup Azure Blob Storage](#1-setup-azure-blob-storage)
- [2. Setup Replicate](#2-setup-replicate)
- [3. Setup Cloudflare Turnstile](#3-setup-cloudflare-turnstile)
- [4. Setup Database](#4-setup-database)
- [5. Setup Discord Webhook](#5-setup-discord-webhook)
- [6. Environment Variables Backend](#6-environment-variables-backend)
- [7. Environment Variables Frontend](#7-environment-variables-frontend)
- [8. Menjalankan PixelForge Secara Lokal](#8-menjalankan-pixelforge-secara-lokal)
- [9. Checklist Setup Akhir](#9-checklist-setup-akhir)
- [10. Masalah Umum](#10-masalah-umum)
- [11. Referensi Resmi](#11-referensi-resmi)

---

## 1. Setup Azure Blob Storage

PixelForge menggunakan Azure Blob Storage untuk menyimpan upload gambar sementara dan file hasil yang dihasilkan.

Container yang direkomendasikan:

```txt
uploads
results
```

Kedua container sebaiknya menggunakan akses **Private**.

---

### 1.1 Buka Azure Blob Storage

Buat Azure Storage Account jika belum punya.

![Pilih Azure Blob Storage](../../assets/setup/azure/AZURE_1.png)

---

### 1.2 Buat Storage Account

Isi nilai yang direkomendasikan di bawah ini. Region atau resource group dapat disesuaikan dengan deployment kamu.

![Buat Azure Storage Account](../../assets/setup/azure/AZURE_2.png)

| Field | Nilai yang disarankan | Catatan |
|---|---|---|
| Subscription | Subscription Azure kamu | `Azure for Students` bisa digunakan |
| Resource group | Existing atau baru | Buat baru jika diperlukan |
| Storage account name | `pixelforgexxxx` | Harus unik secara global, lowercase, dan tanpa spasi |
| Region | Paling dekat dengan backend | Contoh: `Southeast Asia` |
| Performance | `Standard` | Cukup untuk kebanyakan kebutuhan PixelForge |
| Redundancy | `Locally-redundant storage (LRS)` | Direkomendasikan untuk proyek pribadi dan biaya lebih rendah |

> [!TIP]
> **Kenapa LRS?**  
> PixelForge menyimpan upload dan hasil gambar sementara. Geo-redundant storage biasanya tidak diperlukan untuk use case ini dan bisa menambah biaya.

Setelah form diisi, klik:

```txt
Review + create
```

Lalu klik **Create** dan tunggu deployment selesai.

---

### 1.3 Buat Container `uploads` dan `results`

Setelah storage account selesai dibuat:

1. Buka Storage Account kamu.
2. Masuk ke **Data storage**.
3. Buka **Containers**.
4. Buat container berikut:

```txt
uploads
results
```

5. Set access level keduanya menjadi:

```txt
Private
```

![Buat Azure containers](../../assets/setup/azure/AZURE_3.png)

> [!IMPORTANT]
> Nama container harus sama dengan yang diharapkan backend. Jika backend menggunakan `uploads` dan `results`, gunakan nama tersebut persis.

---

### 1.4 Konfigurasi Lifecycle Cleanup

PixelForge hanya membutuhkan file upload dan hasil sementara. Lifecycle rule membantu menjaga storage tetap bersih dan mengurangi biaya.

1. Buka Storage Account kamu.
2. Masuk ke **Data management**.
3. Buka **Lifecycle management**.
4. Klik **Add rule**.

![Konfigurasi lifecycle Azure](../../assets/setup/azure/AZURE_4.png)

Kamu bisa mengatur rule secara manual, atau buka tab **Code view** dan paste JSON berikut:

```json
{
  "rules": [
    {
      "enabled": true,
      "name": "cleanup",
      "type": "Lifecycle",
      "definition": {
        "actions": {
          "baseBlob": {
            "delete": {
              "daysAfterModificationGreaterThan": 1
            }
          }
        },
        "filters": {
          "blobTypes": [
            "blockBlob"
          ],
          "prefixMatch": [
            "uploads/",
            "results/"
          ]
        }
      }
    }
  ]
}
```

> [!WARNING]
> Pastikan `prefixMatch` sesuai dengan nama container.  
> Untuk container bernama `uploads` dan `results`, gunakan:
>
> ```txt
> uploads/
> results/
> ```

---

### 1.5 Ambil Azure Connection String

Backend membutuhkan Azure connection string untuk membuat signed upload URL dan mengelola file hasil.

1. Buka Storage Account kamu.
2. Masuk ke **Security + networking**.
3. Buka **Access keys**.
4. Klik **Show**.
5. Copy **Connection string**.

![Copy Azure connection string](../../assets/setup/azure/AZURE_5.png)

Paste ke `backend/.env`:

```env
AZURE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=your_storage_account;AccountKey=your_secret_key;EndpointSuffix=core.windows.net
```

> [!CAUTION]
> Azure connection string adalah secret. Jangan masukkan ke `frontend/.env`, screenshot, public issue, README, atau kode yang di-commit. Jika terekspos, segera regenerate storage account key.

---

### 1.6 Konfigurasi Azure Blob CORS

Karena browser mengunggah file langsung ke Azure Blob Storage menggunakan signed URL, Azure Blob CORS harus mengizinkan origin frontend.

1. Buka Storage Account kamu.
2. Masuk ke **Settings**.
3. Buka **Resource sharing (CORS)**.
4. Pilih tab **Blob service**.
5. Tambahkan CORS rule.

![Konfigurasi Azure Blob CORS](../../assets/setup/azure/AZURE_6.png)

Nilai yang direkomendasikan untuk local development:

| Field | Value |
|---|---|
| Allowed origins | `http://localhost:5173`, `http://127.0.0.1:5173` |
| Allowed methods | `GET`, `PUT`, `HEAD`, `OPTIONS` |
| Allowed headers | `*` |
| Exposed headers | `*` |
| Max age | `86400` |

Contoh production:

```txt
https://your-frontend-domain.com
```

> [!IMPORTANT]
> Untuk Azure Blob CORS, masukkan **frontend origin** karena browser yang mengirim request ke Azure. Backend berkomunikasi dengan Azure secara server-to-server dan tidak diblokir oleh browser CORS.

Jangan gunakan trailing slash.

Benar:

```txt
https://your-frontend-domain.com
```

Salah:

```txt
https://your-frontend-domain.com/
```

---

## 2. Setup Replicate

PixelForge menggunakan Replicate untuk menjalankan model AI image.

### 2.1 Buat atau Copy Replicate API Token

1. Buka Replicate.
2. Masuk ke account settings.
3. Buka **API Tokens**.
4. Buat atau copy token.
5. Paste ke `backend/.env`.

![Copy Replicate API token](../../assets/setup/replicate/REPL_1.png)

Environment variable backend:

```env
REPLICATE_API_TOKEN=your_replicate_api_token
```

> [!CAUTION]
> Replicate API token adalah secret backend. Jangan masukkan ke `frontend/.env` atau mengeksposnya secara publik.

---

## 3. Setup Cloudflare Turnstile

PixelForge menggunakan Cloudflare Turnstile untuk melindungi inisialisasi job AI dan request feedback dari bot.

Kamu membutuhkan dua key:

| Key | Digunakan di | Secret? |
|---|---|---|
| Site key | Frontend dan konfigurasi backend | Tidak, aman untuk publik |
| Secret key | Backend saja | Ya, private |

---

### 3.1 Buat Turnstile Widget

1. Buka Cloudflare.
2. Masuk ke **Turnstile**.
3. Buat widget baru.
4. Set widget mode menjadi:

```txt
Invisible
```

![Buat Cloudflare Turnstile widget](../../assets/setup/cloudflare/CLOUDFLARE_1.png)

---

### 3.2 Copy Site Key dan Secret Key

Setelah widget dibuat:

1. Klik menu tiga titik pada widget.
2. Pilih **Edit**.
3. Copy **Site key**.
4. Copy **Secret key**.

Backend:

```env
CLOUDFLARE_TURNSTILE_SITE_KEY=your_turnstile_site_key
CLOUDFLARE_TURNSTILE_SECRET_KEY=your_turnstile_secret_key
```

Frontend:

```env
VITE_TURNSTILE_SITE_KEY=your_turnstile_site_key
```

> [!CAUTION]
> Turnstile secret key harus tetap backend-only. Jangan expose di kode frontend.

---

### 3.3 Konfigurasi Hostname Management

Tambahkan hostname tempat widget Turnstile dirender.

Hostname lokal yang direkomendasikan:

```txt
localhost
127.0.0.1
```

Hostname production yang direkomendasikan:

```txt
your-frontend-domain.com
```

Tambahkan domain backend hanya jika kamu juga merender Turnstile di halaman yang di-host oleh backend.

![Konfigurasi hostname Cloudflare Turnstile](../../assets/setup/cloudflare/CLOUDFLARE_2.png)

---

## 4. Setup Database

PixelForge menggunakan PostgreSQL untuk usage tracking dan data backend.

Kamu bisa menggunakan:

- PostgreSQL lokal
- DigitalOcean Managed PostgreSQL
- Railway PostgreSQL
- Neon
- Supabase
- Host lain yang kompatibel dengan PostgreSQL

Ambil database connection string dan paste ke `backend/.env`.

Contoh lokal:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/pixelforge
```

Contoh hosted:

```env
DATABASE_URL=postgresql://username:password@host:5432/database_name
```

> [!CAUTION]
> Database URL adalah secret karena biasanya berisi username dan password. Jangan expose secara publik.

---

## 5. Setup Discord Webhook

PixelForge dapat mengirim notifikasi feedback ke channel Discord menggunakan webhook.

### 5.1 Buat Discord Webhook

1. Buka Discord.
2. Klik kanan ikon server.
3. Buka **Server Settings**.
4. Buka **Integrations**.
5. Buka **Webhooks**.
6. Klik **Create Webhook**.
7. Pilih channel yang akan menerima notifikasi.
8. Copy webhook URL.

Paste ke `backend/.env`:

```env
DISCORD_WEBHOOK_URL=your_discord_webhook_url
```

> [!CAUTION]
> Discord webhook URL adalah secret. Siapa pun yang memiliki URL ini bisa mengirim pesan ke webhook tersebut. Jika terekspos, hapus atau regenerate segera.

---

## 6. Environment Variables Backend

Buat file ini:

```txt
backend/.env
```

Template:

```env
AZURE_CONNECTION_STRING=
REPLICATE_API_TOKEN=
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
CLOUDFLARE_TURNSTILE_SITE_KEY=
CLOUDFLARE_TURNSTILE_SECRET_KEY=
DATABASE_URL=
DISCORD_WEBHOOK_URL=
CLOUDFLARE_SUBNETS=
ENVIRONMENT=development
ALLOW_TURNSTILE_TEST_BYPASS=true
TRUST_PROXY_HEADERS=false
REQUIRE_CLOUDFLARE_PROXY=false
STRICT_ENV_VALIDATION=false
```

### Default backend lokal

```env
ENVIRONMENT=development
ALLOW_TURNSTILE_TEST_BYPASS=true
TRUST_PROXY_HEADERS=false
REQUIRE_CLOUDFLARE_PROXY=false
STRICT_ENV_VALIDATION=false
```

### Default backend production

```env
ENVIRONMENT=production
ALLOW_TURNSTILE_TEST_BYPASS=false
TRUST_PROXY_HEADERS=true
REQUIRE_CLOUDFLARE_PROXY=false
STRICT_ENV_VALIDATION=true
```

Gunakan `REQUIRE_CLOUDFLARE_PROXY=true` hanya jika backend production memang diharapkan menerima traffic melalui Cloudflare.

---

## 7. Environment Variables Frontend

Buat file ini:

```txt
frontend/.env
```

Template:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
VITE_TURNSTILE_SITE_KEY=
```

Untuk deployment:

```env
VITE_API_BASE_URL=https://your-backend-domain.com/api
VITE_TURNSTILE_SITE_KEY=your_turnstile_site_key
```

> [!IMPORTANT]
> Variable Vite dengan prefix `VITE_` akan terekspos ke browser. Hanya masukkan value yang aman untuk publik di `frontend/.env`.

---

## 8. Menjalankan PixelForge Secara Lokal

### Backend

```bash
cd backend
python -m venv .venv
```

macOS/Linux:

```bash
source .venv/bin/activate
```

Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Jalankan backend:

```bash
uvicorn main:app --reload
```

Default backend URL:

```txt
http://127.0.0.1:8000
```

---

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Default frontend URL:

```txt
http://localhost:5173
```

---

## 9. Checklist Setup Akhir

Sebelum menjalankan PixelForge secara lokal, pastikan:

- [ ] `backend/.env` sudah ada
- [ ] `frontend/.env` sudah ada
- [ ] `AZURE_CONNECTION_STRING` sudah dikonfigurasi
- [ ] Container Azure `uploads` dan `results` sudah ada
- [ ] Container Azure menggunakan akses private
- [ ] Azure lifecycle cleanup sudah dikonfigurasi
- [ ] Azure Blob CORS mengizinkan `http://localhost:5173`
- [ ] `REPLICATE_API_TOKEN` sudah dikonfigurasi
- [ ] Cloudflare Turnstile site key sudah dikonfigurasi
- [ ] Cloudflare Turnstile secret key sudah dikonfigurasi
- [ ] `DATABASE_URL` sudah dikonfigurasi
- [ ] `DISCORD_WEBHOOK_URL` sudah dikonfigurasi jika feedback notification digunakan
- [ ] `VITE_API_BASE_URL` mengarah ke backend API
- [ ] `VITE_TURNSTILE_SITE_KEY` sesuai dengan Turnstile site key

---

## 10. Masalah Umum

### Frontend tidak bisa mengakses backend

Cek:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

Pastikan juga `ALLOWED_ORIGINS` berisi:

```txt
http://localhost:5173
http://127.0.0.1:5173
```

---

### Upload ke Azure gagal

Cek Azure Blob CORS.

Untuk local development, allowed origins harus mencakup:

```txt
http://localhost:5173
http://127.0.0.1:5173
```

Allowed methods sebaiknya mencakup:

```txt
GET, PUT, HEAD, OPTIONS
```

---

### Turnstile gagal di lokal

Untuk local development, gunakan key Turnstile yang valid atau aktifkan local bypass jika didukung backend:

```env
ALLOW_TURNSTILE_TEST_BYPASS=true
ENVIRONMENT=development
```

Jangan pernah aktifkan bypass di production.

---

### Request Replicate gagal

Cek:

```env
REPLICATE_API_TOKEN=
```

Pastikan juga model version yang dikonfigurasi di backend masih valid.

---

### Koneksi database gagal

Cek:

```env
DATABASE_URL=
```

Pastikan:

- Database sudah ada
- Username dan password benar
- Host dan port bisa dijangkau
- Firewall hosted database mengizinkan koneksi backend
- Pengaturan SSL sesuai dengan provider database

---

## 11. Referensi Resmi

- Azure Blob Storage containers: https://learn.microsoft.com/en-us/azure/storage/blobs/storage-quickstart-blobs-portal
- Azure Storage CORS: https://learn.microsoft.com/en-us/rest/api/storageservices/cross-origin-resource-sharing--cors--support-for-the-azure-storage-services
- Replicate HTTP API authentication: https://replicate.com/docs/reference/http
- Cloudflare Turnstile: https://developers.cloudflare.com/turnstile/get-started/
- Vite environment variables: https://vite.dev/guide/env-and-mode

---

## 12. Pengingat Keamanan

Jangan pernah commit atau expose:

- File `.env`
- Azure connection string
- Replicate API token
- Cloudflare Turnstile secret key
- Database URL
- Discord webhook URL
- Private key
- Log yang berisi secret atau signed URL

Jika ada secret yang terekspos, segera rotate atau regenerate.
