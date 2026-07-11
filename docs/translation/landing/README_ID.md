<div align="center">

  ID | [EN](../../../README.md) | [中文](./README_CN.md)

</div>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Azure-0078D4?logo=microsoft-azure&logoColor=white" alt="Microsoft Azure">
  <img src="https://img.shields.io/badge/Cloudflare-Turnstile-F38020?logo=cloudflare&logoColor=white" alt="Cloudflare Turnstile">
</p>

<p align="center" style="margin-top: -12px;">
  <img src="https://img.shields.io/badge/License-MIT-22C55E?logo=opensourceinitiative&logoColor=white" alt="MIT">
  <img src="https://img.shields.io/badge/Replicate-111111?logo=replicate&logoColor=white" alt="Replicate">
</p>

<div align="center">

# ✨ PixelForge
### Studio gambar open-source yang menggabungkan kekuatan AI cloud dengan editing browser tingkat profesional
</div>

## 🚀 Mengapa PixelForge

<div style="max-width: 720px;">

PixelForge dimulai sebagai AI upscaler satu fungsi dan berkembang menjadi platform pemrosesan gambar full-stack.
Platform ini menggabungkan **pemrosesan berbasis AI di cloud** (upscale, penghapusan background, restorasi foto) dengan **alat editing cepat di sisi browser** (resize, kompresi, transformasi, pembersihan metadata).
Sistem ini dirancang untuk menangani batasan dunia nyata seperti rate limit, job AI yang berjalan lama, dan manajemen siklus hidup storage melalui arsitektur asinkron berbasis antrean.</div>

<br>

- ⚡ AI digunakan saat benar-benar dibutuhkan, alat client-side instan digunakan saat lebih cepat  
- 🔐 Pipeline berorientasi keamanan (Turnstile, signed URL, validasi, strategi anti-spoof proxy)  
- 🧠 Arsitektur andal (job asinkron, batas penggunaan, janitor cleanup, pemulihan sesi)  
- 🎨 UX yang indah dengan perbandingan sebelum/sesudah dan feedback progres bertahap  
- 🛠️ Open-source dan mudah dikembangkan melalui arsitektur provider  



## 🎯 Fitur

### A) Alat Gambar Utama

1. 🔍 **Upscale Image (AI)** — peningkatan kualitas Real-ESRGAN

<details>
  <summary><b>🎥 Klik untuk melihat preview </b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/61cff1c1-69f2-4707-9cef-025cee09298f">
</details>

2. 🧍 **Remove Background (AI)** — ekstraksi subjek yang bersih

<details>
  <summary><b>🎥 Klik untuk melihat preview </b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/d22a42c6-ad5d-41b6-8f83-419aba47d09f">
</details>

3. 🎨 **Restore Color (AI)** — menghidupkan kembali foto grayscale dan foto pudar

<details>
  <summary><b>🎥 Klik untuk melihat preview </b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/68491a17-057d-49cf-b1a2-03cbc2f5f9ca">
</details>

4. 🎨 **Object Remover (AI)** — sapu objek yang tidak diinginkan lalu hapus dengan bersih

<details>
  <summary><b>🎥 Klik untuk melihat preview </b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/3c68ed8b-dad1-4f88-b1d7-873455ecd3ee">
</details>

5. 🎛️ **Image Editor** — brightness, contrast, saturation, blur, vignette

<details>
  <summary><b>🎥 Klik untuk melihat preview </b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/a2e1db98-212e-4801-afa5-3d0d548925df">
</details>

6. 📐 **Resize Image** — ukuran kustom, kunci aspek rasio, preset

<details>
  <summary><b>🎥 Klik untuk melihat preview </b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/169353e7-1916-44e5-bfe0-5075bbf4fa8e">
</details>

7. 🔄 **Rotate & Flip** — kontrol transformasi cepat

<details>
  <summary><b>🎥 Klik untuk melihat preview </b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/a1dda108-f6dd-4a7c-9002-6db21ef25d49">
</details>

8. 🗜️ **Compress Image** — mengurangi ukuran file dengan kontrol kualitas

<details>
  <summary><b>🎥 Klik untuk melihat preview </b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/25a7f82c-8550-4e0e-8d4c-9a4420d646d9">
</details>

9. 🔁 **Convert Format** — PNG / JPG / WEBP

<details>
  <summary><b>🎥 Klik untuk melihat preview </b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/3d353e7a-b614-4bdc-b549-e8a092a41621">
</details>

10. 🧹 **Remove Metadata** — membersihkan data EXIF

