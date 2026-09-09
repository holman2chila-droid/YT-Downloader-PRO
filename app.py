"""
YT Downloader PRO — Servidor Web Flask
Permite descargar videos y audios de YouTube directamente desde la interfaz web.
"""

import os
import re
import sys
import time
import uuid
import shutil
import threading
import webbrowser
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, send_file, send_from_directory

import yt_dlp
from yt_dlp.utils import download_range_func

app = Flask(__name__, static_folder='.', static_url_path='')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMP_DIR = os.path.join(BASE_DIR, "downloads_temp")
os.makedirs(TEMP_DIR, exist_ok=True)

# Asegurar que la carpeta bin con ffmpeg de Render esté en el PATH
bin_dir = os.path.join(BASE_DIR, "bin")
if os.path.isdir(bin_dir) and bin_dir not in os.environ.get("PATH", ""):
    os.environ["PATH"] = f"{bin_dir}:{os.environ.get('PATH', '')}"


# Almacén en memoria de trabajos de descarga
# Estructura: job_id -> dict con estado, progreso, ruta de archivo, etc.
jobs = {}
jobs_lock = threading.Lock()


def limpiar_archivos_antiguos():
    """Elimina archivos temporales de descargas de más de 1 hora de antigüedad."""
    ahora = time.time()
    try:
        for archivo in os.listdir(TEMP_DIR):
            ruta = os.path.join(TEMP_DIR, archivo)
            if os.path.isfile(ruta):
                if ahora - os.path.getmtime(ruta) > 3600:
                    try:
                        os.remove(ruta)
                    except Exception:
                        pass
    except Exception:
        pass


def obtener_ydl_base_opts():
    """Genera opciones de yt-dlp para eludir la detección de bots de YouTube en servidores en la nube."""
    opts = {
        "quiet": True,
        "no_warnings": True,
        # Clientes alternativos que no requieren login/cookies obligatorias en IPs de datacenter
        "extractor_args": {
            "youtube": {
                "player_client": ["android", "ios", "web_creator", "mweb"]
            }
        }
    }
    
    # Si existe cookies.txt o una variable de entorno con cookies, usarla
    cookies_path = os.path.join(BASE_DIR, "cookies.txt")
    if os.path.exists(cookies_path):
        opts["cookiefile"] = cookies_path
    elif os.environ.get("YOUTUBE_COOKIES"):
        # Permite configurar cookies directamente como Environment Variable en Render
        temp_cookies = os.path.join(TEMP_DIR, "env_cookies.txt")
        if not os.path.exists(temp_cookies):
            with open(temp_cookies, "w", encoding="utf-8") as f:
                f.write(os.environ.get("YOUTUBE_COOKIES"))
        opts["cookiefile"] = temp_cookies

    return opts


def convertir_a_segundos(tiempo):
    """Convierte 'ss', 'mm:ss' o 'hh:mm:ss' a segundos enteros."""

    if not tiempo:
        return 0
    tiempo = str(tiempo).strip()
    partes = tiempo.split(":")
    try:
        partes = [int(p) for p in partes]
        while len(partes) < 3:
            partes.insert(0, 0)
        h, m, s = partes
        return h * 3600 + m * 60 + s
    except Exception:
        return 0


def formatear_duracion(segundos):
    """Convierte segundos a formato HH:MM:SS o MM:SS."""
    if not segundos:
        return "0:00"
    segundos = int(segundos)
    m, s = divmod(segundos, 60)
    h, m = divmod(m, 60)
    if h > 0:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"


@app.route("/")
def index():
    """Sirve la página principal index.html."""
    return send_file(os.path.join(BASE_DIR, "index.html"))


