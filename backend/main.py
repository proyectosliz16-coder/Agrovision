from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import torch
import segmentation_models_pytorch as smp
import albumentations as A
from albumentations.pytorch import ToTensorV2
import cv2
import numpy as np
import base64
import io
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Forzamos CPU para el servidor web local, es más estable si la compu no tiene CUDA configurado
device = torch.device("cpu") 

# El archivo que encontraste en:
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "unet_frijol.pth")

try:
    # 1. Definir la misma arquitectura exacta que usaste en Colab
    model = smp.Unet(
        encoder_name="resnet34",
        encoder_weights=None, 
        in_channels=3,
        classes=3
    )
    # 2. Cargar tus pesos guardados
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
    model.to(device)
    model.eval()
    print(f"Modelo U-Net cargado exitosamente desde {MODEL_PATH}")
except Exception as e:
    print(f"Error al cargar el modelo: {e}")
    model = None

# Transformaciones idénticas a las de tu Colab para no perder precisión
transform = A.Compose([
    A.Resize(512, 512),
    A.Normalize(mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225)),
    ToTensorV2()
])

# Colores para la máscara (Suelo: Café, Frijol: Verde, Maleza: Azul, Fondo: Negro)
# OpenCV usa BGR, no RGB
COLORS = np.array([
    [19, 69, 139],    # 0: Suelo
    [44, 160, 44],    # 1: Frijol
    [255, 0, 0],      # 2: Maleza (Azul en BGR)
    [0, 0, 0]         # 3: Fondo ignorado (Negro)
], dtype=np.uint8)