<details>
  <summary><b>🎥 Klik untuk melihat preview </b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/3b06be04-1020-4b0e-aad8-7aff77e76f58">
</details>

11. 🎯 **Color Palette Extractor** — titik sampling yang dapat digeser

<details>
  <summary><b>🎥 Klik untuk melihat preview </b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/da8a8267-428f-4c02-8abb-4029305511d6">
</details>

12. 🏷️ **Add Watermark** — teks/gambar dengan live preview

<details>
  <summary><b>🎥 Klik untuk melihat preview </b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/928bb069-7643-4a0c-b6e5-1056706547f6">
</details>

13. ✂️ **Crop Image** — bebas atau menggunakan preset aspek rasio

<details>
  <summary><b>🎥 Klik untuk melihat preview </b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/717edf23-64d5-4673-bffa-21b10fec7ca9">
</details>

14. 🤖 **Chatbot** — asisten FAQ interaktif untuk jawaban cepat dan panduan platform

<details>
  <summary><b>🎥 Klik untuk melihat preview </b></summary>
  <br>
  <video src="https://github.com/user-attachments/assets/90083dfb-915a-43f1-a2b3-d9fbefc10bdd">
</details>

15. 📝 **Feedback System** — input pengguna untuk peningkatan dan laporan bug


### B) Kemampuan Platform & Sistem

16. 🛡️ **Turnstile Verification** — lapisan perlindungan bot  
17. 📊 **Usage Limits** — batas harian per fitur  
18. 🚦 **Rate Limiting** — alur API yang terkontrol  
19. ⚙️ **Async Job Queue** — pemrosesan background yang aman  
20. 🔄 **Status Polling** — processing / ready / failed  
21. 💾 **Session Persistence** — IndexedDB + localStorage  
22. 🔁 **Session Restore** — pulih setelah refresh  
23. ⏳ **Expiration Handling** — siklus hidup hasil & draft  
24. 🧽 **Azure Cleanup** — janitor untuk hasil kedaluwarsa  
25. 🧹 **DB Cleanup** — pemeliharaan data penggunaan  
26. 🔑 **Signed URLs** — upload & akses yang aman  
27. 🔍 **File Validation** — validasi tipe, ukuran, spoof detection, dan keamanan resolusi  
28. 📉 **Auto-Resize Gambar Besar** — downscale di browser untuk gambar di atas batas pixel publik  
29. 🏷️ **Filename Sanitization** — penanganan nama file yang aman  
30. 🧩 **Workspace System** — shell UI yang dapat digunakan ulang  
31. 📢 **Modal System** — pengelolaan legal & alert  
32. 🆚 **Comparison Slider** — preview sebelum/sesudah  
33. 🎬 **Progress UX** — feedback loading bertahap  

## 🧠 Sorotan Arsitektur
PixelForge dirancang untuk menyeimbangkan performa, biaya, dan keandalan saat bekerja dengan API AI eksternal yang memiliki batas rate dan concurrency ketat. Keputusan arsitektur utamanya mencakup:

- Sistem pemrosesan AI berbasis antrean untuk job yang berjalan lama  
- Pipeline upload → process → result yang dipisahkan  
- Kontrol concurrency untuk mencegah overload dan penyalahgunaan API  
- API stateless dengan pelacakan job di sisi klien  
- Model pemrosesan hybrid (AI di cloud, alat instan di browser)  
- Manajemen siklus hidup storage dengan cleanup otomatis
- Lapisan AI provider yang pluggable untuk integrasi model di masa depan

## 💡 Pertimbangan Desain

- Job AI dijalankan secara asinkron karena waktu eksekusi yang lama dan batas API eksternal  
- Polling digunakan daripada WebSocket demi kesederhanaan dan keandalan  
- Signed URL mengurangi beban backend dan meningkatkan performa upload/download  
- Rate limit dan usage cap mencegah penyalahgunaan serta mengontrol biaya

## 🔧 Model Pemrosesan
PixelForge menggunakan model pemrosesan hybrid untuk menyeimbangkan performa dan biaya:
tugas AI-intensive diproses secara asinkron di backend, sedangkan operasi ringan dijalankan langsung di browser.

<div style="max-width: 720px; line-height: 1.65; margin-left: 12px">

### 🔄 Alur Pemrosesan AI (Asinkron)
Sistem memisahkan jalur pemrosesan berdasarkan jenis workload untuk mengoptimalkan performa dan biaya:

