document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#patientForm");

    form.addEventListener("submit", (event) => {
        let isValid = true;

        // Helper function to highlight invalid fields
        const highlightError = (element, message) => {
            element.classList.add("is-invalid");
            const errorFeedback = element.nextElementSibling;
            if (errorFeedback && errorFeedback.classList.contains("invalid-feedback")) {
                errorFeedback.innerText = message;
            } else {
                const errorFeedback = document.createElement("div");
                errorFeedback.className = "invalid-feedback";
                errorFeedback.innerText = message;
                element.parentNode.appendChild(errorFeedback);
            }
        };

        // Clear previous error highlights
        const clearErrors = () => {
            const invalidElements = form.querySelectorAll(".is-invalid");
            invalidElements.forEach((el) => {
                el.classList.remove("is-invalid");
                const feedback = el.nextElementSibling;
                if (feedback && feedback.classList.contains("invalid-feedback")) {
                    feedback.remove();
                }
            });
        };

        clearErrors();

        // Validate required fields
        const requiredFields = [
            { field: "name", message: "Name is required." },
            { field: "birthDate", message: "Birth date is required." },
            { field: "education", message: "Education must be a value between 1 and 4." },
            { field: "cigsPerDay", message: "Cigarettes per day must be a positive number." },
            { field: "totChol", message: "Total cholesterol must be a positive number." },
            { field: "sysBP", message: "Systolic BP must be a positive number." },
            { field: "diaBP", message: "Diastolic BP must be a positive number." },
            { field: "BMI", message: "BMI must be a positive number." },
            { field: "heartRate", message: "Heart rate must be a positive number." },
            { field: "glucose", message: "Glucose must be a positive number." }
        ];

        requiredFields.forEach(({ field, message }) => {
            const element = form.elements[field];
            if (!element || element.value.trim() === "") {
                isValid = false;
                highlightError(element, message);
            }
        });

        // Validate ranges and specific formats
        const education = parseInt(form.elements["education"].value);
        if (isNaN(education) || education < 1 || education > 4) {
            isValid = false;
            highlightError(form.elements["education"], "Education must be a value between 1 and 4.");
        }

        const cigsPerDay = parseFloat(form.elements["cigsPerDay"].value);
        if (isNaN(cigsPerDay) || cigsPerDay < 0) {
            isValid = false;
            highlightError(form.elements["cigsPerDay"], "Cigarettes per day must be a positive number.");
        }

        const totChol = parseFloat(form.elements["totChol"].value);
        if (isNaN(totChol) || totChol <= 0) {
            isValid = false;
            highlightError(form.elements["totChol"], "Total cholesterol must be a positive number.");
        }

        const sysBP = parseFloat(form.elements["sysBP"].value);
        if (isNaN(sysBP) || sysBP <= 0) {
            isValid = false;
            highlightError(form.elements["sysBP"], "Systolic BP must be a positive number.");
        }

        const diaBP = parseFloat(form.elements["diaBP"].value);
        if (isNaN(diaBP) || diaBP <= 0) {
            isValid = false;
            highlightError(form.elements["diaBP"], "Diastolic BP must be a positive number.");
        }

        const BMI = parseFloat(form.elements["BMI"].value);
        if (isNaN(BMI) || BMI <= 0) {
            isValid = false;
            highlightError(form.elements["BMI"], "BMI must be a positive number.");
        }

        const heartRate = parseFloat(form.elements["heartRate"].value);
        if (isNaN(heartRate) || heartRate <= 0) {
            isValid = false;
            highlightError(form.elements["heartRate"], "Heart rate must be a positive number.");
        }

        const glucose = parseFloat(form.elements["glucose"].value);
        if (isNaN(glucose) || glucose <= 0) {
            isValid = false;
            highlightError(form.elements["glucose"], "Glucose must be a positive number.");
        }

        // Prevent form submission if invalid
        if (!isValid) {
            event.preventDefault();
            console.log("Validation errors detected.");
        }
    });
});
