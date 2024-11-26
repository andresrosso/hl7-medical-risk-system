const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");

const formRoutes = require("./routes/form");

const app = express();

// Configurar motor de plantillas (EJS)
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// Rutas
app.use("/", formRoutes);

// Iniciar el servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`[${new Date().toISOString()}] Server running on http://localhost:${PORT}`);
});
