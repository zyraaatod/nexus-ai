#!/usr/bin/env python3
"""Unduh engine AI ke folder engines/ (hanya Linux x86_64 non-Termux).
URL BELUM DIVERIFIKASI oleh pembuat proyek: jika gagal, unduh manual dari halaman Releases dan ekstrak ke engines/.
Override lewat env REALESRGAN_URL / RIFE_URL. Periksa lisensi engine sebelum memakainya."""
import os
import platform
import sys
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
URLS = {
    "realesrgan": os.environ.get("REALESRGAN_URL", "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesrgan-ncnn-vulkan-20220424-ubuntu.zip"),
    "rife": os.environ.get("RIFE_URL", "https://github.com/nihui/rife-ncnn-vulkan/releases/download/20221029/rife-ncnn-vulkan-20221029-ubuntu.zip"),
}


def main():
    termux = "com.termux" in os.environ.get("PREFIX", "") or "TERMUX_VERSION" in os.environ
    if termux or platform.system() != "Linux" or platform.machine() not in ("x86_64", "AMD64"):
        print("Build engine resmi hanya untuk Linux x86_64 (glibc). Di platform ini aplikasi memakai metode klasik FFmpeg\n"
              "(dilabeli 'bukan AI'), kecuali kamu build engine sendiri dan menaruhnya di engines/ atau mengisi .env.")
        return 0
    dest = ROOT / "engines"
    dest.mkdir(exist_ok=True)
    for name, url in URLS.items():
        z = dest / f"{name}.zip"
        try:
            print(f"Mengunduh {name} ...")
            urllib.request.urlretrieve(url, z)
            with zipfile.ZipFile(z) as f:
                f.extractall(dest)
            z.unlink()
        except Exception as e:
            print(f"GAGAL {name}: {e}\nUnduh manual dari Releases dan ekstrak ke {dest}", file=sys.stderr)
            z.unlink(missing_ok=True)
    print("Selesai. Bit executable diperbaiki otomatis oleh server saat engine ditemukan.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
