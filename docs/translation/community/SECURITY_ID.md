# Kebijakan Keamanan

## Versi yang Didukung

PixelForge dikelola secara aktif dari branch utama repository.

Perbaikan keamanan umumnya diterapkan pada versi terbaru proyek. Commit lama, fork, atau deployment privat mungkin tidak menerima patch keamanan terpisah.

## Melaporkan Kerentanan

Jika Anda menemukan kemungkinan kerentanan keamanan di PixelForge, harap laporkan secara privat dan jangan membuka public issue.

Mohon sertakan:

- Deskripsi kerentanan yang jelas
- Langkah-langkah untuk mereproduksi masalah
- Komponen, route, page, atau file yang terdampak
- Potensi dampak
- Screenshot, log, atau proof-of-concept yang relevan
- Saran perbaikan, jika ada

Mohon hindari membagikan detail eksploitasi secara publik sebelum masalah ditinjau dan diperbaiki.

## Hal yang Perlu Dilaporkan

Laporkan masalah seperti:

- Bypass autentikasi atau otorisasi
- Perilaku upload file yang tidak aman
- Bypass spoofing tipe file
- Eksposur atau penyalahgunaan Signed URL
- Kebocoran secret, token, atau kredensial
- Bypass Cloudflare Turnstile di production
- Masalah proxy/IP trust
- Bypass rate limit atau usage limit
- Path traversal atau penanganan nama file yang tidak aman
- Server-side request forgery
- Cross-site scripting
- Eksposur data yang melibatkan gambar upload, result URL, log, atau environment variable

## Hal yang Tidak Perlu Dilaporkan Secara Privat

Hal berikut biasanya tidak memerlukan laporan keamanan privat:

- Bug umum tanpa dampak keamanan
- Masalah layout UI
- Dokumentasi yang kurang
- Saran update dependency tanpa vulnerability yang diketahui
- Kesalahan konfigurasi lokal yang tidak berdampak ke production

Hal-hal tersebut dapat dilaporkan melalui GitHub issue biasa.

## Praktik Keamanan Proyek

PixelForge menggunakan beberapa langkah keamanan:

- Verifikasi Cloudflare Turnstile sebelum inisialisasi job AI
- Rate limiting untuk endpoint API
- Usage limit per fitur
- Signed Azure Blob URL untuk upload dan akses hasil
- Validasi file untuk tipe, ukuran, dan struktur gambar
- Nama file aman yang dihasilkan backend
- Siklus hidup dan cleanup storage sementara
- Token provider dan kredensial cloud hanya berada di backend
- Validasi environment untuk pengaturan runtime sensitif

## Secret dan File Environment

Jangan commit:

- File `.env`
- API token
- Database URL
- Azure connection string
- Replicate token
- Cloudflare secret
- Discord webhook URL
- Private key
- Log yang mengandung data sensitif

Gunakan file contoh seperti `.env.example` saat mendokumentasikan variable yang diperlukan.

## Responsible Disclosure

Setelah kerentanan dilaporkan:

1. Maintainer akan meninjau laporan.
2. Masalah akan direproduksi dan dinilai.
3. Perbaikan akan disiapkan jika diperlukan.
4. Perbaikan akan dirilis atau di-merge.
5. Pengungkapan publik dapat dilakukan setelah pengguna memiliki waktu yang wajar untuk update.

Mohon bertindak dengan itikad baik dan hindari mengakses, mengubah, atau menghapus data yang bukan milik Anda.

Terima kasih telah membantu menjaga PixelForge tetap aman.