@app.post("/api/preview")
async def preview_image(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    original_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if original_img is None:
        return {"error": "No se pudo leer la imagen"}
        
    height, width, _ = original_img.shape
    max_dim = 800
    scale = min(max_dim / width, max_dim / height)
    
    if scale < 1:
        new_width = int(width * scale)
        new_height = int(height * scale)
        preview_img = cv2.resize(original_img, (new_width, new_height))
    else:
        preview_img = original_img
        
    _, buffer = cv2.imencode('.jpg', preview_img)
    img_base64 = base64.b64encode(buffer).decode('utf-8')
    
    return {"success": True, "image": f"data:image/jpeg;base64,{img_base64}"}

from fastapi import FastAPI, UploadFile, File, Form
from typing import Optional

@app.post("/api/analyze")
async def analyze_image(
    file: UploadFile = File(...),
    crop_x_pct: Optional[float] = Form(None),
    crop_y_pct: Optional[float] = Form(None),
    crop_w_pct: Optional[float] = Form(None),
    crop_h_pct: Optional[float] = Form(None),
    sensibilidad_maleza: int = Form(75),
    contraste_suelo: int = Form(40)
):
    if not model:
        return {"error": "El modelo no está cargado. Asegúrate de tener modelo_frijol_v2.pth en la carpeta principal de tu proyecto."}
    
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    original_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    image_rgb = cv2.cvtColor(original_img, cv2.COLOR_BGR2RGB)
    height, width, _ = image_rgb.shape
    
    # Aplicar recorte si se proporcionan las coordenadas (en porcentajes)
    if crop_x_pct is not None and crop_y_pct is not None and crop_w_pct is not None and crop_h_pct is not None:
        if crop_w_pct > 0 and crop_h_pct > 0:
            x = int((crop_x_pct / 100.0) * width)
            y = int((crop_y_pct / 100.0) * height)
            w = int((crop_w_pct / 100.0) * width)
            h = int((crop_h_pct / 100.0) * height)
            
            # Asegurar límites
            x, y = max(0, x), max(0, y)
            w, h = min(width - x, w), min(height - y, h)
            
            image_rgb = image_rgb[y:y+h, x:x+w]
            original_img = original_img[y:y+h, x:x+w]
            height, width = h, w

    # -- CÁLCULO DE METADATOS REALES --
    # 1. Iluminación (basado en el canal V de HSV)
    hsv_crop = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2HSV)
    brightness_pct = int(np.mean(hsv_crop[:, :, 2]) / 255.0 * 100)
    if brightness_pct < 40:
        iluminacion_label = "Baja"
    elif brightness_pct < 70:
        iluminacion_label = "Media"
    else:
        iluminacion_label = "Alta"
        
    # 2. Escala (Zoom relativo basado en el recorte)
    if crop_w_pct is not None and crop_w_pct > 0 and crop_w_pct < 100:
        escala_label = f"Recorte al {int(crop_w_pct)}%"
    else:
        escala_label = "Imagen Completa"
        
    # 3. Modo IA
    if contraste_suelo < 60:
        modo_ia_label = "Precisión de Suelo"
    else:
        modo_ia_label = "Detección Agresiva"

    patch_size = 512
    
    # Contadores globales de píxeles
    total_suelo = 0
    total_planta = 0
    total_maleza = 0
    
    # Matriz para guardar la máscara gigante
    full_pred_mask = np.zeros((height, width), dtype=np.uint8)
    
    # Recorrer la imagen en pedazos de 512x512
    for y in range(0, height, patch_size):
        for x in range(0, width, patch_size):
            # Obtener el pedazo actual
            patch = image_rgb[y:min(y+patch_size, height), x:min(x+patch_size, width)]
            patch_h, patch_w, _ = patch.shape
            
            # Si el pedazo en la orilla es menor a 512x512, lo rellenamos (padding) con negro
            if patch_h < patch_size or patch_w < patch_size:
                padded_patch = np.zeros((patch_size, patch_size, 3), dtype=np.uint8)
                padded_patch[:patch_h, :patch_w] = patch
                patch_to_infer = padded_patch
            else:
                patch_to_infer = patch
                
            # Preprocesar
            augmented = transform(image=patch_to_infer)
            input_tensor = augmented['image'].unsqueeze(0).to(device)
            
            # Inferencia
            with torch.no_grad():
                output = model(input_tensor)
                
                # --- AJUSTE DE SENSIBILIDAD DINÁMICO ---
                # Calculamos los multiplicadores con base en lo que el usuario eligió en el frontend.
                
                # 1. Sensibilidad de Maleza (0 a 100 -> bias de 0.0 a 4.0)
                maleza_bias = (sensibilidad_maleza / 100.0) * 4.0
                
                # 2. Penalización de Suelo (Si el slider de contraste es alto, penalizamos al suelo)
                # Esto ayuda en fotos a vuelo bajo donde las flores amarillas se confunden con suelo.
                suelo_bias = ((50 - contraste_suelo) / 50.0) * 2.0
                output[:, 0, :, :] += suelo_bias
                
                # 3. Aplicación inteligente
                # Si el contraste es de "Ortomosaico" (< 60), aplicamos la regla estricta (no tocar suelo).
                # Si es de "Vuelo Bajo" (>= 60), aplicamos sesgo general para agarrar toda la maleza amarilla.
                if contraste_suelo < 60:
                    pred_original = torch.argmax(output, dim=1)
                    mask_biomasa = pred_original > 0
                    output[:, 2, :, :][mask_biomasa] += maleza_bias
                else:
                    output[:, 2, :, :] += maleza_bias
                
                pred_patch = torch.argmax(output, dim=1).squeeze(0).cpu().numpy()
            
            # Recortar el pedazo válido de la predicción (sin el padding negro del modelo)
            valid_pred_patch = pred_patch[:patch_h, :patch_w]
            
            # Identificar el fondo negro original del ortomosaico para ignorarlo
            patch_sum = np.sum(patch, axis=2, dtype=int)
            is_valid_pixel = patch_sum > 15
            
            # Asignar la clase 3 (Fondo) a los píxeles que son negros en el original
            valid_pred_patch[~is_valid_pixel] = 3
            
            # Sumar a contadores globales (solo se suman los válidos)
            total_suelo += np.sum(valid_pred_patch == 0)
            total_planta += np.sum(valid_pred_patch == 1)
            total_maleza += np.sum(valid_pred_patch == 2)
            
            # Pegar el pedazo en la máscara gigante
            full_pred_mask[y:y+patch_h, x:x+patch_w] = valid_pred_patch

    # Calcular porcentajes reales del ortomosaico ignorando el fondo negro
    total_valid_pixels = total_suelo + total_planta + total_maleza
    if total_valid_pixels > 0:
        planta_pct = int((total_planta / total_valid_pixels) * 100)
        maleza_pct = int((total_maleza / total_valid_pixels) * 100)
        suelo_pct = 100 - (planta_pct + maleza_pct)
    else:
        planta_pct = maleza_pct = suelo_pct = 0
    
    # Para la vista en el frontend, encogemos la original y la máscara para no trabar el navegador
    # Escala a un máximo de 1024px para el lado más largo
    max_dim = 1024
    scale = min(max_dim / width, max_dim / height)
    
    if scale < 1:
        new_width = int(width * scale)
        new_height = int(height * scale)
        resized_original = cv2.resize(original_img, (new_width, new_height))
        # Para redimensionar máscaras categóricas, usamos INTER_NEAREST para no inventar clases (ej. clase 1.5)
        resized_mask = cv2.resize(full_pred_mask, (new_width, new_height), interpolation=cv2.INTER_NEAREST)
    else:
        resized_original = original_img
        resized_mask = full_pred_mask
        
    # Colorear la máscara redimensionada
    color_mask = COLORS[resized_mask]
    
    # Mezclar la máscara con la imagen original
    img_plotted = cv2.addWeighted(resized_original, 0.6, color_mask, 0.4, 0)
    
    # Convertir analizada a Base64
    _, buffer = cv2.imencode('.jpg', img_plotted)
    img_base64 = base64.b64encode(buffer).decode('utf-8')
    
    # Convertir original (recortada) a Base64
    _, buffer_orig = cv2.imencode('.jpg', resized_original)
    orig_base64 = base64.b64encode(buffer_orig).decode('utf-8')
    
    return {
        "success": True,
        "image": f"data:image/jpeg;base64,{img_base64}",
        "original_image": f"data:image/jpeg;base64,{orig_base64}",
        "stats": {
            "planta": planta_pct,
            "maleza": maleza_pct,
            "suelo": suelo_pct
        },
        "metadata": {
            "iluminacion_pct": brightness_pct,
            "iluminacion_label": iluminacion_label,
            "escala": escala_label,
            "modo_ia": modo_ia_label
        }
    }
