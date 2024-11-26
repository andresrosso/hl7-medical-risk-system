const express = require("express");
const router = express.Router();
const fhirService = require("../services/fhirService");
const predictionService = require("../services/predictionService");

// Página principal: Mostrar formulario
router.get("/", (req, res) => {
    res.render("index", { activeTab: "form" });
});

// Obtener lista de pacientes
router.get("/patients", async (req, res) => {
    try {
        res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.set("Expires", "0");
        res.set("Pragma", "no-cache");
        res.set("Surrogate-Control", "no-store");
        
        const patients = await fhirService.getAllPatients();
        res.json(patients);
    } catch (error) {
        console.error(`[ERROR] ${error.message}`);
        res.status(500).json({ error: "Error fetching patient list." });
    }
});

// Procesar datos del formulario
router.post("/submit", async (req, res) => {
    try {
        const patientData = req.body;

        // Crear recursos FHIR
        const patientId = await fhirService.createPatient(patientData);
        await fhirService.createObservations(patientId, patientData);
        await fhirService.createConditions(patientId, patientData);
        await fhirService.createMedicationStatement(patientId, patientData);

        // Obtener predicción
        const prediction = await predictionService.getPrediction(patientId);

        // Fetch updated patient list
        const patients = await fhirService.getAllPatients();

        res.render("result", {
            patientId,
            prediction,
            activeTab: "form"
        });
    } catch (error) {
        console.error(`[ERROR] ${error.message}`);
        res.status(500).send("An error occurred while processing the data.");
    }
});

// Eliminar un paciente
router.post("/delete", async (req, res) => {
    const { id } = req.body;
    try {
        await fhirService.deletePatient(id);
        res.json({ success: true });
    } catch (error) {
        console.error(`[ERROR] ${error.message}`);
        res.status(500).json({ error: "Error deleting patient." });
    }
});

module.exports = router;
