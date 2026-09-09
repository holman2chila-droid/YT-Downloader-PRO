#DESCARGAR VIDEOS DE YOUTUBE 100 GRATIS 
import yt_dlp
from yt_dlp.utils import download_range_func

def convertir_a_segundos(tiempo):
    """Convierte 'mm:ss' o 'hh:mm:ss' a segundos. También acepta solo segundos."""
    partes = tiempo.strip().split(":")
    partes = [int(p) for p in partes]
    while len(partes) < 3:
        partes.insert(0, 0)
    h, m, s = partes
    return h * 3600 + m * 60 + s


def descargar_video():
    url = input("Pega la URL del video de YouTube: ").strip()

    print("\nElige la calidad:")
    print("1. Mejor calidad disponible (sin pérdida)")
    print("2. 1080p")
    print("3. 720p")
    print("4. 480p")
    print("5. Solo audio (mp3)")
    opcion = input("Opción (1-5): ").strip()

    formatos = {
        "1": "bestvideo+bestaudio/best",
        "2": "bestvideo[height<=1080]+bestaudio/best[height<=1080]",
        "3": "bestvideo[height<=720]+bestaudio/best[height<=720]",
        "4": "bestvideo[height<=480]+bestaudio/best[height<=480]",
        "5": "bestaudio/best",
    }
    formato_elegido = formatos.get(opcion, "bestvideo+bestaudio/best")

    # Preguntar si quiere un fragmento o el video completo
    print("\n¿Quieres descargar solo una parte del video?")
    print("1. Sí, indicar inicio y fin")
    print("2. No, descargar todo")
    fragmento = input("Opción (1-2): ").strip()

    ydl_opts = {
        "format": formato_elegido,
        "outtmpl": "C:/Users/Holman Chila/Videos/VIDEOS DESCARGADOS/%(title)s.%(ext)s",
        "merge_output_format": "mp4",
        "noplaylist": True,
    }

    if fragmento == "1":
        inicio = input("Tiempo de inicio (ej: 0 o 0:10 o 1:20:00): ").strip()
        fin = input("Tiempo final (ej: 10 o 0:30): ").strip()

        inicio_seg = convertir_a_segundos(inicio)
        fin_seg = convertir_a_segundos(fin)

        # Esto hace que yt-dlp descargue SOLO ese rango (más rápido, no baja todo el video)
        ydl_opts["download_ranges"] = download_range_func(None, [(inicio_seg, fin_seg)])
        ydl_opts["force_keyframes_at_cuts"] = True  # corte preciso en el segundo exacto

    if opcion == "5":
        ydl_opts["postprocessors"] = [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "192",
        }]

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            print("\nDescargando...")
            ydl.download([url])
        print("✅ ¡Descarga completada!")
    except Exception as e:
        print(f"❌ Ocurrió un error: {e}")


if __name__ == "__main__":
    descargar_video()