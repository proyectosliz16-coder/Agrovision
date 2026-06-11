# Agrovision - ProyectoTT

Este proyecto es una plataforma web para el análisis agrícola y detección de maleza en cultivos de frijol utilizando inteligencia artificial (modelos de segmentación U-Net). 

## Estructura del Proyecto

El proyecto está dividido en dos partes principales:
- **Frontend**: Desarrollado en React y Vite.
- **Backend**: Desarrollado en Python con FastAPI y PyTorch.

> **Nota importante sobre los modelos:** Los archivos `.pth` (los pesos del modelo de PyTorch) no se incluyen en este repositorio de GitHub por restricciones de tamaño de archivo (máximo 100MB). Deberás colocar tus archivos `unet_frijol.pth` y `modelo_frijol_v2.pth` en la raíz del proyecto localmente para que el backend funcione.

---

## 🛠️ Instrucciones para instalar y correr localmente (Localhost)

### 1. Preparación de Modelos de IA
Descarga o copia los archivos de los modelos pesados en la carpeta raíz del proyecto (`ProyectoTT`):
- `unet_frijol.pth`
- `modelo_frijol_v2.pth`

### 2. Configuración del Backend (Python)
Abre una terminal en la raíz del proyecto y sigue estos pasos:

1. (Opcional pero recomendado) Crea un entorno virtual:
   ```bash
   python -m venv venv
   # En Windows:
   venv\Scripts\activate
   # En Mac/Linux:
   source venv/bin/activate
   ```
2. Instala las dependencias necesarias:
   ```bash
   pip install -r requirements.txt
   ```
3. Ejecuta el servidor del backend:
   ```bash
   uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
   ```
   El backend estará corriendo en `http://localhost:8000`.

### 3. Configuración del Frontend (React + Vite)
Abre otra terminal en la raíz del proyecto y ejecuta:

1. Instala las dependencias de Node:
   ```bash
   npm install
   ```
2. Inicia el servidor de desarrollo del frontend:
   ```bash
   npm run dev
   ```
   El frontend estará corriendo en `http://localhost:5173` (o el puerto que te indique Vite).

¡Listo! Ya puedes acceder a la aplicación desde tu navegador e interactuar con la plataforma.
