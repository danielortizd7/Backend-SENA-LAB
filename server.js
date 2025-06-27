require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
const connectDB = require("./src/config/database.js");
const { ResponseHandler } = require('./src/shared/utils/responseHandler');

// Importar rutas
const muestrasRoutes = require("./src/app/registro-muestras/routes/muestrasRoutes");
const analisisRoutes = require("./src/app/registro-muestras/routes/analisisRoutes");
const cambiosEstadoRoutes = require("./src/app/cambios-estado/routes/cambioEstadoRoutes");
const resultadosRoutes = require('./src/app/ingreso-resultados/routes/resultadoRoutes');
const firmaRoutes = require("./src/app/firma-digital/routes/firmaRoutes.js");
const auditoriaRoutes = require("./src/app/auditoria/routes/auditoriaRoutes.js");
const notificationRoutes = require("./src/app/notificaciones/routes/notificationRoutes.js");

const { verificarToken, login } = require('./src/shared/middleware/authMiddleware');

// Crear servidor HTTP y app Express
const app = express();
const server = http.createServer(app);

// Conectar a la base de datos correctamente
connectDB();

// Configuración de CORS
const corsOrigins = process.env.NODE_ENV === 'production' 
    ? (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean)
    : [
        'http://localhost:5173',  // Frontend en desarrollo local
        'http://localhost:5174',  // Frontend en desarrollo local (puerto alternativo)
        'https://laboratorio-sena.vercel.app', // Frontend en producción
        'https://web-sena-lab.vercel.app', // Frontend en Vercel
        'https://aqualab-sena.vercel.app' // Frontend en producción (Aqualab)
    ];

console.log(`🌐 CORS configurado para ${process.env.NODE_ENV || 'development'}:`, corsOrigins);

app.use(cors({
    origin: function (origin, callback) {
        // En producción, ser más estricto con los orígenes
        if (process.env.NODE_ENV === 'production') {
            if (!origin) {
                // En producción, solo permitir requests sin origin si están explícitamente configurados
                if (process.env.ALLOW_NO_ORIGIN === 'true') {
                    return callback(null, true);
                } else {
                    return callback(new Error('Origin requerido en producción'));
                }
            }
            
            if (corsOrigins.includes(origin)) {
                callback(null, true);
            } else {
                console.log('🚫 Origen bloqueado por CORS en producción:', origin);
                callback(new Error('Origen no permitido por CORS'));
            }
        } else {
            // En desarrollo, permitir solicitudes sin origin (como aplicaciones móviles o postman)
            if (!origin) return callback(null, true);
            
            if (corsOrigins.includes(origin)) {
                callback(null, true);
            } else {
                console.log('⚠️ Origen no configurado en desarrollo:', origin);
                callback(null, true); // Permitir en desarrollo
            }
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
    const documento = req.headers['x-usuario-documento'];
    const rol = req.headers['x-user-role'];
    
    if (documento) {
        req.usuarioDocumento = documento;
    }
    if (rol) {
        req.usuarioRol = rol;
    }
    next();
});

// Middleware para manejar preflight requests
app.options('*', cors());

// Agregar middleware para manejar errores CORS
app.use((err, req, res, next) => {
    if (err.message === 'No permitido por CORS') {
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
app.use([
    "/api/muestras",
    "/api/registro-muestras",
    "/api/cambios-estado",
    "/api/ingreso-resultados",
    "/api/firma-digital",
    "/api/auditoria",
    "/api/analisis"
], verificarToken);

// Rutas protegidas
app.use("/api/muestras", muestrasRoutes);
app.use("/api/registro-muestras", muestrasRoutes);
app.use("/api/analisis", analisisRoutes);
app.use("/api/cambios-estado", cambiosEstadoRoutes);
app.use("/api/ingreso-resultados", resultadosRoutes);
app.use("/api/firma-digital", firmaRoutes);
app.use("/api/auditoria", auditoriaRoutes);

// Rutas públicas de notificaciones (solo en desarrollo)
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production') {
    console.log('⚠️ Modo desarrollo: Endpoints de testing habilitados');
    app.get("/api/notificaciones/test-firebase", require("./src/app/notificaciones/controllers/notificationController").verificarConfigFirebase);
    app.post("/api/notificaciones/test-local", require("./src/app/notificaciones/controllers/notificationController").pruebaLocalNotificacion);
} else {
    console.log('🔒 Modo producción: Endpoints de testing deshabilitados');
}

// Rutas protegidas de notificaciones
app.use("/api/notificaciones", verificarToken, notificationRoutes);

// Ruta de prueba
app.get("/", (req, res) => {
    res.json({ message: "API funcionando correctamente" });
});

// Middleware unificado para manejo de errores
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
    console.log(`Servidor corriendo en puerto ${PORT}`);
    console.log(`WebSocket disponible en ws://localhost:${PORT}`);
});