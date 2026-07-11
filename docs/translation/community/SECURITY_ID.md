<div align="center">

[EN](../../../SECURITY.md) | ID | [中文](./SECURITY_ZH.md)

</div>

# Kebijakan Keamanan

## Versi yang Didukung

PixelForge dipelihara aktif dari branch `master`. Security fix umumnya diterapkan ke versi terbaru; commit lama, fork, atau deployment private mungkin tidak menerima patch terpisah.

## Melaporkan Kerentanan

Laporkan dugaan kerentanan secara private, bukan melalui issue publik yang memuat detail exploit.

Sertakan deskripsi, langkah reproduksi, komponen yang terpengaruh, dampak, bukti yang relevan, dan saran perbaikan bila tersedia. Hindari disclosure publik sebelum masalah ditinjau dan diperbaiki.

## Hal yang Perlu Dilaporkan

- Bypass authentication atau authorization
- Upload tidak aman atau bypass validasi file
- Eksposur/misuse signed URL
- Kebocoran secret, token, atau credential
- Bypass Cloudflare Turnstile di production
- Konfigurasi Turnstile production yang hilang tetapi tetap diterima
- Masalah proxy/IP trust atau forwarded header yang dapat dipalsukan
- Bypass rate limit atau usage limit
- Path traversal, unsafe filename, SSRF, atau XSS
- Eksposur image upload, result URL, log, atau environment value

Bug umum tanpa dampak keamanan, masalah layout, kekurangan dokumentasi, dan misconfiguration yang hanya terjadi secara lokal dapat dilaporkan melalui issue biasa.

## Praktik Keamanan Proyek

PixelForge menggunakan:

- Verifikasi Turnstile baru untuk setiap inisialisasi job AI dan pengiriman feedback
- Fail-closed di production saat Turnstile secret tidak tersedia
- Manual bypass yang hanya dapat diaktifkan secara eksplisit di development
- Rate limit endpoint dan rolling usage limit per fitur
- Resolusi client IP fail-closed: forwarded header diabaikan kecuali proxy trust aktif dan direct proxy berada dalam CIDR eksplisit
- Signed Azure Blob URL yang short-lived
- Validasi tipe, byte size, resolusi, dan struktur gambar
- Safe generated filename dan cleanup temporary storage
- Provider credential dan cloud secret hanya di backend

Validasi Cloudflare pada aplikasi tidak memblokir origin secara firewall. Deployment Cloudflare-only juga harus membatasi direct origin traffic pada layer network/hosting.

Identitas daily usage saat ini berbasis IP. Pengguna di balik NAT, carrier network, atau managed reverse proxy dapat berbagi quota; ini adalah keterbatasan yang didokumentasikan, bukan jaminan authentication.

## Secret dan File Environment

Jangan commit file `.env`, token, database URL, Azure connection string, Cloudflare secret, Discord webhook, private key, log sensitif/signed URL, atau image private pengguna.

Gunakan `.env.example` hanya untuk nama variable dan placeholder aman. Rotate secret segera jika terekspos.

## Responsible Disclosure

1. Maintainer meninjau dan mereproduksi masalah.
2. Dampak dan versi yang terpengaruh dinilai.
3. Perbaikan terfokus dan langkah verifikasi disiapkan.
4. Perbaikan di-merge atau dirilis.
5. Disclosure publik dapat dilakukan setelah pengguna memiliki waktu yang wajar untuk update.

Bertindaklah dengan itikad baik dan jangan mengakses, mengubah, atau menghapus data yang bukan milik Anda.

Terima kasih telah membantu menjaga PixelForge tetap aman.
