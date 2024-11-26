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
Copy code
hl7-medical-risk-system/
├── docker-compose.yml      # Define los servicios y puertos
├── fhir-server/            # Carpeta opcional para configuraciones futuras del servidor FHIR
├── model-service/          # API del modelo predictivo
│   ├── Dockerfile
│   ├── main.py
│   ├── requirements.txt
├── webapp/                 # Interfaz web
│   ├── Dockerfile
│   ├── public/
│   │   ├── css/
│   │   │   └── styles.css    # Estilos personalizados y Bootstrap
│   │   └── js/
│   │       └── form.js       # Validación y comportamiento del formulario
│   ├── routes/
│   │   ├── form.js           # Rutas relacionadas con el formulario
│   │   ├── fhir.js           # Interacciones con el servidor FHIR
│   │   └── prediction.js     # Interacciones con el servicio de predicción
│   ├── services/
│   │   ├── fhirService.js       # Lógica para comunicarse con el servidor FHIR
│   │   └── predictionService.js # Lógica para comunicarse con el modelo predictivo
│   ├── views/
│   │   ├── index.ejs         # Plantilla HTML del formulario
│   │   └── result.ejs        # Plantilla HTML para mostrar resultados
│   ├── app.js                # Configuración principal de Express
│   └── package.json
├────── .env                  # Generado: Variables de entorno (URLs del servidor)
│
│── .gitignore
└── README.md
```
