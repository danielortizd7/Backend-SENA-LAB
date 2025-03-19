require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db.js");

// Inicializar la base de datos
connectDB();

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Importar rutas de los módulos
const tipoAguaRoutes = require("./app/tipos-agua/routes/tipoAguaRoutes.js");
const resultadoRoutes = require("./app/resultados/routes/resultadoRoutes.js");
const cambiosEstadoRoutes = require("./app/estados/routes/cambioEstadoRoutes.js");
const firmaRoutes = require("./app/firmas/routes/firmaRoutes.js");
const muestrasRoutes = require("./app/muestras/routes/muestras.js");

// Configurar rutas estáticas
app.use("/pdfs", express.static(path.join(__dirname, "storage/pdfs")));

// Configurar rutas de la API
app.use("/api/tipos-agua", tipoAguaRoutes);
app.use("/api/ingreso-resultados", resultadoRoutes);
app.use("/api/cambio-estado", cambiosEstadoRoutes);
app.use("/api/firmas", firmaRoutes);
app.use("/api/muestras", muestrasRoutes);

// Ruta principal
app.get("/", (req, res) => {
  res.send("API funcionando correctamente con todos los módulos");
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error("ERROR DETECTADO:", err.stack);
  res.status(500).json({ mensaje: "Algo salió mal en el servidor", error: err.message });
});

// Función para intentar diferentes puertos
const startServer = (port) => {
  try {
    app.listen(port, () => {
      console.log(`Servidor corriendo en http://localhost:${port}`);
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Puerto ${port} en uso, intentando con el puerto ${port + 1}...`);
        startServer(port + 1);
      } else {
        console.error('Error al iniciar el servidor:', err);
      }
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
  }
};

// Iniciar servidor con el puerto inicial
const PORT = process.env.PORT || 5000;
startServer(PORT);
