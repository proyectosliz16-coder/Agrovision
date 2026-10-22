# MJ Agrovision - ProyectoTT
### Inteligencia artificial aplicada al análisis agrícola mediante visión por computadora

AgroVision es un proyecto que utiliza inteligencia artificial y visión por computadora para analizar imágenes de cultivos de frijol mediante técnicas de segmentación semántica. Su objetivo es identificar y diferenciar elementos presentes en las imágenes, como plantas, maleza y suelo.

El proyecto integra un modelo de inteligencia artificial con una aplicación web para facilitar la visualización de los resultados.

## Características principales

- **Segmentación de imágenes:** análisis visual de cultivos de frijol.
- **Identificación de elementos:** diferenciación entre plantas, maleza y suelo.
- **Modelo de inteligencia artificial:** implementación de una arquitectura U-Net.
- **Procesamiento de imágenes:** preparación y análisis de imágenes agrícolas.
- **Backend:** procesamiento de solicitudes e integración del modelo mediante Python y FastAPI.
- **Interfaz web:** visualización e interacción con el sistema mediante React.

## Tecnologías utilizadas

| Tecnología | Uso |
|---|---|
| Python | Desarrollo del backend y procesamiento de imágenes |
| PyTorch | Desarrollo y ejecución de modelos de IA |
| U-Net | Arquitectura para segmentación de imágenes |
| FastAPI | API para integrar el modelo con la aplicación |
| React | Desarrollo de la interfaz de usuario |
| Vite | Herramienta de desarrollo y construcción del frontend |
| JavaScript | Funcionalidad de la aplicación web |

## Arquitectura del proyecto

AgroVision integra los componentes de inteligencia artificial y desarrollo web para procesar imágenes y presentar los resultados.

```text
                ┌─────────────────────┐
                │   Usuario           │
                └──────────┬──────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │  Frontend - React   │
                └──────────┬──────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │ Backend - FastAPI   │
                └──────────┬──────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │ Modelo de IA U-Net  │
                └──────────┬──────────┘
                           │
                           ▼
                ┌─────────────────────┐
                │ Resultados de       │
                │ segmentación        │
                └─────────────────────┘
```

## Estructura del proyecto

La organización puede variar según la versión del proyecto. De manera general, se contemplan los siguientes componentes:

```text
ProyectoTT/
├── backend/
├── public/
├── src/
├── unet_frijol.pth
├── modelo_frijol_v2.pth
├── requirements.txt
├── package.json
├── vite.config.js
└── README.md
```

## Instalación y configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/proyectosliz16-coder/Agrovision.git
cd Agrovision
```

### 2. Preparar el backend

Se recomienda utilizar un entorno virtual de Python para instalar las dependencias del proyecto de forma aislada.

**Crear el entorno virtual:**

```bash
python -m venv venv
```

**Activarlo en Windows:**

```bash
venv\Scripts\activate
```

**Instalar las dependencias:**

```bash
pip install -r requirements.txt
```

### 3. Preparación de Modelos de IA

Descarga o copia los archivos de los modelos pesados en la carpeta raíz del proyecto (`ProyectoTT`).

Los archivos necesarios son:

- `unet_frijol.pth`
- `modelo_frijol_v2.pth`

Asegúrate de que ambos archivos estén ubicados en la carpeta indicada antes de ejecutar el proyecto.

**Importante:** estos archivos deben estar disponibles localmente para que el sistema pueda cargar los modelos. Si no están incluidos en el repositorio, deberán obtenerse por separado.

### 4. Ejecutar el backend

Si el archivo principal de FastAPI se encuentra en `backend/main.py`, puedes iniciarlo con:

```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Si el archivo principal se encuentra en otra ubicación, ajusta el comando según la estructura real del proyecto.

### 5. Preparar el frontend

Instala las dependencias de Node.js:

```bash
npm install
```

Inicia el servidor de desarrollo:

```bash
npm run dev
```

Utiliza la URL que indique la terminal para abrir la aplicación en el navegador.

## Desarrollo del proyecto

Participé en el desarrollo de AgroVision, trabajando en los componentes de inteligencia artificial y en la integración de la solución web.

Las áreas de trabajo incluyen:

- Desarrollo y experimentación con modelos de segmentación.
- Preparación y procesamiento de imágenes.
- Implementación del backend para la integración del modelo.
- Desarrollo de la interfaz web.
- Integración entre frontend, backend y modelo de inteligencia artificial.

## Objetivo académico

AgroVision explora el uso de técnicas de inteligencia artificial y visión por computadora para el análisis de imágenes agrícolas, como apoyo a la identificación visual de plantas, maleza y suelo en cultivos de frijol.


## 📌 Nota

Los resultados dependen de los modelos utilizados, de la calidad de las imágenes y de las condiciones de entrenamiento. El proyecto tiene un propósito académico y experimental.

---

**MJ AgroVision** 
*Inteligencia artificial para el análisis de cultivos mediante visión por computadora.*
