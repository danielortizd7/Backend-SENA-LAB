require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db.js");

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

const tipoAguaRoutes = require("./src/app/tipos-agua/routes/tipoAguaRoutes.js");
const resultadoRoutes = require("./src/app/ingreso-resultados/routes/resultadoRoutes.js");
const cambiosEstadoRoutes = require("./src/app/cambios-estado/routes/cambioEstadoRoutes.js");
const firmaRoutes = require("./src/app/firma-digital/routes/firmaRoutes.js");

// Configurar la carpeta public para archivos estáticos
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/tipos-agua", tipoAguaRoutes);
app.use("/api/ingreso-resultados", resultadoRoutes);
app.use("/api/cambio-estado", cambiosEstadoRoutes);
app.use("/api/firmas", firmaRoutes);

app.get("/", (req, res) => {
  res.send("API funcionando correctamente con todos los módulos");
});

app.use((err, req, res, next) => {
  console.error("ERROR DETECTADO:", err.stack);
  res.status(500).json({ mensaje: "Algo salió mal en el servidor", error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});