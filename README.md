# 🎬 YT Downloader PRO (Aplicación Web)

> Descarga videos y música de YouTube 100% gratis directamente a tu computadora desde una interfaz web moderna, con selección de calidad, recorte de fragmentos y extracción de audio en MP3.

![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.x-000000?style=for-the-badge&logo=flask&logoColor=white)
![yt-dlp](https://img.shields.io/badge/yt--dlp-Latest-FF0000?style=for-the-badge&logo=youtube&logoColor=white)
![FFmpeg](https://img.shields.io/badge/FFmpeg-Ready-green?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-00D4AA?style=for-the-badge)

---

## ✨ Funcionalidades

- 🌐 **Interfaz Web Completa**: Pega el enlace en tu navegador y el archivo se descarga directamente a tu carpeta de **Descargas**.
- 🖼️ **Previsualización Instantánea**: Muestra miniatura, título, canal y duración al pegar el enlace.
- 🎥 **Múltiples Calidades**: Máxima calidad (sin pérdida), 1080p Full HD, 720p HD y 480p SD.
- 🎵 **Extracción de Audio**: Convierte a MP3 a 192kbps con un solo clic.
- ✂️ **Recorte de Fragmentos**: Descarga únicamente el segmento que necesitas indicando tiempo de inicio y fin (ej: `0:15` a `1:30`).
- ⚡ **Progreso en Tiempo Real**: Barra de porcentaje exacto, velocidad de descarga y tiempo restante.
- 🚀 **Inicio en 1 Clic**: Doble clic en `iniciar.bat` y se abre automáticamente en tu navegador.

---

## 🚀 Inicio Rápido (Windows)

### Opción 1: Un solo clic (Recomendada)
Simplemente haz **doble clic en el archivo:**
```
iniciar.bat
```
*Este script verificará las dependencias necesarias y abrirá automáticamente tu navegador en `http://127.0.0.1:5000`.*

---

### Opción 2: Desde la Terminal

1. **Instala los requisitos:**
```bash
pip install -r requirements.txt
```

2. **Ejecuta el servidor web:**
```bash
python app.py
```

3. **Abre tu navegador en:**
```
http://127.0.0.1:5000
```

---

## 📖 Cómo Usarlo

1. **Pega la URL:** Copia cualquier enlace de video, Short o Live de YouTube y pégalo en la barra principal.
2. **Revisa la previsualización:** La página detectará el video, mostrando su miniatura y duración.
3. **Elige la calidad:** Selecciona entre Video (Mejor calidad, 1080p, 720p, 480p) o Solo Audio (MP3).
4. **(Opcional) Recorta:** Activa la opción de recorte si solo deseas una parte del video.
5. **Haz clic en "Descargar Video":** Observa el progreso en tiempo real y el archivo se guardará automáticamente en tu carpeta de descargas de la computadora.

---

## 📁 Estructura del Proyecto

```
youtube-downloader/
├── app.py                  # Servidor backend en Flask con yt-dlp
├── iniciar.bat             # Lanzador rápido de un solo clic para Windows
├── index.html              # Interfaz web principal
├── css/
│   ├── styles.css          # Estilos modernos (dark mode, glassmorphism)
│   └── animations.css      # Animaciones e interactividad
├── js/
│   └── app.js              # Lógica web, previsualización y seguimiento de descargas
├── descargar_video.py      # Script alternativo por consola (CLI)
├── requirements.txt        # Dependencias (Flask, yt-dlp)
├── LICENSE                 # Licencia MIT
└── README.md               # Documentación
```

---

## 🛠️ Tecnologías Utilizadas

| Componente | Tecnología | Rol |
|------------|------------|-----|
| **Backend** | Python & Flask | Servidor web, API REST y entrega de archivos |
| **Motor de descarga** | yt-dlp | Extracción de streams de YouTube |
| **Multimedia** | FFmpeg | Fusión de video/audio y conversión a MP3 |
| **Frontend** | HTML5, CSS3, JavaScript | Interfaz interactiva y moderna |

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.

## ⚠️ Aviso Legal (Disclaimer)

Este proyecto fue desarrollado con fines educativos. Respeta los términos de servicio de YouTube y los derechos de autor del contenido que descargues.

---

<p align="center">
Hecho con ❤️ por <strong>Holman Chila</strong>
</p>
