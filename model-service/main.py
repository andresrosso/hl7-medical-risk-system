import logging
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import joblib

MODEL_PATH = "random_forest_model.joblib"
# Configuración de logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

app = FastAPI()

FHIR_SERVER_URL = "http://fhir-server:8080/fhir"

class PatientRiskRequest(BaseModel):
    patient_id: str


@app.post("/predict-risk/")
async def predict_risk(request: PatientRiskRequest):
    """
    Endpoint para calcular el riesgo cardiovascular a 10 años basado en las 15 variables del paciente.
    """
    try:
        patient_id = request.patient_id
        logging.info(f"Starting risk prediction for Patient ID: {patient_id}")

        # Obtener datos del paciente
        patient = get_patient(patient_id)
        age = calculate_age(patient.get("birthDate"))
        gender = patient.get("gender")

        # Obtener observaciones
        observations = get_observations(patient_id)

        # Obtener condiciones médicas
        conditions = get_conditions(patient_id)

        # Obtener estado de medicamentos
        medication_status = get_medication_status(patient_id)

        # Extraer datos relevantes
        data = extract_patient_data(age, gender, observations, conditions, medication_status)

        # Calcular riesgo
        risk_score = calculate_risk(data)

        # Guardar resultado en FHIR
        risk_assessment_id = save_risk_assessment(patient_id, risk_score)

        return {
            "patient_id": patient_id,
            "risk_score": risk_score,
            "risk_class": "High" if risk_score > 0.5 else "Low",
            "risk_assessment_id": risk_assessment_id
        }
    except Exception as e:
        logging.error(f"Error during risk prediction: {str(e)}")
        raise HTTPException(status_code=500, detail="Error calculating risk")


def get_patient(patient_id):
    """
    Obtener información del paciente desde el recurso FHIR Patient.
    """
    response = requests.get(f"{FHIR_SERVER_URL}/Patient/{patient_id}")
    if response.status_code != 200:
        logging.error(f"Patient not found: {patient_id}")
        raise HTTPException(status_code=404, detail="Patient not found")
    return response.json()


def calculate_age(birth_date):
    """
    Calcular la edad del paciente a partir de su fecha de nacimiento.
    """
    from datetime import datetime
    if not birth_date:
        raise ValueError("Birth date is missing")
    birth_year = int(birth_date.split("-")[0])
    current_year = datetime.now().year
    return current_year - birth_year


def get_observations(patient_id):
    """
    Obtener las observaciones del paciente desde el recurso FHIR Observation.
    """
    response = requests.get(f"{FHIR_SERVER_URL}/Observation?subject=Patient/{patient_id}")
    if response.status_code != 200:
        logging.error(f"Observations not found for Patient ID: {patient_id}")
        raise HTTPException(status_code=404, detail="Observations not found")
    return response.json().get("entry", [])


def get_conditions(patient_id):
    """
    Obtener las condiciones médicas del paciente desde el recurso FHIR Condition.
    """
    response = requests.get(f"{FHIR_SERVER_URL}/Condition?subject=Patient/{patient_id}")
    if response.status_code != 200:
        logging.error(f"Conditions not found for Patient ID: {patient_id}")
        raise HTTPException(status_code=404, detail="Conditions not found")
    return response.json().get("entry", [])


def get_medication_status(patient_id):
    """
    Obtener el estado de medicamentos del paciente desde el recurso FHIR MedicationStatement.
    """
    response = requests.get(f"{FHIR_SERVER_URL}/MedicationStatement?subject=Patient/{patient_id}")
    if response.status_code != 200:
        logging.error(f"Medication status not found for Patient ID: {patient_id}")
        raise HTTPException(status_code=404, detail="Medication status not found")
    return response.json().get("entry", [])

