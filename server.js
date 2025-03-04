require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db.js");

// Conexión a la base de datos
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

//Importamos rutas
const tipoAguaRoutes = require("./app/routes/tipoAguaRoutes.js");
const resultadoRoutes = require("./app/routes/resultadoRoutes.js");
const cambiosEstadoRoutes = require("./app/routes/cambioEstadoRoutes.js");

// Usamos las rutas
app.use("/api/tipos-agua", tipoAguaRoutes);
app.use("/api/ingreso-resultados", resultadoRoutes);
app.use("/api/cambio-estado", cambiosEstadoRoutes);


// Ruta de prueba 
app.get("/", (req, res) => {
  res.send("API funcionando correctamente con todos los módulos");
});

// Middleware de errores
app.use((err, req, res, next) => {
  console.error("ERROR DETECTADO:", err.stack);
  res.status(500).json({ mensaje: "Algo salió mal en el servidor", error: err.message });
});

// Puerto
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