@app.route("/api/info", methods=["POST"])
def obtener_info_video():
    """Obtiene información preliminar del video (título, miniatura, duración, autor)."""
    datos = request.get_json() or {}
    url = (datos.get("url") or "").strip()

    if not url:
        return jsonify({"error": "No se proporcionó una URL"}), 400

    ydl_opts = obtener_ydl_base_opts()
    ydl_opts.update({
        "skip_download": True,
        "noplaylist": True,
    })


    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            if not info:
                return jsonify({"error": "No se pudo obtener la información del video"}), 404

            duracion_sec = info.get("duration", 0)
            return jsonify({
                "title": info.get("title", "Video de YouTube"),
                "thumbnail": info.get("thumbnail", ""),
                "duration": formatear_duracion(duracion_sec),
                "duration_seconds": duracion_sec,
                "channel": info.get("uploader") or info.get("channel", "Canal de YouTube"),
                "views": info.get("view_count", 0),
            })
    except Exception as e:
        error_msg = str(e)
        if "Video unavailable" in error_msg:
            return jsonify({"error": "El video no está disponible o es privado."}), 400
        return jsonify({"error": f"Error al consultar YouTube: {error_msg}"}), 400


def ejecutar_descarga(job_id, url, quality, trim_data):
    """Ejecuta la descarga en un hilo en segundo plano con yt-dlp."""
    with jobs_lock:
        jobs[job_id]["status"] = "downloading"
        jobs[job_id]["status_text"] = "Iniciando conexión con YouTube..."
        jobs[job_id]["percent"] = 5

    def progress_hook(d):
        if d.get("status") == "downloading":
            total = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
            downloaded = d.get("downloaded_bytes", 0)
            percent = 0.0

            if total > 0:
                percent = round((downloaded / total) * 100, 1)
            elif "_percent_str" in d:
                try:
                    cleaned = d["_percent_str"].replace("%", "").strip()
                    percent = float(cleaned)
                except Exception:
                    percent = 10.0

            # Guardamos un margen para el procesamiento final
            percent_clamped = min(max(percent, 5.0), 92.0)
            speed = d.get("_speed_str", "").strip()
            eta = d.get("_eta_str", "").strip()

            texto = f"Descargando: {percent_clamped:.1f}%"
            if speed:
                texto += f" • {speed}"
            if eta:
                texto += f" • Restante: {eta}"

            with jobs_lock:
                if job_id in jobs:
                    jobs[job_id]["percent"] = percent_clamped
                    jobs[job_id]["status_text"] = texto
                    jobs[job_id]["speed"] = speed
                    jobs[job_id]["eta"] = eta

        elif d.get("status") == "finished":
            with jobs_lock:
                if job_id in jobs:
                    jobs[job_id]["percent"] = 95.0
                    jobs[job_id]["status"] = "processing"
                    jobs[job_id]["status_text"] = "Procesando streams con FFmpeg..."

    formatos = {
        "best": "bestvideo+bestaudio/best",
        "1080": "bestvideo[height<=1080]+bestaudio/best[height<=1080]",
        "720": "bestvideo[height<=720]+bestaudio/best[height<=720]",
        "480": "bestvideo[height<=480]+bestaudio/best[height<=480]",
        "mp3": "bestaudio/best",
    }
    formato_elegido = formatos.get(quality, "bestvideo+bestaudio/best")

    template_nombre = f"{job_id}_%(title).100B.%(ext)s"
    outtmpl = os.path.join(TEMP_DIR, template_nombre)

    ydl_opts = obtener_ydl_base_opts()
    ydl_opts.update({
        "format": formato_elegido,
        "outtmpl": outtmpl,
        "noplaylist": True,
        "progress_hooks": [progress_hook],
    })


    if quality == "mp3":
        ydl_opts["postprocessors"] = [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "192",
        }]
    else:
        ydl_opts["merge_output_format"] = "mp4"

    # Recorte de fragmento si se especificó
    if trim_data and trim_data.get("enabled"):
        start_sec = convertir_a_segundos(trim_data.get("start"))
        end_sec = convertir_a_segundos(trim_data.get("end"))
        if end_sec > start_sec:
            ydl_opts["download_ranges"] = download_range_func(None, [(start_sec, end_sec)])
            ydl_opts["force_keyframes_at_cuts"] = True

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])

        # Buscar el archivo generado que comience con job_id_
        archivo_encontrado = None
        for f in os.listdir(TEMP_DIR):
            if f.startswith(f"{job_id}_"):
                archivo_encontrado = os.path.join(TEMP_DIR, f)
                break

        if not archivo_encontrado or not os.path.exists(archivo_encontrado):
            raise Exception("No se encontró el archivo generado tras completar la descarga.")

        # Nombre limpio sin el prefijo del UUID para cuando el usuario lo guarde
        nombre_original = os.path.basename(archivo_encontrado).split(f"{job_id}_", 1)[-1]

        with jobs_lock:
            jobs[job_id]["status"] = "completed"
            jobs[job_id]["percent"] = 100.0
            jobs[job_id]["status_text"] = "¡Descarga completada! Transfiriendo archivo..."
            jobs[job_id]["file_path"] = archivo_encontrado
            jobs[job_id]["filename"] = nombre_original

    except Exception as e:
        with jobs_lock:
            jobs[job_id]["status"] = "error"
            jobs[job_id]["status_text"] = f"Error: {str(e)}"
            jobs[job_id]["error"] = str(e)