1. Pengguna memilih gambar  
2. Frontend memvalidasi tipe, ukuran, dan resolusi  
3. Gambar yang terlalu besar tetapi masih aman akan di-resize di browser sebelum upload  
4. Backend memverifikasi Turnstile dan mengecek kuota penggunaan  
5. Backend membuat metadata signed upload URL  
6. File diunggah langsung ke Azure Blob Storage  
7. Backend memesan kapasitas antrean dan menambah usage saat pemrosesan dimulai  
8. AI provider menjalankan tugas secara asinkron  
9. Client melakukan polling status job melalui API  
10. Hasil disimpan dengan signed access URL  
11. Sistem cleanup menghapus data kedaluwarsa
</div>

<div style="max-width: 720px; line-height: 1.65; margin-left: 12px">

### ⚡ Alur Pemrosesan Client-Side (Instan)
Frontend menangani semua transformasi ringan langsung di browser untuk feedback instan dan tanpa beban backend:

1. Pengguna mengunggah gambar  
2. Gambar diproses langsung di browser (resize, compress, transform, dll.)  
3. Tidak memerlukan interaksi backend  
4. Hasil dibuat secara instan  
5. Pengguna mengunduh file hasil
</div>

## 🏗️ Arsitektur & Stack

<img src="../../assets/TECH_STACKS.png" width="45%" alt="Tech Stacks">

<div style="max-width: 760px; line-height: 1.65;">

PixelForge menggunakan arsitektur terpisah:

- **Frontend (React + Vite + Tailwind)**  
  Menangani UI tool, preview, transformasi client-side, session persistence (IndexedDB/localStorage), dan alur interaksi.

- **Backend (FastAPI + asyncpg + aiohttp)**  
  Menangani orkestrasi AI yang aman, verifikasi Turnstile, usage/rate limit, signed upload/result URL, dan endpoint polling.

- **AI Inference (Replicate Python SDK)**  
  Pemanggilan model melalui abstraksi provider (`BaseAIProvider` / `ReplicateProvider`) agar layer AI modular dan extensible.

- **Storage + Data (Azure Blob + PostgreSQL)**  
  Azure Blob mengelola lifecycle upload/result; PostgreSQL menyimpan usage bucket dan state berbasis retention.

</div>

Untuk detail lebih lengkap, lihat [dokumen arsitektur](../dev/ARCHITECTURE_ID.md).


## ⚙️ Environment Variables

PixelForge memisahkan secret backend dari konfigurasi frontend yang dapat terlihat di browser. Buat file environment lokal dari contoh yang tersedia:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

> Windows PowerShell: gunakan `Copy-Item backend/.env.example backend/.env` dan `Copy-Item frontend/.env.example frontend/.env`.

### Backend (`backend/.env`)

```env
ENVIRONMENT=development

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pixelforge
AZURE_CONNECTION_STRING=
REPLICATE_API_TOKEN=
CLOUDFLARE_TURNSTILE_SECRET_KEY=
DISCORD_WEBHOOK_URL=
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
ALLOW_TURNSTILE_TEST_BYPASS=false

TRUST_PROXY_HEADERS=false
TRUSTED_PROXY_CIDRS=
CLOUDFLARE_SUBNETS=
REQUIRE_CLOUDFLARE_PROXY=false

LOG_LEVEL=INFO
LOG_TO_FILE=false
LOG_DIR=logs
LOG_FILE_NAME=pixelforge.log
LOG_MAX_BYTES=10485760
LOG_BACKUP_COUNT=5
```

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
VITE_TURNSTILE_SITE_KEY=
```

- Simpan `DATABASE_URL`, kredensial Azure, token Replicate, Turnstile secret, dan `DISCORD_WEBHOOK_URL` hanya di environment backend.
- Semua nilai `VITE_*` akan dimasukkan ke bundle browser dan harus aman untuk dipublikasikan.
- `LOG_TO_FILE=false` cocok ketika platform hosting sudah menangkap stdout. Ubah menjadi `true` jika membutuhkan rotating log file saat development lokal.
- Header IP dari proxy diabaikan secara default. Aktifkan `TRUST_PROXY_HEADERS` hanya bersama CIDR proxy yang jelas; jangan pernah gunakan `0.0.0.0/0` atau `::/0`.
- `CLOUDFLARE_SUBNETS` hanya diperlukan untuk mode proxy Cloudflare yang tervalidasi. `REQUIRE_CLOUDFLARE_PROXY` memvalidasi rantai proxy, tetapi tidak memblokir akses langsung ke origin.
- Untuk deployment, ganti origin dan URL lokal dengan alamat frontend dan backend yang sudah di-host.

Butuh bantuan menyiapkan layanan eksternal? Lihat [SETUP.md](../dev/SETUP_ID.md) untuk panduan langkah demi langkah dalam mengonfigurasi Azure Blob Storage, Replicate, Cloudflare Turnstile, PostgreSQL, Discord webhook, dan environment variables.

## 🚀 Local Development

## 1) Clone

```bash
git clone https://github.com/Dendroculus/PixelForge.git
cd PixelForge
```

## 2) Jalankan backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # macOS/Linux
# .venv\Scripts\activate       # Windows
pip install -r requirements.txt
uvicorn main:app --reload --no-proxy-headers
```

