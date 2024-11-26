# hl7-medical-risk-system

# HL7 Medical Risk System

This project is a modular system for calculating medical risks using HL7 FHIR standards. It includes:
- **FHIR Server**: A HAPI FHIR server to manage medical records.
- **Model Service**: A machine learning model API for risk prediction (FastAPI).
- **WebApp**: A frontend interface to interact with the system (Node.js).


Aquí está la versión actualizada de las instrucciones en tercera persona para el proyecto hl7-medical-risk-system.

Paso 1: Clonar el Repositorio
El usuario debe clonar el repositorio desde GitHub y acceder al directorio principal del proyecto:

bash
Copy code
git clone https://github.com/andresrosso/hl7-medical-risk-system.git
cd hl7-medical-risk-system
Paso 2: Estructura del Proyecto
El proyecto debe organizarse de la siguiente manera:

## Project Structure

``` graphql
hl7-medical-risk-system/
├── docker-compose.yml       # Define los servicios y puertos (FHIR, model-service, webapp)
├── fhir-server/             # (Opcional) Configuración futura del servidor FHIR
├── model-service/           # API del modelo predictivo (ML)
│   ├── Dockerfile
│   ├── main.py              # Punto de entrada del servicio
│   ├── random_forest_model.joblib  # Modelo entrenado (Random Forest)
│   ├── requirements.txt     # Dependencias del servicio
├── model-training/          # Entrenamiento de modelos (opcional)
│   ├── notebooks/
│   │   ├── train_model.ipynb        # Entrenamiento del modelo
│   │   ├── cardiovascular-risk.ipynb # Análisis cardiovascular
│   │   ├── dataset/                 # Datos de entrenamiento
│   │   └── Log_ROC.png             # Visualización del modelo
├── webapp/                  # Interfaz web
│   ├── Dockerfile
│   ├── public/
│   │   ├── css/                     # Archivos CSS (estilos)
│   │   ├── js/                      # Archivos JS para interacción frontend
│   ├── routes/
│   │   ├── form.js                  # Lógica del formulario
│   │   ├── fhir.js                  # Rutas para comunicarse con el servidor FHIR
│   │   └── prediction.js            # Rutas para conectarse con model-service
│   ├── services/
│   │   ├── fhirService.js           # Cliente para interactuar con el servidor FHIR
│   │   └── predictionService.js     # Cliente para interactuar con el modelo
│   ├── views/
│   │   ├── index.ejs                # Página de inicio del formulario
│   │   └── result.ejs               # Página para mostrar resultados
│   ├── app.js                       # Configuración de Express.js
│   └── package.json                 # Dependencias de la webapp
├── .gitignore
├── .env                             # Variables de entorno para configuraciones
└── README.md

```
