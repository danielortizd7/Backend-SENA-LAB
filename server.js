require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const connectDB = require("./src/config/database.js");
const { ResponseHandler } = require('./src/shared/utils/responseHandler');

// Importar rutas
const muestrasRoutes = require("./src/app/registro-muestras/routes/muestrasRoutes");
const analisisRoutes = require("./src/app/registro-muestras/routes/analisisRoutes");
const cambiosEstadoRoutes = require("./src/app/cambios-estado/routes/cambioEstadoRoutes");
const resultadosRoutes = require('./src/app/ingreso-resultados/routes/resultadoRoutes');
const firmaRoutes = require("./src/app/firma-digital/routes/firmaRoutes");
const auditoriaRoutes = require("./src/app/auditoria/routes/auditoriaRoutes");
const notificationRoutes = require("./src/app/notificaciones/routes/notificationRoutes");

const { verificarToken, login } = require('./src/shared/middleware/authMiddleware');

// Crear servidor HTTP y app Express
const app = express();
const server = http.createServer(app);

// Conectar a la base de datos
connectDB();

// Configuración de CORS
const corsOrigins = process.env.NODE_ENV === 'production' 
    ? (process.env.ALLOWED_ORIGINS || 'https://aqualab-sena.vercel.app,https://laboratorio-sena.vercel.app,https://web-sena-lab.vercel.app').split(',').filter(Boolean)
    : [
        'http://localhost:5173',
        'http://localhost:5174',
        'https://laboratorio-sena.vercel.app',
        'https://web-sena-lab.vercel.app',
        'https://aqualab-sena.vercel.app'
    ];

console.log(`🌐 CORS configurado para ${process.env.NODE_ENV || 'development'}`);

app.use(cors({
    origin: function (origin, callback) {
        // En producción, ser más estricto con los orígenes
        if (process.env.NODE_ENV === 'production') {
            // Permitir requests sin origin (como Postman, apps móviles, etc.)
            if (!origin) return callback(null, true);
            
            if (corsOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Origen no permitido por CORS'));
            }
        } else {
            // En desarrollo, permitir solicitudes sin origin o todas las configuradas
            if (!origin) return callback(null, true);
            callback(null, corsOrigins.includes(origin) || true);
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Usuario-Documento',
        'Accept',
        'Origin',
        'X-Requested-With',
        'X-User-Role'
    ],
    exposedHeaders: ['Content-Disposition', 'Content-Type'],
    credentials: true,
    maxAge: 86400 // Cache preflight request for 24 hours
}));

// Middleware para procesar JSON
app.use(express.json());

// Middleware para procesar headers de usuario
app.use((req, res, next) => {
    req.usuarioDocumento = req.headers['x-usuario-documento'];
    req.usuarioRol = req.headers['x-user-role'];
    next();
});

// Middleware para manejar preflight requests
app.options('*', cors());

// Middleware para manejar errores CORS
app.use((err, req, res, next) => {
    if (err.message === 'Origen no permitido por CORS') {
        return res.status(403).json({
            error: 'CORS no permitido para este origen',
            origin: req.headers.origin
        });
    }
    next(err);
});

// Rutas no protegidas
app.post("/api/auth/login", login);

// Middleware para verificar token en rutas protegidas
const protectedRoutes = [
    "/api/muestras",
    "/api/registro-muestras",
    "/api/cambios-estado",
    "/api/ingreso-resultados",
    "/api/firma-digital",
    "/api/auditoria",
    "/api/analisis"
];
app.use(protectedRoutes, verificarToken);

// Rutas protegidas
app.use("/api/muestras", muestrasRoutes);
app.use("/api/registro-muestras", muestrasRoutes);
app.use("/api/analisis", analisisRoutes);
app.use("/api/cambios-estado", cambiosEstadoRoutes);
app.use("/api/ingreso-resultados", resultadosRoutes);
app.use("/api/firma-digital", firmaRoutes);
app.use("/api/auditoria", auditoriaRoutes);

// Rutas de notificaciones
app.use("/api/notificaciones", verificarToken, notificationRoutes);

// Endpoints públicos esenciales de notificaciones
const notificationController = require("./src/app/notificaciones/controllers/notificationController");
app.post("/api/notificaciones-test/register-device", notificationController.registrarDeviceTokenPublico);
app.post("/api/notificaciones-test/local", notificationController.pruebaLocalNotificacion);

// Endpoints de diagnóstico (solo en desarrollo)
if (process.env.NODE_ENV !== 'production') {
    console.log('🔧 Endpoints de diagnóstico habilitados para desarrollo');
    
    app.get("/api/notificaciones-test/firebase-config", notificationController.verificarConfigFirebase);
    app.post("/api/notificaciones-test/limpiar-tokens", notificationController.limpiarTokensInvalidos);
    app.get("/api/notificaciones-test/fcm-api", notificationController.verificarEstadoFCMAPI);
    app.get("/api/notificaciones-test/diagnostico", notificationController.diagnosticoPublicoFCM);
    app.post("/api/notificaciones-test/probar-token", notificationController.probarNotificacionToken);
    
    // Rutas de backup para desarrollo
    app.get("/test-firebase", notificationController.verificarConfigFirebase);
    app.get("/test-fcm-api", notificationController.verificarEstadoFCMAPI);
} else {
    console.log('🚀 Modo producción: endpoints de diagnóstico deshabilitados');
}

// Ruta de estado de la API
app.get("/", (req, res) => {
    res.json({ 
        message: "API funcionando correctamente",
        environment: process.env.NODE_ENV || 'development',
        version: "1.0.0"
    });
});

// Middleware para manejo de errores
app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        return ResponseHandler.error(res, {
            statusCode: 401,
            message: 'Token inválido o expirado',
            requiresAuth: true
        });
    }
    ResponseHandler.error(res, err);
});

// Inicializar Socket.IO
const socketManager = require("./src/config/socketManager");
socketManager.initialize(server);

// Iniciar servidor
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`📡 WebSocket disponible en ws://localhost:${PORT}`);
    console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
});