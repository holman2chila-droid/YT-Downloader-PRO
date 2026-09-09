#!/usr/bin/env bash
# Script de build para Render.com

set -e

echo "Instalando dependencias de Python..."
pip install -r requirements.txt

echo "Instalando FFmpeg estático..."
mkdir -p bin
if [ ! -f "bin/ffmpeg" ]; then
    curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz -o ffmpeg.tar.xz
    tar -xf ffmpeg.tar.xz --strip-components 1 -C bin
    rm -f ffmpeg.tar.xz
fi

chmod +x bin/ffmpeg bin/ffprobe || true
export PATH="$PWD/bin:$PATH"

echo "Build completado con éxito."
