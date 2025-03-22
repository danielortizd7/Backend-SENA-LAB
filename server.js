require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db.js");
const { router: authRoutes, verificarToken } = require("./src/app/auth/routes/authRoutes.js");
const muestrasRoutes = require("./src/app/registro-muestras/routes/muestrasRoutes.js");

connectDB();

const app = express();

// Log de todas las peticiones
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Configuración de CORS más específica
app.use(cors({
    origin: ['http://localhost:8080', 'http://127.0.0.1:8080'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true
}));

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

// Configurar rutas
app.use("/api/auth", authRoutes);

// Rutas protegidas que requieren autenticación
app.use("/api/registro-muestras", verificarToken, (req, res, next) => {
    console.log('Usuario autenticado:', req.usuario);
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
    console.log('CORS habilitado para:', ['http://localhost:8080', 'http://127.0.0.1:8080']);
    console.log('Rutas disponibles:');
    console.log('- POST /api/auth/login');
    console.log('- GET /api/auth/verificar');
    console.log('- POST /api/registro-muestras/muestras (requiere autenticación)');
    console.log('- GET /api/registro-muestras/muestras (requiere autenticación)');
});