def extract_patient_data(age, gender, observations, conditions, medication_status):
    """
    Extraer las 15 variables necesarias del conjunto de datos.
    """
    data = {
        "age": age,
        "gender": 1 if gender == "male" else 0,
        "BPMeds": 0,  # Valor por defecto
        "BMI": 0,
        "totChol": 0,
        "sysBP": 0,
        "diaBP": 0,
        "glucose": 0,
        "heartRate": 0,
        "is_smoking": 0,
        "education": 1,
        "cigsPerDay": 0,
        "prevalentStroke": 0,
        "prevalentHyp": 0,
        "diabetes": 0,
    }

    # Procesar medicamentos
    for entry in medication_status:
        medication = entry["resource"]
        medication_code = medication.get("medicationCodeableConcept", {}).get("coding", [{}])[0].get("code")
        status = medication.get("status", "stopped")
        if medication_code == "BP_MEDS" and status == "active":
            data["BPMeds"] = 1

    return data

def calculate_risk(data):
    """
    Calcular el riesgo basado en las 15 variables.
    
    risk_score = (
        (data["age"] or 0) / 100 +
        (data["BMI"] or 0) / 40 +
        (data["totChol"] or 0) / 300 +
        (data["sysBP"] or 0) / 200 +
        (data["diaBP"] or 0) / 120 +
        (data["glucose"] or 0) / 200 +
        (data["heartRate"] or 0) / 150 +
        (data["gender"] * 0.1) +
        (data["is_smoking"] * 0.1) +
        (data["BPMeds"] * 0.1) +  # Asegurar que no sea None
        (data["prevalentStroke"] * 0.2) +
        (data["prevalentHyp"] * 0.15) +
        (data["diabetes"] * 0.2) +
        (data["education"] or 0) / 4 +
        (data["cigsPerDay"] or 0) / 40
    ) / 15
    """
    logging.info("Making a prediction for patient")
    risk_score = get_prediction(data)
    logging.info("The stimated risk score is {}".format(risk_score))
    return risk_score

def get_prediction(data):
    """
    Load the trained model and use it to predict the risk based on patient data.
    """
    try:
        # Load the trained model
        logging.info("Loading the trained model...")
        model = joblib.load(MODEL_PATH)
        logging.info("Model loaded successfully.")

        # Ensure data is in the correct format for prediction
        input_data = [
            [
                data["age"],
                data["gender"],
                data["BPMeds"],
                data["BMI"],
                data["totChol"],
                data["sysBP"],
                data["diaBP"],
                data["glucose"],
                data["heartRate"],
                data["is_smoking"],
                data["education"],
                data["cigsPerDay"],
                data["prevalentStroke"],
                data["prevalentHyp"],
                data["diabetes"]
            ]
        ]

        # Make the prediction
        logging.info("Making prediction...")
        prediction = model.predict_proba(input_data)[0][1]  # Probability of the positive class (e.g., "High Risk")

        return prediction

    except FileNotFoundError:
        logging.error(f"Model file not found at {MODEL_PATH}. Ensure the model is trained and saved.")
        raise HTTPException(status_code=500, detail="Model file not found.")
    except Exception as e:
        logging.error(f"Error during prediction: {e}")
        raise HTTPException(status_code=500, detail="Error during prediction.")


def save_risk_assessment(patient_id, risk_score):
    """
    Guardar el resultado de la predicción en el recurso FHIR RiskAssessment.
    """
    try:
        response = requests.post(f"{FHIR_SERVER_URL}/RiskAssessment", json={
            "resourceType": "RiskAssessment",
            "subject": {"reference": f"Patient/{patient_id}"},
            "prediction": [
                {
                    "outcome": {"text": "TenYearCHD"},
                    "probabilityDecimal": risk_score
                }
            ]
        })
        response.raise_for_status()
        logging.info(f"RiskAssessment saved for Patient ID: {patient_id}")
        return response.json()["id"]
    except Exception as e:
        logging.error(f"Error saving RiskAssessment: {e}")
        raise
