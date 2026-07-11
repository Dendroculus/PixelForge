<div align="center">

[EN](../../../CONTRIBUTING.md) | ID | [中文](./CONTRIBUTING_ZH.md)

</div>

# Berkontribusi ke PixelForge

Terima kasih telah meluangkan waktu untuk meningkatkan PixelForge.

PixelForge adalah studio gambar open-source yang menggabungkan pemrosesan cloud berbasis AI dengan tool gambar browser yang cepat. Kontribusi sangat diterima, tetapi perubahan harus tetap fokus, terdokumentasi, aman, dan mudah direview.

---

## Daftar Isi

- [Cara Berkontribusi](#cara-berkontribusi)
- [Sebelum Memulai](#sebelum-memulai)
- [Pengembangan Lokal](#pengembangan-lokal)
- [Penamaan Branch](#penamaan-branch)
- [Konvensi Commit](#konvensi-commit)
- [Panduan Pull Request](#panduan-pull-request)
- [Panduan Frontend](#panduan-frontend)
- [Panduan Backend](#panduan-backend)
- [Panduan Dokumentasi](#panduan-dokumentasi)
- [Panduan Keamanan](#panduan-keamanan)
- [Checklist Review](#checklist-review)

---

## Cara Berkontribusi

- Memperbaiki bug
- Meningkatkan UI/UX dan accessibility
- Menambah atau menyempurnakan image tool
- Meningkatkan reliability atau performance backend
- Memperbaiki dokumentasi dan terjemahan
- Menambah test
- Melaporkan bug atau masalah usability
- Mengusulkan peningkatan arsitektur atau keamanan

Untuk perubahan besar, buka issue terlebih dahulu agar scope dapat didiskusikan.

---

## Sebelum Memulai

1. Periksa issue dan pull request yang sudah ada.
2. Fokuskan perubahan pada satu concern.
3. Hindari perubahan formatting yang tidak terkait.
4. Jangan commit secret, file `.env` lokal, log, atau konfigurasi private.
5. Pastikan perubahan berjalan secara lokal sebelum membuka pull request.

---

## Pengembangan Lokal

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # macOS/Linux
# venv\Scripts\activate       # Windows
pip install -r requirements.txt
python run.py
```

`backend/run.py` menjalankan Uvicorn dengan reload aktif dan `proxy_headers=False`. Perintah langsung yang setara:

```bash
uvicorn main:app --reload --no-proxy-headers
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Pemeriksaan yang Disarankan

```bash
npm --prefix frontend run lint
npm --prefix frontend run build
```

```bash
cd backend
python -m compileall api app core database domain limiter provider repository services utils
```

Lihat [TESTING_ID.md](../dev/TESTING_ID.md) untuk pemeriksaan backend dan workflow AI.

---

## Penamaan Branch

```txt
feat/object-remover
fix/upload-validation
docs/architecture-guide
refactor/job-manager
test/result-viewer
chore/update-deps
```

---

## Konvensi Commit

Gunakan format Conventional Commit:

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

Type umum: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, dan `build`.

---

## Panduan Pull Request

Pull request yang baik mencakup:

- Judul yang mengikuti Conventional Commit
- Ringkasan perubahan
- Alasan perubahan
- Catatan testing
- Screenshot/video untuk perubahan UI
- Risiko, keterbatasan, dan follow-up

Pisahkan perubahan yang tidak terkait ke pull request berbeda.

---

## Panduan Frontend

- Jaga page component tetap fokus dan readable.
- Tempatkan UI reusable di `components/`.
- Tempatkan workflow reusable di `hooks/`.
- Tempatkan API call di `services/`.
- Simpan constant dan copy di `content/`, `data/`, atau module konfigurasi.
- Hindari duplikasi pola workspace.
- Pertahankan keyboard support, label, focus behavior, dan status message yang accessible.
- Dokumentasikan component dan hook yang non-trivial.

---

## Panduan Backend

- Jaga route tetap tipis dan delegasikan business logic ke service.
- Letakkan detail provider di balik provider abstraction.
- Simpan konfigurasi runtime di `core/config.py`.
- Validasi upload sebelum processing mahal.
- Pertahankan usage limit, rate limit, queue, dan cleanup.
- Hindari blocking work dalam async request path.
- Perbarui docstring untuk kode non-trivial.
- Pertahankan forwarded client-IP header secara fail-closed; jangan trust CIDR tanpa batas.
- Pastikan konfigurasi Turnstile production gagal secara tertutup.

Job yang gagal harus melepaskan queue capacity, mencatat failure state bila perlu, melakukan refund usage sesuai kondisi, dan membersihkan file sementara.

---

## Panduan Dokumentasi

Dokumen utama:

```txt
README.md
SETUP.md
CONTRIBUTING.md
CODE_OF_CONDUCT.md
SECURITY.md
LICENSE

docs/ARCHITECTURE.md
docs/ADDING_AI_FEATURE.md
docs/TESTING.md
```

Dokumen developer terjemahan:

```txt
docs/translation/dev/SETUP_ID.md
docs/translation/dev/SETUP_ZH.md
docs/translation/dev/ARCHITECTURE_ID.md
docs/translation/dev/ARCHITECTURE_ZH.md
docs/translation/dev/ADDING_AI_FEATURE_ID.md
docs/translation/dev/ADDING_AI_FEATURE_ZH.md
docs/translation/dev/TESTING_ID.md
docs/translation/dev/TESTING_ZH.md
```

Dokumen community dan landing terjemahan berada di `docs/translation/community/` dan `docs/translation/landing/`.

Saat behavior, command, environment variable, atau path berubah, update semua versi yang sesuai dalam perubahan yang sama.

---

## Panduan Keamanan

Jangan commit file `.env`, token, cloud credential, database URL, private key, Discord webhook, log sensitif, atau gambar private milik pengguna.

Review dengan hati-hati perubahan pada file validation, signed URL, Turnstile, proxy/IP trust, usage/rate limit, storage cleanup, dan provider token. Laporkan kerentanan serius secara private sesuai [SECURITY_ID.md](./SECURITY_ID.md).

---

## Checklist Review

- [ ] Perubahan fokus dan mudah direview.
- [ ] Aplikasi berjalan secara lokal.
- [ ] Lint/build frontend yang relevan berhasil.
- [ ] Compile/test backend yang relevan berhasil.
- [ ] Perubahan behavior sudah didokumentasikan.
- [ ] Terjemahan yang sesuai sudah diperbarui.
- [ ] Tidak ada secret, environment lokal, log, atau artifact generated yang di-commit.
- [ ] Perubahan UI menyertakan screenshot/video bila berguna.
- [ ] Judul pull request mengikuti konvensi commit.

Terima kasih telah membantu meningkatkan PixelForge.
