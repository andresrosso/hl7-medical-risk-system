const axios = require("axios");

const MODEL_SERVICE_URL = "http://model-service:8000";

const getPrediction = async (patientId) => {
    const response = await axios.post(`${MODEL_SERVICE_URL}/predict-risk`, { patient_id: patientId });
    return response.data;
};

module.exports = { getPrediction };
