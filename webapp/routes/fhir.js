const express = require("express");
const router = express.Router();
const fhirService = require("../services/fhirService");

// Endpoint para probar el servidor FHIR
router.get("/fhir/status", async (req, res) => {
    try {
        const status = await fhirService.checkServerStatus();
        res.json({ status });
    } catch (error) {
        console.error(`[ERROR] ${error.message}`);
        res.status(500).json({ error: "Unable to reach FHIR server." });
    }
});

module.exports = router;
