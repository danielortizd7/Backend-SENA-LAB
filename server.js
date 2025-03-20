require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db.js");
const authMiddleware = require("./src/shared/middleware/authMiddleware.js");

// Conectar a la base de datos
connectDB()
  .then(() => console.log("📡 Conectado a la base de datos"))
  .catch((err) => {
    console.error("❌ Error conectando a la base de datos:", err);
    process.exit(1);
  });

const app = express();

app.use(cors());
app.use(express.json());

// Importación de rutas
const tipoAguaRoutes = require("./src/app/tipos-agua/routes/tipoAguaRoutes.js"); 
const resultadoRoutes = require("./src/app/ingreso-resultados/routes/resultadoRoutes.js");
const cambiosEstadoRoutes = require("./src/app/cambios-estado/routes/cambioEstadoRoutes.js");
const firmaRoutes = require("./src/app/firma-digital/routes/firmaRoutes.js");

// Definir las rutas
app.use("/api/tipos-agua", tipoAguaRoutes);
app.use("/api/ingreso-resultados", resultadoRoutes);
app.use("/api/cambio-estado", cambiosEstadoRoutes);
app.use(express.static('public')); 
app.use("/api/firmas", firmaRoutes);

// Ruta de prueba 
app.get("/", (req, res) => {
  res.send("✅ API funcionando correctamente con todos los módulos");
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error("❌ ERROR DETECTADO:", err.stack);
  res.status(500).json({ mensaje: "Algo salió mal en el servidor", error: err.message });
});

// Puerto
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
