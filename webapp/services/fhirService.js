const axios = require("axios");

const FHIR_SERVER_URL = "http://fhir-server:8080/fhir";

const createPatient = async (data) => {
    const response = await axios.post(`${FHIR_SERVER_URL}/Patient`, {
        resourceType: "Patient",
        name: [{ use: "official", text: data.name }],
        gender: data.gender,
        birthDate: data.birthDate
    });
    return response.data.id;
};

async function searchRiskAssessments(patientId) {
    const url = `${FHIR_SERVER_URL}/RiskAssessment?subject=Patient/${patientId}`;
    const response = await axios.get(url, { headers: { Accept: "application/json" } });
    return response.data.entry?.map((entry) => entry.resource) || [];
}

async function deleteResource(resourceType, resourceId) {
    const url = `${FHIR_SERVER_URL}/${resourceType}/${resourceId}`;
    await axios.delete(url, { headers: { Accept: "application/json" } });
}

const createObservations = async (patientId, data) => {
    const observations = [
        { code: "39156-5", display: "BMI", value: data.BMI, unit: "kg/m2" },
        { code: "2093-3", display: "Total Cholesterol", value: data.totChol, unit: "mg/dL" },
        { code: "8480-6", display: "Systolic Blood Pressure", value: data.sysBP, unit: "mmHg" },
        { code: "8462-4", display: "Diastolic Blood Pressure", value: data.diaBP, unit: "mmHg" },
        { code: "15074-8", display: "Glucose", value: data.glucose, unit: "mg/dL" },
        { code: "8867-4", display: "Heart Rate", value: data.heartRate, unit: "bpm" },
        {
            code: "72166-2",
            display: "Smoking Status",
            value: data.is_smoking === "true"
                ? { coding: [{ code: "LA18976-3", display: "Current smoker" }] }
                : { coding: [{ code: "LA15920-4", display: "Non-smoker" }] },
            type: "valueCodeableConcept"
        },
        { code: "edu", display: "Education", value: data.education, unit: null },
        { code: "cig", display: "Cigarettes Per Day", value: data.cigsPerDay, unit: "cig/day" }
    ];

    for (const obs of observations) {
        const payload = {
            resourceType: "Observation",
            status: "final",
            code: { coding: [{ system: "http://loinc.org", code: obs.code, display: obs.display }] },
            subject: { reference: `Patient/${patientId}` }
        };

        if (obs.type === "valueCodeableConcept") {
            payload.valueCodeableConcept = obs.value;
        } else {
            payload.valueQuantity = { value: obs.value, unit: obs.unit };
        }

        await axios.post(`${FHIR_SERVER_URL}/Observation`, payload);
    }
};

const createConditions = async (patientId, data) => {
    const conditions = [
        { code: "160245001", display: "Stroke", present: data.prevalentStroke === "true" },
        { code: "59621000", display: "Hypertension", present: data.prevalentHyp === "true" },
        { code: "44054006", display: "Diabetes", present: data.diabetes === "true" }
    ];

    for (const cond of conditions) {
        if (cond.present) {
            await axios.post(`${FHIR_SERVER_URL}/Condition`, {
                resourceType: "Condition",
                code: { coding: [{ system: "http://snomed.info/sct", code: cond.code, display: cond.display }] },
                subject: { reference: `Patient/${patientId}` }
            });
        }
    }
};

const createMedicationStatement = async (patientId, data) => {
    const medicationStatus = data.BPMeds === "true" ? "active" : "stopped";
    await axios.post(`${FHIR_SERVER_URL}/MedicationStatement`, {
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
};

const deletePatient = async (patientId) => {
    try {
        // Delete related Observations
        const observations = await axios.get(`${FHIR_SERVER_URL}/Observation?subject=Patient/${patientId}`);
        if (observations.data.entry) {
            for (const obs of observations.data.entry) {
                await axios.delete(`${FHIR_SERVER_URL}/Observation/${obs.resource.id}`);
            }
        }

        // Delete related Conditions
        const conditions = await axios.get(`${FHIR_SERVER_URL}/Condition?subject=Patient/${patientId}`);
        if (conditions.data.entry) {
            for (const cond of conditions.data.entry) {
                await axios.delete(`${FHIR_SERVER_URL}/Condition/${cond.resource.id}`);
            }
        }

        // Delete related MedicationStatements
        const medications = await axios.get(`${FHIR_SERVER_URL}/MedicationStatement?subject=Patient/${patientId}`);
        if (medications.data.entry) {
            for (const med of medications.data.entry) {
                await axios.delete(`${FHIR_SERVER_URL}/MedicationStatement/${med.resource.id}`);
            }
        }

        // Delete RiskAssessments
        const riskAssessmentsResponse = await axios.get(`${FHIR_SERVER_URL}/RiskAssessment?subject=Patient/${patientId}`);
        const riskAssessments = riskAssessmentsResponse.data.entry || [];

        if (Array.isArray(riskAssessments)) {
            for (const riskAssessment of riskAssessments) {
                await deleteResource("RiskAssessment", riskAssessment.resource.id);
            }
        } else {
            console.warn(`Expected array for RiskAssessments but got:`, riskAssessments);
        }

        // Delete the Patient
        await axios.delete(`${FHIR_SERVER_URL}/Patient/${patientId}`);
        console.log(`Patient ${patientId} and related resources deleted successfully.`);
    } catch (error) {
        console.error(`Error deleting patient ${patientId}: ${error.message}`);
        throw error;
    }
};

// New function to get all patients
const getAllPatients = async () => {
    try {
        const response = await axios.get(`${FHIR_SERVER_URL}/Patient`);
        const patients = response.data.entry || [];

        const patientList = await Promise.all(
            patients.map(async (entry) => {
                const patient = entry.resource;
                const age = new Date().getFullYear() - new Date(patient.birthDate).getFullYear();

                // Fetch conditions for the patient
                const conditionsResponse = await axios.get(
                    `${FHIR_SERVER_URL}/Condition?subject=Patient/${patient.id}`
                );
                const conditions = conditionsResponse.data.entry || [];
                const diabetes = conditions.some((cond) => cond.resource.code.coding[0].code === "44054006");
                const prevalentStroke = conditions.some((cond) => cond.resource.code.coding[0].code === "160245001");
                const prevalentHyp = conditions.some((cond) => cond.resource.code.coding[0].code === "59621000");

                return {
                    id: patient.id,
                    name: patient.name[0]?.text || "Unknown",
                    age,
                    diabetes,
                    prevalentStroke,
                    prevalentHyp,
                    tenYearCHD: false // Placeholder, update with real data if available
                };
            })
        );

        return patientList;
    } catch (error) {
        console.error("Error fetching patients:", error.message);
        throw error;
    }
};


module.exports = {
    searchRiskAssessments,
    deleteResource,
    createPatient,
    createObservations,
    createConditions,
    createMedicationStatement,
    deletePatient,
    getAllPatients
};
