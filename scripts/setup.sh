#!/usr/bin/env bash
# Setup otomatis: Termux, Debian/Ubuntu, Fedora, Arch. Pakai: bash scripts/setup.sh [--engines]
set -e
cd "$(dirname "$0")/.."
is_termux() { [ -n "$TERMUX_VERSION" ] || case "$PREFIX" in *com.termux*) true;; *) false;; esac; }

if is_termux; then
  echo "[Termux terdeteksi]"
  pkg update -y
  pkg install -y python ffmpeg rust binutils clang make
  PIP="pip"
else
  echo "[Linux terdeteksi]"
  if ! command -v ffmpeg >/dev/null || ! command -v ffprobe >/dev/null; then
    echo "FFmpeg belum ada. Pasang dulu:"
    echo "  Debian/Ubuntu: sudo apt install ffmpeg python3-venv"
    echo "  Fedora:        sudo dnf install ffmpeg   (butuh RPM Fusion)"
    echo "  Arch:          sudo pacman -S ffmpeg python"
    exit 1
  fi
  python3 -m venv .venv
  . .venv/bin/activate
  PIP="pip"
fi

if ! $PIP install -r requirements.txt; then
  echo "Instalasi gagal. Pastikan build tools terpasang:"
  echo "  Termux: pkg install rust binutils clang make"
  echo "  Linux:  build-essential (Debian/Ubuntu) atau group development (Fedora/Arch)"
  exit 1
fi

[ -f .env ] || cp .env.example .env
[ "$1" = "--engines" ] && python3 scripts/get_engines.py
echo
echo "Selesai. Jalankan: bash scripts/run.sh"
