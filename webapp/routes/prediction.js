const express = require("express");
const router = express.Router();
const predictionService = require("../services/predictionService");

// Endpoint para probar el servicio de predicción
router.post("/predict", async (req, res) => {
    try {
        const { patientId } = req.body;
        const prediction = await predictionService.getPrediction(patientId);
        res.json(prediction);
    } catch (error) {
        console.error(`[ERROR] ${error.message}`);
        res.status(500).json({ error: "Prediction failed." });
    }
});

module.exports = router;
