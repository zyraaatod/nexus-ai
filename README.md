# NEXUS AI — Video & Image Upscaler / FPS Enhancer

Frontend HTML/CSS/JS + backend FastAPI + worker. Mendukung **video** (MP4, MOV, MKV, WebM) dan **gambar** (JPG, PNG, WebP).
Konfigurasi bersifat **otomatis** menurut platform (Termux, Linux, dll). Tidak memakai API key: semua diproses lokal.

## Cara kerja auto-konfigurasi
1. **Deteksi platform:** Termux / Linux / dll, dan akselerasi (Vulkan GPU atau CPU). Termux selalu dianggap CPU.
2. **Cari engine AI:** di `engines/`, lalu `PATH`, atau path dari `.env`. Model dipilih otomatis dari folder `models/` engine
   (gambar: `realesrgan-x4plus`; video: `realesr-animevideov3`; RIFE: versi terbaru yang ada).
3. **Fallback klasik:** jika engine AI tidak ditemukan, dipakai Lanczos (upscale) dan `minterpolate` FFmpeg (FPS).
   Ini **bukan AI**: hasilnya lebih sederhana, dan UI serta metadata hasil melabelinya "klasik, bukan AI".
   Matikan dengan `ALLOW_CLASSIC_FALLBACK=false`.
4. **Batas otomatis:** mode CPU memakai batas lebih ketat (durasi 15 detik, resolusi maksimum 1080p, gambar 16 MP). GPU: 60 detik, 2K, 40 MP.
   Semua bisa diubah di `.env`. Kosong = otomatis.

## Setup
**Termux atau Linux (satu perintah):**
```
bash scripts/setup.sh            # tambah --engines untuk mengunduh engine AI (Linux x86_64 saja)
bash scripts/run.sh              # lalu buka http://127.0.0.1:8000
```
Dari perangkat lain di jaringan yang sama: `HOST=0.0.0.0 bash scripts/run.sh`. Tidak ada login: hanya untuk jaringan tepercaya.

Manual: butuh Python 3.10+, FFmpeg + FFprobe, lalu `pip install -r requirements.txt` dan
`uvicorn backend.app.main:app --port 8000`.

## Engine AI per platform
| Platform | Yang terjadi |
|---|---|
| Linux x86_64 + GPU Vulkan | Taruh `realesrgan-ncnn-vulkan` dan `rife-ncnn-vulkan` (rilis resmi) di `engines/`. Terdeteksi otomatis. |
| Linux tanpa GPU / ARM | Engine dijalankan mode CPU (`-g -1`) jika kamu menyediakan binary yang cocok arsitekturnya (sangat lambat). Tanpa itu: klasik. |
| Termux (Android) | Build resmi tidak berjalan di Termux. Memakai metode klasik, kecuali engine hasil build sendiri ada di `engines/`. |

Cek lisensi tiap engine/model sebelum dipakai. `scripts/get_engines.py` memakai URL rilis yang **belum diverifikasi**;
bila gagal, unduh manual dan ekstrak ke `engines/`.

## Gambar
Upscale (AI atau Lanczos), denoise, dan sharpening. FPS tidak berlaku (diabaikan dan dilaporkan sebagai peringatan).
Format output: ikuti asli (default), atau paksa PNG/JPG di AI Configuration. WebP kembali ke PNG jika FFmpeg tidak punya encoder libwebp.
Hasil gambar punya slider sebelum/sesudah. Gambar beranimasi ditolak.

## Uji
```
cd backend && python -m unittest tests.test_pipeline -v      # butuh ffmpeg, tanpa GPU
```
8 tes mencakup: video dengan engine palsu, video fallback klasik, gambar AI palsu (PNG/JPG), gambar klasik, pembatalan, validasi, file rusak.
`tests/test_api.py` (butuh `pip install pytest httpx`) menguji endpoint.

## Status jujur
- **Sudah diuji:** pipeline video dan gambar, fallback klasik (termasuk `minterpolate`), validasi, pembatalan, parsing `.env` dengan nilai kosong. Engine AI diuji hanya dengan **engine palsu** (menyalin frame) untuk membuktikan alur, bukan kualitas.
- **Belum diuji:** engine AI asli, `main.py`/FastAPI (tidak terpasang di lingkungan pembuatan), frontend di browser terhadap server asli, `setup.sh` di Termux/distro nyata, deteksi Vulkan pada GPU nyata. Deteksi Vulkan tanpa `vulkaninfo` hanya menebak; paksa dengan `ACCEL=cpu` atau `ACCEL=vulkan`.
- Waktu proses mode klasik di HP bisa tetap lama (`minterpolate` berat). Mulai dengan video 3–5 detik.

## Batasan
- Frame video disimpan sebagai PNG sementara (besar). Pertahankan batas durasi rendah.
- “Deteksi pergantian adegan”: diterapkan hanya pada interpolasi klasik (`scd`), belum pada CLI RIFE.
- Denoise dan sharpening memakai filter FFmpeg, bukan AI. Deblur, face, dan color enhancement ditolak.
- Belum ada: akun, rate limiting, preset di server (preset di browser), batch, database. Jangan buka ke internet publik.
- Satu worker: pekerjaan diproses berurutan. Pekerjaan dibersihkan setelah `RETENTION_HOURS`. Log internal: `storage/jobs/<id>/job.log`.
