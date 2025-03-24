require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db.js");
const { ResponseHandler } = require('./src/shared/utils/responseHandler');

// Importar rutas
const muestrasRoutes = require("./src/app/registro-muestras/routes/muestrasRoutes.js");
const registroMuestrasRoutes = require("./src/app/registro-muestras/routes/registroMuestrasRoutes.js");
const tiposAguaRoutes = require("./src/app/registro-muestras/routes/tiposAguaRoutes.js");
const cambiosEstadoRoutes = require("./src/app/cambios-estado/routes/cambioEstadoRoutes.js");
const resultadosRoutes = require("./src/app/ingreso-resultados/routes/resultadoRoutes.js");
const firmaRoutes = require("./src/app/firma-digital/routes/firmaRoutes.js");

const { verificarToken, login } = require('./src/shared/middleware/authMiddleware');

const app = express();

// Conectar a la base de datos
connectDB();

// Middleware para logging de requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    next();
});

// Configuración de CORS
app.use(cors({
    origin: '*', // Permitir todos los orígenes en modo debug
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Usuario-Documento'],
    exposedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Middleware para procesar JSON
app.use(express.json());

// Middleware para procesar el header X-Usuario-Documento
app.use((req, res, next) => {
    const documento = req.headers['x-usuario-documento'];
    if (documento) {
        console.log('Documento recibido:', documento);
        req.usuarioDocumento = documento;
    }
    next();
});

// Middleware para manejar preflight requests
app.options('*', cors());

// Rutas no protegidas
app.post("/api/auth/login", login);

// Middleware para verificar token en rutas protegidas
app.use([
    "/api/muestras",
    "/api/registro-muestras",
    "/api/tipos-agua",
    "/api/cambios-estado",
    "/api/ingreso-resultados",
    "/api/firma-digital"
], verificarToken);

// Rutas protegidas
app.use("/api/muestras", muestrasRoutes);
app.use("/api/registro-muestras", registroMuestrasRoutes);
app.use("/api/tipos-agua", tiposAguaRoutes);
app.use("/api/cambios-estado", cambiosEstadoRoutes);
app.use("/api/ingreso-resultados", resultadosRoutes);
app.use("/api/firma-digital", firmaRoutes);

// Ruta de prueba
app.get("/", (req, res) => {
    res.json({ message: "API funcionando correctamente" });
});

// Middleware unificado para manejo de errores
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    if (err.name === 'UnauthorizedError') {
        return ResponseHandler.error(res, {
            statusCode: 401,
            message: 'Token inválido o expirado',
            requiresAuth: true
        });
    }

    ResponseHandler.error(res, err);
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
    console.log('CORS habilitado para todos los orígenes (modo debug)');
    console.log('Rutas disponibles:');
    console.log('- /api/muestras');
    console.log('- /api/registro-muestras');
    console.log('- /api/tipos-agua');
    console.log('- /api/cambios-estado');
    console.log('- /api/ingreso-resultados');
    console.log('- /api/firma-digital');
    console.log('- /api/auth');
});