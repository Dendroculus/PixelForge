# Berkontribusi ke PixelForge

Terima kasih sudah meluangkan waktu untuk membantu mengembangkan PixelForge.

PixelForge adalah studio gambar open-source yang menggabungkan pemrosesan berbasis AI di cloud dengan alat gambar cepat yang berjalan di browser. Kontribusi sangat diterima, tetapi mohon jaga perubahan tetap fokus, terdokumentasi, dan mudah ditinjau.

---

## Daftar Isi

- [Cara Berkontribusi](#cara-berkontribusi)
- [Sebelum Memulai](#sebelum-memulai)
- [Pengembangan Lokal](#pengembangan-lokal)
- [Penamaan Branch](#penamaan-branch)
- [Konvensi Commit Message](#konvensi-commit-message)
- [Panduan Pull Request](#panduan-pull-request)
- [Panduan Frontend](#panduan-frontend)
- [Panduan Backend](#panduan-backend)
- [Panduan Dokumentasi](#panduan-dokumentasi)
- [Panduan Keamanan](#panduan-keamanan)
- [Checklist Review](#checklist-review)

---

## Cara Berkontribusi

Anda dapat berkontribusi dengan:

- Memperbaiki bug
- Meningkatkan UI/UX
- Menambahkan atau menyempurnakan alat gambar
- Meningkatkan keandalan backend
- Meningkatkan dokumentasi
- Menambahkan test
- Melaporkan bug atau masalah penggunaan
- Mengusulkan peningkatan arsitektur atau keamanan

Untuk perubahan besar, sebaiknya buat issue terlebih dahulu agar ruang lingkupnya dapat didiskusikan sebelum implementasi.

---

## Sebelum Memulai

Sebelum berkontribusi, mohon:

1. Periksa issue dan pull request yang sudah ada.
2. Pastikan perubahan hanya fokus pada satu tujuan.
3. Hindari perubahan format yang tidak berhubungan.
4. Jangan commit secret, file `.env` lokal, log yang dihasilkan, atau konfigurasi privat.
5. Pastikan perubahan berjalan secara lokal sebelum membuka pull request.

---

## Pengembangan Lokal

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # macOS/Linux
# .venv\Scripts\activate      # Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Pemeriksaan yang Disarankan

Jalankan pemeriksaan yang sesuai dengan perubahan Anda:

```bash
npm --prefix frontend run lint
```

Jika test backend atau tool formatting sudah tersedia di environment lokal Anda, jalankan sebelum mengirim pull request.

---

## Penamaan Branch

Gunakan nama branch yang singkat dan deskriptif.

Pola yang disarankan:

```txt
feat/object-remover
fix/upload-validation
docs/architecture-guide
refactor/job-manager
test/result-viewer
chore/update-deps
```

---

## Konvensi Commit Message

PixelForge menggunakan gaya Conventional Commit.

Format:

```txt
<type>(optional-scope): <ringkasan singkat>
```

Contoh:

```txt
feat(object-remove): add mask-based object removal workflow
fix(upload): reject unsupported image formats earlier
docs(readme): update localized README links
refactor(job): simplify queue reservation flow
test(result-viewer): add result download render test
chore(deps): update frontend dependencies
```

Tipe umum:

| Tipe | Digunakan untuk |
|---|---|
| `feat` | Fitur baru yang terlihat oleh pengguna |
| `fix` | Perbaikan bug |
| `docs` | Perubahan dokumentasi saja |
| `style` | Perubahan format saja |
| `refactor` | Restrukturisasi kode tanpa perubahan perilaku |
| `perf` | Peningkatan performa |
| `test` | Test |
| `chore` | Tooling, dependency, maintenance |
| `ci` | Perubahan CI/CD |
| `build` | Perubahan sistem build |

Commit message yang baik harus spesifik dan menggunakan bentuk imperatif.

Lebih baik:

```txt
fix(upload): validate MIME type before creating job
```

Hindari:

```txt
fixed stuff
update files
changes
```

---

## Panduan Pull Request

Pull request yang baik sebaiknya mencakup:

- Judul yang jelas menggunakan gaya Conventional Commit
- Ringkasan singkat tentang perubahan
- Alasan perubahan dibuat
- Catatan testing
- Screenshot atau video untuk perubahan UI
- Catatan risiko, batasan, atau pekerjaan lanjutan

Jaga pull request tetap fokus. Jika perubahan menyentuh area yang tidak berhubungan, pisahkan menjadi beberapa pull request.

---

## Panduan Frontend

Saat mengubah kode frontend:

- Jaga komponen page tetap mudah dibaca dan fokus.
- Letakkan UI yang reusable di `components/`.
- Letakkan workflow logic yang reusable di `hooks/`.
- Letakkan API call di `services/`.
- Letakkan konstanta dan konten di `data/` atau `config.js`.
- Hindari duplikasi pola UI workspace.
- Perhatikan aksesibilitas untuk button, input, label, dan interaksi keyboard.
- Gunakan dokumentasi komponen dan hook yang bermakna untuk logic non-trivial.

Untuk perubahan UI, sertakan screenshot atau video singkat di pull request jika memungkinkan.

---

## Panduan Backend

Saat mengubah kode backend:

- Jaga route handler tetap tipis.
- Letakkan business logic di service.
- Letakkan logic khusus provider di balik provider abstraction.
- Simpan konfigurasi di `core/config.py`.
- Validasi input file sebelum diproses.
- Pertahankan perilaku usage limit, rate limit, dan cleanup.
- Hindari pekerjaan blocking di async request path.
- Tambahkan atau perbarui docstring saat mengubah module, class, atau function yang non-trivial.

Perubahan backend harus aman dalam kondisi gagal. Job yang gagal harus melepaskan kapasitas antrean, mencatat status gagal jika diperlukan, dan menghindari file sementara yang tertinggal.

---

## Panduan Dokumentasi

Dokumentasi sebaiknya tetap selaras antar bahasa jika memungkinkan.

Dokumentasi utama berbahasa Inggris:

```txt
README.md
CONTRIBUTING.md
CODE_OF_CONDUCT.md
SECURITY.md
LICENSE
docs/ARCHITECTURE.md
docs/ADDING_AI_FEATURE.md
```

Dokumentasi terjemahan:

```txt
docs/translation/landing/README_ID.md
docs/translation/landing/README_CN.md

docs/translation/dev/ADDING_AI_FEATURE_ID.md
docs/translation/dev/ADDING_AI_FEATURE_ZH.md
docs/translation/dev/ARCHITECTURE_ID.md
docs/translation/dev/ARCHITECTURE_ZH.md

docs/translation/community/CONTRIBUTING_ID.md
docs/translation/community/CONTRIBUTING_ZH.md
docs/translation/community/CODE_OF_CONDUCT_ID.md
docs/translation/community/CODE_OF_CONDUCT_ZH.md
docs/translation/community/SECURITY_ID.md
docs/translation/community/SECURITY_ZH.md
```

Saat memperbarui dokumentasi berbahasa Inggris, perbarui juga versi Indonesia dan Mandarin jika konten yang sama tersedia di sana.

Simpan dokumen komunitas di `docs/translation/community/`, dokumen developer di `docs/translation/dev/`, dan terjemahan landing page di `docs/translation/landing/`.

---
## Panduan Keamanan

Jangan commit:

- File `.env`
- API token
- Kredensial cloud provider
- Database URL
- Private key
- Log yang dihasilkan
- Gambar privat yang diunggah pengguna

Perubahan yang sensitif terhadap keamanan harus ditinjau dengan hati-hati, terutama perubahan yang berkaitan dengan:

- Validasi file
- Signed URL
- Verifikasi Turnstile
- Perilaku proxy/IP trust
- Usage limit
- Rate limit
- Cleanup storage
- Token provider

Jika menemukan masalah keamanan serius, hindari membuka public issue yang berisi detail eksploitasi. Hubungi maintainer secara privat jika memungkinkan.

---

## Checklist Review

Sebelum membuka pull request, pastikan:

- [ ] Perubahan fokus dan mudah ditinjau.
- [ ] Kode berjalan secara lokal.
- [ ] Linting frontend berhasil jika file frontend berubah.
- [ ] Dokumentasi diperbarui jika perilaku berubah.
- [ ] Dokumentasi terjemahan diperbarui jika konten terjemahan yang sesuai tersedia.
- [ ] Tidak ada secret, file `.env`, log, atau artifact generated yang ikut di-commit.
- [ ] Perubahan UI menyertakan screenshot atau video jika berguna.
- [ ] Judul pull request mengikuti gaya Conventional Commit.

Terima kasih sudah membantu mengembangkan PixelForge.
