require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db.js");
const muestrasRoutes = require("./src/app/registro-muestras/routes/muestrasRoutes.js");
const { verificarDocumento, verificarRolAdministrador } = require("./src/shared/middleware/authMiddleware.js");

connectDB();

const app = express();

// Log de todas las peticiones
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Configuración de CORS
const corsOptions = {
    origin: [
        'http://localhost:8080',
        'http://localhost:3000',
        'https://back-usuarios-f.onrender.com'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Accept',
        'Origin',
        'X-Requested-With',
        'X-Usuario-Documento'
    ],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Parsear JSON
app.use(express.json());

// Log del body en peticiones POST
app.use((req, res, next) => {
    if (req.method === 'POST') {
        console.log('Body recibido:', req.body);
    }
    next();
});

// Configurar la carpeta public para archivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// Rutas protegidas que requieren validación de documento y rol
app.use("/api/registro-muestras", verificarDocumento, verificarRolAdministrador, (req, res, next) => {
    console.log('Usuario validado:', { documento: req.documento, rol: req.rolInfo });
    next();
}, muestrasRoutes);

// Manejo de errores
app.use((err, req, res, next) => {
    console.error('Error detectado:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: err.message
    });
});

const PORT = process.env.PORT || 5000;

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log('CORS habilitado para orígenes específicos');
    console.log('Rutas disponibles:');
    console.log('- POST /api/registro-muestras/muestras (requiere validación de documento y rol)');
    console.log('- GET /api/registro-muestras/muestras (requiere validación de documento y rol)');
});