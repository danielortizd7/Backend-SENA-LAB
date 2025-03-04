require("dotenv").config();
console.log("MONGO_URI cargada:", process.env.MONGO_URI); 
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db.js");

//Verificar que MONGO_URI esté definido
if (!process.env.MONGO_URI) {
  console.error("ERROR: La variable de entorno MONGO_URI no está definida.");
  process.exit(1);
}

// 🔌 Conectar a MongoDB
connectDB();

// Inicializar la App
const app = express();

//Middlewares
app.use(cors());
app.use(express.json());

// Importar todas las rutas de los módulos
const tipoAguaRoutes = require("./app/routes/tipoAguaRoutes.js");
const resultadoRoutes = require("./app/routes/resultadoRoutes.js");
const cambiosEstadoRoutes = require("./app/routes/muestraRoutes.js");

//Definir rutas
app.use("/api/tipos-agua", tipoAguaRoutes);
app.use("/api/ingreso-resultados", resultadoRoutes);
app.use("/api/cambios-estado", cambiosEstadoRoutes);

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("API funcionando correctamente con todos los módulos");
});

// Middleware global de manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ mensaje: "Algo salió mal en el servidor", error: err.message });
});

// Puerto para ejecutar la API
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
