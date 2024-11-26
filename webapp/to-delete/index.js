const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const FHIR_SERVER_URL = "http://fhir-server:8080/fhir";
const MODEL_SERVICE_URL = "http://model-service:8000";

// Configuración de logging
const log = (message, level = "info") => {
    const levels = { info: "INFO", error: "ERROR" };
    console.log(`[${new Date().toISOString()}] [${levels[level] || "INFO"}] ${message}`);
};

// Página principal para ingresar datos del paciente
app.get("/", (req, res) => {
    res.send(`
        <form method="POST" action="/submit">
            <h1>Enter Patient Data</h1>
            <label>Name: <input type="text" name="name" required /></label><br />
            <label>Gender: 
                <select name="gender">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                </select>
            </label><br />
            <label>Birth Date (YYYY-MM-DD): <input type="date" name="birthDate" required /></label><br />
            <label>Education (1-4): <input type="number" min="1" max="4" name="education" required /></label><br />
            <label>Smoking: <input type="checkbox" name="is_smoking" value="true" /></label><br />
            <label>Cigs Per Day: <input type="number" step="0.1" name="cigsPerDay" required /></label><br />
            <label>Total Cholesterol: <input type="number" step="0.1" name="totChol" required /></label><br />
            <label>Systolic BP: <input type="number" step="0.1" name="sysBP" required /></label><br />
            <label>Diastolic BP: <input type="number" step="0.1" name="diaBP" required /></label><br />
            <label>BMI: <input type="number" step="0.1" name="BMI" required /></label><br />
            <label>Heart Rate: <input type="number" step="0.1" name="heartRate" required /></label><br />
            <label>Glucose: <input type="number" step="0.1" name="glucose" required /></label><br />
            <label>On BP Medication: <input type="checkbox" name="BPMeds" value="true" /></label><br />
            <label>Prevalent Stroke: <input type="checkbox" name="prevalentStroke" value="true" /></label><br />
            <label>Prevalent Hypertension: <input type="checkbox" name="prevalentHyp" value="true" /></label><br />
            <label>Diabetes: <input type="checkbox" name="diabetes" value="true" /></label><br />
            <button type="submit">Submit</button>
        </form>
    `);
});

// Procesar datos del paciente y generar recursos FHIR
app.post("/submit", async (req, res) => {
    try {
        const patientData = req.body;
        log(`Received data for patient: ${JSON.stringify(patientData)}`);

        // Crear recurso Patient
        const patientId = await createPatient(patientData);

        // Crear Observaciones
        await createObservations(patientId, patientData);

        // Crear Condiciones Médicas
        await createConditions(patientId, patientData);

        // Crear Estado de Medicamentos
        await createMedicationStatement(patientId, patientData);

        // Enviar a predicción
        const prediction = await getPrediction(patientId);

        res.send(`
            <h1>Prediction Result</h1>
            <p>Patient ID: ${patientId}</p>
            <p>Risk Score: ${prediction.risk_score}</p>
            <p>Risk Class: ${prediction.risk_class}</p>
            <p>RiskAssessment ID: ${prediction.risk_assessment_id}</p>
            <a href="/">Back</a>
        `);
    } catch (error) {
        log(`Error processing patient data: ${error.message}`, "error");
        res.status(500).send("An error occurred while processing the data.");
    }
});

// Función para crear el recurso Patient
async function createPatient(data) {
    try {
        const response = await axios.post(`${FHIR_SERVER_URL}/Patient`, {
            resourceType: "Patient",
            name: [{ use: "official", text: data.name }],
            gender: data.gender,
            birthDate: data.birthDate
        });
        log(`Patient created with ID: ${response.data.id}`);
        return response.data.id;
    } catch (error) {
        log(`Error creating Patient resource: ${error.message}`, "error");
        throw error;
    }
}

// Función para crear recursos Observation
async function createObservations(patientId, data) {
    const observations = [
        { code: "39156-5", display: "BMI", value: data.BMI, unit: "kg/m2" },
        { code: "2093-3", display: "Total Cholesterol", value: data.totChol, unit: "mg/dL" },
        { code: "8480-6", display: "Systolic Blood Pressure", value: data.sysBP, unit: "mmHg" },
        { code: "8462-4", display: "Diastolic Blood Pressure", value: data.diaBP, unit: "mmHg" },
        { code: "15074-8", display: "Glucose", value: data.glucose, unit: "mg/dL" },
        { code: "8867-4", display: "Heart Rate", value: data.heartRate, unit: "bpm" },
        { code: "72166-2", display: "Smoking Status", value: data.is_smoking === "true", unit: null },
        { code: "new-code-edu", display: "Education", value: data.education, unit: null },
        { code: "new-code-cig", display: "Cigarettes Per Day", value: data.cigsPerDay, unit: "cig/day" }
    ];

    for (const obs of observations) {
        try {
            await axios.post(`${FHIR_SERVER_URL}/Observation`, {
                resourceType: "Observation",
                status: "final",
                code: { coding: [{ system: "http://loinc.org", code: obs.code, display: obs.display }] },
                valueQuantity: obs.unit ? { value: obs.value, unit: obs.unit } : { valueBoolean: obs.value },
                subject: { reference: `Patient/${patientId}` }
            });
            log(`Observation created for ${obs.display}`);
        } catch (error) {
            log(`Error creating Observation (${obs.display}): ${error.message}`, "error");
            throw error;
        }
    }
}

// Función para crear recursos Condition
async function createConditions(patientId, data) {
    const conditions = [
        { code: "160245001", display: "Stroke", present: data.prevalentStroke === "true" },
        { code: "59621000", display: "Hypertension", present: data.prevalentHyp === "true" },
        { code: "44054006", display: "Diabetes", present: data.diabetes === "true" }
    ];

    for (const cond of conditions) {
        if (cond.present) {
            try {
                await axios.post(`${FHIR_SERVER_URL}/Condition`, {
                    resourceType: "Condition",
                    code: { coding: [{ system: "http://snomed.info/sct", code: cond.code, display: cond.display }] },
                    subject: { reference: `Patient/${patientId}` }
                });
                log(`Condition created for ${cond.display}`);
            } catch (error) {
                log(`Error creating Condition (${cond.display}): ${error.message}`, "error");
                throw error;
            }
        }
    }
}

// Función para crear recurso MedicationStatement
// Función para crear recurso MedicationStatement
async function createMedicationStatement(patientId, data) {
  try {
      const medicationStatus = data.BPMeds === "true" ? "active" : "stopped";
      const response = await axios.post(`${FHIR_SERVER_URL}/MedicationStatement`, {
          resourceType: "MedicationStatement",
          medicationCodeableConcept: {
              coding: [
                  {
                      system: "http://hl7.org/fhir/sid/ndc",
                      code: "BP_MEDS",
                      display: "Blood Pressure Medication"
                  }
              ]
          },
          status: medicationStatus,
          subject: { reference: `Patient/${patientId}` }
      });
      log(`MedicationStatement created for BP Meds with status: ${medicationStatus}`);
  } catch (error) {
      log("Error creating MedicationStatement for BP Meds", "error");
      throw error;
  }
}

// Función para realizar la predicción
async function getPrediction(patientId) {
    try {
        const response = await axios.post(`${MODEL_SERVICE_URL}/predict-risk`, { patient_id: patientId });
        log(`Prediction result: ${JSON.stringify(response.data)}`);
        return response.data;
    } catch (error) {
        log(`Error fetching prediction: ${error.message}`, "error");
        throw error;
    }
}

// Iniciar el servidor
const PORT = 3000;
app.listen(PORT, () => log(`WebApp running on http://localhost:${PORT}`));
