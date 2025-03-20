require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
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

// Middleware básico
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Importación de rutas
const tipoAguaRoutes = require("./src/app/tipos-agua/routes/tipoAguaRoutes.js"); 
const resultadoRoutes = require("./src/app/ingreso-resultados/routes/resultadoRoutes.js");
const cambiosEstadoRoutes = require("./src/app/cambios-estado/routes/cambioEstadoRoutes.js");
const firmaRoutes = require("./src/app/firma-digital/routes/firmaRoutes.js");

// Definir las rutas
app.use("/api/tipos-agua", tipoAguaRoutes);
app.use("/api/ingreso-resultados", resultadoRoutes);
app.use("/api/cambio-estado", cambiosEstadoRoutes);
app.use("/api/firmas", firmaRoutes);

// Ruta para verificar PDFs
app.get("/check-pdf/:filename", (req, res) => {
  const filePath = path.join(__dirname, 'public', 'pdfs', req.params.filename);
  if (fs.existsSync(filePath)) {
    res.json({ exists: true, path: filePath });
  } else {
    res.json({ exists: false });
  }
});

// Ruta específica para PDFs
app.get("/pdfs/:filename", (req, res) => {
  const filePath = path.join(__dirname, 'public', 'pdfs', req.params.filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ mensaje: "PDF no encontrado" });
  }
});

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
  console.log(`Carpeta pública accesible en http://localhost:${PORT}/pdfs`);
});