@app.route("/api/download", methods=["POST"])
def iniciar_descarga():
    """Inicia la tarea de descarga en segundo plano y devuelve un ID para monitorear el progreso."""
    limpiar_archivos_antiguos()

    datos = request.get_json() or {}
    url = (datos.get("url") or "").strip()
    quality = datos.get("quality", "best")
    trim_data = datos.get("trim", {})

    if not url:
        return jsonify({"error": "La URL es obligatoria"}), 400

    job_id = str(uuid.uuid4())

    with jobs_lock:
        jobs[job_id] = {
            "status": "starting",
            "percent": 0.0,
            "status_text": "Preparando descarga...",
            "speed": "",
            "eta": "",
            "file_path": None,
            "filename": None,
            "error": None,
            "created_at": time.time(),
        }

    hilo = threading.Thread(target=ejecutar_descarga, args=(job_id, url, quality, trim_data), daemon=True)
    hilo.start()

    return jsonify({"job_id": job_id})


@app.route("/api/progress/<job_id>", methods=["GET"])
def consultar_progreso(job_id):
    """Devuelve el progreso actual de la descarga."""
    with jobs_lock:
        job = jobs.get(job_id)
        if not job:
            return jsonify({"error": "Descarga no encontrada"}), 404

        return jsonify({
            "status": job["status"],
            "percent": job["percent"],
            "status_text": job["status_text"],
            "speed": job["speed"],
            "eta": job["eta"],
            "filename": job["filename"],
            "download_ready": job["status"] == "completed",
            "error": job["error"],
        })


@app.route("/api/file/<job_id>", methods=["GET"])
def descargar_archivo(job_id):
    """Envía el archivo descargado directamente al navegador del usuario."""
    with jobs_lock:
        job = jobs.get(job_id)
        if not job or not job.get("file_path"):
            return jsonify({"error": "Archivo no encontrado o expirado"}), 404

        file_path = job["file_path"]
        filename = job["filename"] or "video.mp4"

    if not os.path.exists(file_path):
        return jsonify({"error": "El archivo ya no existe en el servidor"}), 404

    return send_file(
        file_path,
        as_attachment=True,
        download_name=filename,
        mimetype="application/octet-stream"
    )


def abrir_navegador_auto():
    """Abre el navegador web automáticamente una vez que el servidor esté activo."""
    time.sleep(1.2)
    webbrowser.open("http://127.0.0.1:5000")


if __name__ == "__main__":
    print("=" * 60)
    print("🎬 YT Downloader PRO — Servidor Web Activo")
    print("👉 Abre tu navegador en: http://127.0.0.1:5000")
    print("Presiona Ctrl+C en la consola para detener el servidor")
    print("=" * 60)

    # Asegurar puerto dinámico para la nube (Render) o 5000 por defecto
    puerto = int(os.environ.get("PORT", 5000))

    # Abrir navegador automáticamente solo en local
    if "PORT" not in os.environ and os.environ.get("WERKZEUG_RUN_MAIN") != "true":
        threading.Thread(target=abrir_navegador_auto, daemon=True).start()

    app.run(host="0.0.0.0", port=puerto, debug=False)

