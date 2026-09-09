@echo off
title YT Downloader PRO - Servidor Web
color 0B
chcp 65001 >nul

echo ======================================================
echo           🎬 YT Downloader PRO - Iniciando
echo ======================================================
echo.

:: Verificar si Python está instalado
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python no está instalado o no se encuentra en el PATH.
    echo Por favor instala Python desde https://python.org
    pause
    exit /b 1
)

:: Instalar o verificar dependencias de requirements.txt silenciosamente
echo [1/2] Verificando dependencias...
python -m pip install -r requirements.txt --quiet --disable-pip-version-check

echo [2/2] Iniciando servidor web...
echo.
echo ======================================================
echo 👉 El servidor se abrirá automáticamente en tu navegador.
echo 👉 Si no se abre, ingresa a: http://127.0.0.1:5000
echo.
echo Para cerrar la aplicación, simplemente cierra esta ventana.
echo ======================================================
echo.

python app.py

pause
