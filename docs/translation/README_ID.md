<div align="center">

ID | [EN](../../README.md) | [中文](./README_CN.md)

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

### Studio gambar open-source yang menggabungkan kekuatan AI cloud dengan editor browser tingkat profesional

</div>

## 🚀 Mengapa PixelForge?

<div style="max-width: 720px;">

PixelForge awalnya dibuat sebagai alat AI Upscaler sederhana dan berkembang menjadi platform pemrosesan gambar full-stack.
Platform ini menggabungkan **pemrosesan berbasis AI di cloud** (upscale, penghapusan background, restorasi foto) dengan **alat editing cepat di sisi klien** (resize, kompresi, transformasi, dan pembersihan metadata).
Sistem dirancang untuk menangani kebutuhan dunia nyata seperti batas penggunaan API, proses AI yang memakan waktu lama, serta manajemen siklus penyimpanan melalui arsitektur asinkron berbasis antrean.</div>

<br>

* ⚡ AI digunakan saat dibutuhkan, alat instan berjalan langsung di browser untuk performa lebih cepat
* 🔐 Pipeline berorientasi keamanan (Turnstile, Signed URL, validasi file, strategi anti-spoof proxy)
* 🧠 Arsitektur andal (job asinkron, batas penggunaan, cleanup otomatis, pemulihan sesi)
* 🎨 Pengalaman pengguna yang nyaman dengan perbandingan sebelum/sesudah dan progres bertahap
* 🛠️ Open-source dengan arsitektur provider yang mudah dikembangkan

## 🎯 Fitur

### A) Alat Pengolahan Gambar

1. 🔍 **Perbesar Resolusi Gambar (AI)** — peningkatan kualitas menggunakan Real-ESRGAN

<details>
  <summary><b>🎥 Klik untuk melihat preview </b></summary>
  <br>
</details>

2. 🧍 **Hapus Background (AI)** — ekstraksi objek secara bersih

<details>
  <summary><b>🎥 Klik untuk melihat preview </b></summary>
  <br>
</details>

3. 🎨 **Pulihkan Warna (AI)** — menghidupkan kembali foto hitam putih atau warna yang memudar

<details>
  <summary><b>🎥 Klik untuk melihat preview </b></summary>
  <br>
</details>

4. 🎛️ **Editor Gambar** — brightness, contrast, saturation, blur, vignette

5. 📐 **Resize Gambar** — ukuran kustom, kunci rasio aspek, dan preset

6. 🔄 **Rotate & Flip** — kontrol transformasi cepat

7. 🗜️ **Kompres Gambar** — mengurangi ukuran file dengan kontrol kualitas

8. 🔁 **Konversi Format** — PNG / JPG / WEBP

9. 🧹 **Hapus Metadata** — membersihkan data EXIF

10. 🎯 **Ekstraktor Palet Warna** — titik sampling yang dapat dipindahkan

11. 🏷️ **Tambahkan Watermark** — teks atau gambar dengan preview langsung

12. ✂️ **Crop Gambar** — bebas atau menggunakan rasio aspek preset

13. 🤖 **Chatbot** — asisten FAQ interaktif untuk membantu pengguna memahami fitur platform

14. 📝 **Sistem Feedback** — masukan pengguna untuk peningkatan fitur dan pelaporan bug

### B) Kemampuan Platform & Sistem

15. 🛡️ **Verifikasi Turnstile** — perlindungan terhadap bot
16. 📊 **Batas Penggunaan** — kuota harian per fitur
17. 🚦 **Rate Limiting** — kontrol aliran API
18. ⚙️ **Antrean Job Asinkron** — pemrosesan latar belakang yang aman
19. 🔄 **Status Polling** — monitoring status proses
20. 💾 **Penyimpanan Sesi** — IndexedDB + localStorage
21. 🔁 **Pemulihan Sesi** — melanjutkan sesi setelah refresh
22. ⏳ **Manajemen Kadaluarsa** — siklus hidup hasil dan draft
23. 🧽 **Azure Cleanup** — pembersihan hasil yang sudah kadaluarsa
24. 🧹 **Database Cleanup** — pemeliharaan data penggunaan
25. 🔑 **Signed URLs** — upload dan akses yang aman
26. 🔍 **Validasi File** — tipe file, ukuran, dan deteksi spoof
27. 🏷️ **Sanitasi Nama File** — penanganan file yang aman
28. 🧩 **Workspace System** — UI shell yang dapat digunakan kembali
29. 📢 **Modal System** — pengelolaan notifikasi dan legal notice
30. 🆚 **Comparison Slider** — perbandingan sebelum dan sesudah
31. 🎬 **Progress UX** — feedback progres bertahap

## 🧠 Sorotan Arsitektur

PixelForge dirancang untuk menyeimbangkan performa, biaya, dan keandalan saat bekerja dengan API AI eksternal yang memiliki batas rate limit dan concurrency yang ketat.

Beberapa keputusan arsitektur utama:

