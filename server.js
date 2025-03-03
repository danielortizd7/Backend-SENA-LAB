const mongoose = require('mongoose');
const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db.js");

// Inicializar la App
const app = express();

// 🔌 Conectar a MongoDB una sola vez
connectDB();

// ✅ Middlewares
app.use(cors());
app.use(express.json());

// Importar todas las rutas de los módulos

// Dominio Tipos de Agua
const tipoAguaRoutes = require("./app/modules/tipos-agua/routes/tipoAguaRoutes.js");

// Dominio Ingreso Resultados
const resultadoRoutes = require("./app/modules/ingreso-resultados/routes/resultadoRoutes.js");

// Dominio Cambio de Estado
const cambiosEstadoRoutes = require("./app/modules/cambios-estado/routes/muestraRoutes.js");


// 🔥 Definimos las rutas
app.use("/api/tipos-agua", tipoAguaRoutes);
app.use("/api/ingreso-resultados", resultadoRoutes);
app.use("/api/cambios-estado", cambiosEstadoRoutes);

// Ruta de Prueba
app.get("/", (req, res) => {
  res.send("🔥 API funcionando correctamente con todos los módulos");
});

// Middleware para manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ mensaje: "Algo salió mal en el servidor", error: err.message });
});

// Puerto para ejecutar la API
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