## 3) Jalankan frontend

```bash
cd frontend
npm install
npm run dev
```



## 🔒 Catatan Keamanan

- Pemeriksaan Turnstile sebelum route init AI
- Header client IP dari proxy hanya diterima dari CIDR proxy tepercaya yang dikonfigurasi
- Signed SAS URL untuk akses blob yang terkontrol
- Validasi file ketat + batas dimensi/ukuran
- Upload AI publik memakai batas pixel browser yang lebih rendah untuk UX
- Validasi backend tetap menjadi batas keamanan utama dengan hard cap pixel yang lebih tinggi
- Gambar beresolusi besar dapat di-resize sebelum upload, sedangkan file yang terlalu besar secara byte tetap ditolak
- Cleanup otomatis untuk privasi dan kebersihan storage



## 🛠 Dibangun Dengan

- **React + Vite** (frontend)
- **FastAPI** (backend)
- **Replicate** (inferensi model AI)
- **Azure Blob Storage** (lifecycle upload/result)
- **PostgreSQL** (usage limit & retention window)
- **Cloudflare Turnstile** (perlindungan bot)



## 🤝 Kontribusi

PR dan perbaikan sangat diterima.  
Jika Anda merencanakan perubahan besar, buka issue terlebih dahulu untuk menyelaraskan scope.

Untuk panduan kontribusi, lihat [CONTRIBUTING_ID.md](../community/CONTRIBUTING_ID.md).  
Mohon ikuti [Kode Etik](../community/CODE_OF_CONDUCT_ID.md) kami.  
Untuk masalah keamanan, lihat [Kebijakan Keamanan](../community/SECURITY_ID.md) kami.


## 📜 Lisensi

Dilisensikan di bawah MIT License. Lihat [LICENSE](../../../LICENSE) untuk detail.


## 📝 Dokumentasi Developer

Cara menambahkan fitur AI baru ke PixelForge:
- [Menambahkan Fitur AI Baru](../dev/ADDING_AI_FEATURE_ID.md)

Script testing backend dan AI:
- [Pengujian PixelForge](../dev/TESTING_ID.md) ([EN](../../TESTING.md), [ZH](../dev/TESTING_ZH.md))

Skrip bantuan developer:
- [Total Line Counter](scripts/dev/get_total_lines.ps1) — skrip PowerShell Windows interaktif untuk menghitung jumlah baris project berdasarkan folder, ekstensi file, dan bagian project.

> Script PowerShell lokal dan file helper `.bat` ditujukan untuk environment development Windows.

## 🙏 Acknowledgements

- Ekosistem Real-ESRGAN
- Platform Replicate
- FastAPI, React, dan kontributor open-source

## 👤 Kontributor
Dibuat dengan ❤️ oleh tim PixelForge:

<table>
  <tr>
    <td align="center" width="180">
      <a href="https://github.com/Dendroculus">
        <img src="https://github.com/Dendroculus.png?size=96" width="96" alt="Hans avatar" style="border-radius: 50%;"><br/>
        <b>Hans</b><br/>
      </a>
        <sub><b>Lead Developer</b></sub>
    </td>
    <td align="center" width="180">
      <a href="https://github.com/Serthonss">
        <img src="https://github.com/Serthonss.png?size=96" width="96" alt="Wellson avatar" style="border-radius: 50%;"><br/>
        <b>Wellson</b><br/>
      </a>
        <sub><b>Project Coordinator</b></sub>
    </td>
    <td align="center" width="180">
      <a href="https://github.com/vincentlawi">
        <img src="https://github.com/vincentlawi.png?size=96" width="96" alt="Lawi avatar" style="border-radius: 50%;"><br/>
        <b>Lawi</b><br/>
      </a>
        <sub><b>UI/UX Designer</b></sub>
    </td>
    <td align="center" width="180">
      <a href="https://github.com/Jensenix">
        <img src="https://github.com/Jensenix.png?size=96" width="96" alt="Jensen avatar" style="border-radius: 50%;"><br/>
        <b>Jensen</b><br/>
      </a>
        <sub><b>QA Lead & Stakeholder</b></sub>
    </td>
  </tr>
</table>