* Sistem pemrosesan AI berbasis antrean untuk menangani pekerjaan berdurasi panjang
* Pipeline upload → process → result yang terpisah
* Kontrol concurrency untuk mencegah overload dan penyalahgunaan API
* API stateless dengan pelacakan job di sisi klien
* Model pemrosesan hybrid (AI di cloud, alat instan di browser)
* Manajemen siklus penyimpanan dengan pembersihan otomatis
* Lapisan provider AI yang modular untuk integrasi model di masa depan

## 💡 Pertimbangan Desain

* Proses AI dijalankan secara asinkron karena waktu eksekusi yang lama dan keterbatasan API eksternal
* Polling dipilih dibanding WebSocket untuk kesederhanaan dan keandalan
* Signed URL mengurangi beban backend dan meningkatkan performa upload/download
* Rate limit dan batas penggunaan membantu mencegah penyalahgunaan serta mengontrol biaya operasional

## 🔧 Model Pemrosesan

PixelForge menggunakan model pemrosesan hybrid untuk menyeimbangkan performa dan biaya.
Tugas yang membutuhkan AI diproses secara asinkron di backend, sementara operasi ringan dijalankan langsung di browser.

### 🔄 Alur Pemrosesan AI (Asinkron)

1. Pengguna mengunggah gambar → divalidasi dan disanitasi
2. Backend membuat Signed Upload URL (Azure Blob)
3. File diunggah langsung ke storage
4. Job dibuat dan dimasukkan ke antrean
5. Provider AI menjalankan tugas secara asinkron
6. Klien memeriksa status job melalui API
7. Hasil disimpan dengan Signed Access URL
8. Frontend mengambil dan menampilkan hasil
9. Sistem cleanup menghapus data yang sudah kadaluarsa

### ⚡ Alur Pemrosesan di Browser (Instan)

1. Pengguna mengunggah gambar
2. Gambar diproses langsung di browser (resize, compress, transform, dll)
3. Tidak memerlukan interaksi backend
4. Hasil dibuat secara instan
5. Pengguna mengunduh file hasil

## 🏗️ Arsitektur & Teknologi

PixelForge menggunakan arsitektur terpisah:

* **Frontend (React + Vite + Tailwind)**
  Menangani UI, preview, transformasi gambar di browser, penyimpanan sesi, dan alur interaksi pengguna.

* **Backend (FastAPI + asyncpg + aiohttp)**
  Menangani orkestrasi AI, verifikasi Turnstile, rate limiting, signed URL, dan endpoint polling.

* **AI Inference (Replicate Python SDK)**
  Pemanggilan model dilakukan melalui abstraction layer (`BaseAIProvider` / `ReplicateProvider`) sehingga modular dan mudah diperluas.

* **Storage + Data (Azure Blob + PostgreSQL)**
  Azure Blob menangani siklus hidup file, sedangkan PostgreSQL menyimpan data penggunaan dan retensi.

## ⚙️ Environment Variables

### Backend (root/backend env)

```env
AZURE_CONNECTION_STRING=
REPLICATE_API_TOKEN=
ALLOWED_ORIGINS=
CLOUDFLARE_TURNSTILE_SITE_KEY=
CLOUDFLARE_TURNSTILE_SECRET_KEY=
DATABASE_URL=
CLOUDFLARE_SUBNETS=
ENVIRONMENT=
ALLOW_TURNSTILE_TEST_BYPASS=
TRUST_PROXY_HEADERS=
REQUIRE_CLOUDFLARE_PROXY=
STRICT_ENV_VALIDATION=
```

### Frontend

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
VITE_TURNSTILE_SITE_KEY=0x4AAAAAACxEYGPTmGZUjctK
```

> Untuk pengujian lokal, gunakan API lokal.
> Saat deployment, ubah menjadi endpoint API yang sudah di-hosting.

## 🚀 Pengembangan Lokal

### 1) Clone Repository

```bash
git clone https://github.com/Dendroculus/PixelForge.git
cd PixelForge
```

### 2) Jalankan Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### 3) Jalankan Frontend

```bash
cd frontend
npm install
npm run dev
```

## 🔒 Catatan Keamanan

* Verifikasi Turnstile sebelum inisialisasi AI
* Strategi proxy/IP trust untuk mengurangi risiko spoofing header
* Signed SAS URL untuk akses Blob yang terkontrol
* Validasi file yang ketat dengan batas ukuran dan dimensi
* Cleanup otomatis untuk privasi dan efisiensi penyimpanan

## 🛠 Dibangun Menggunakan

* React + Vite
* FastAPI
* Replicate
* Azure Blob Storage
* PostgreSQL
* Cloudflare Turnstile

## 🤝 Kontribusi

Pull Request dan kontribusi sangat terbuka.

Jika Anda berencana melakukan perubahan besar, silakan buat issue terlebih dahulu agar ruang lingkup pengembangan dapat diselaraskan.

## 📜 Lisensi

Dilisensikan di bawah MIT License. Lihat file LICENSE untuk informasi lebih lanjut.

## 🙏 Ucapan Terima Kasih

* Ekosistem Real-ESRGAN
* Platform Replicate
* FastAPI, React, dan seluruh kontributor open-source

## 👤 Kontributor

Dibuat dengan ❤️ oleh tim PixelForge:

* Hans — Lead Developer
* Wellson — Project Coordinator
* Lawi — UI/UX Designer
* Jensen — QA Lead & Stakeholder