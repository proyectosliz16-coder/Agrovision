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

# Colores para la máscara (Suelo: Café, Frijol: Verde, Maleza: Azul)
# OpenCV usa BGR, no RGB
COLORS = np.array([
    [19, 69, 139],    # 0: Suelo
    [44, 160, 44],    # 1: Frijol
    [255, 0, 0]       # 2: Maleza (Azul en BGR)
], dtype=np.uint8)

@app.post("/api/analyze")
async def analyze_image(file: UploadFile = File(...)):
    if not model:
        return {"error": "El modelo no está cargado. Asegúrate de tener modelo_frijol_v2.pth en la carpeta principal de tu proyecto."}
    
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    original_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Preprocesar imagen igual que en tu DatasetAgro
    image_rgb = cv2.cvtColor(original_img, cv2.COLOR_BGR2RGB)
    augmented = transform(image=image_rgb)
    input_tensor = augmented['image'].unsqueeze(0).to(device)
    
    # Hacer la predicción con el U-Net sin usar gradientes para que sea rápido
    with torch.no_grad():
        output = model(input_tensor)
        # argmax elige la clase con mayor probabilidad para cada píxel (Suelo, Frijol o Maleza)
        pred_mask = torch.argmax(output, dim=1).squeeze(0).cpu().numpy()
        
    # Calcular porcentajes matemáticos basándonos en los píxeles de la máscara 512x512
    total_pixels = pred_mask.size
    suelo_pixels = np.sum(pred_mask == 0)
    planta_pixels = np.sum(pred_mask == 1)
    maleza_pixels = np.sum(pred_mask == 2)
    
    planta_pct = int((planta_pixels / total_pixels) * 100)
    maleza_pct = int((maleza_pixels / total_pixels) * 100)
    suelo_pct = 100 - (planta_pct + maleza_pct)
    
    # Crear la imagen visual coloreada pintando los píxeles según su clase
    color_mask = COLORS[pred_mask]
    
    # Mezclar la máscara con la imagen original (redimensionada a 512x512 para que coincida)
    resized_original = cv2.resize(original_img, (512, 512))
    img_plotted = cv2.addWeighted(resized_original, 0.6, color_mask, 0.4, 0)
    
    # Convertir a Base64 para mandarla a React
    _, buffer = cv2.imencode('.jpg', img_plotted)
    img_base64 = base64.b64encode(buffer).decode('utf-8')
    
    return {
        "success": True,
        "image": f"data:image/jpeg;base64,{img_base64}",
        "stats": {
            "planta": planta_pct,
            "maleza": maleza_pct,
            "suelo": suelo_pct
        }
    }
