const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { body, param } = require('express-validator');
const { validationResult } = require('express-validator');

// Middleware para validar errores
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Datos de entrada inválidos',
            errors: errors.array()
        });
    }
    next();
};

// Validadores
const deviceTokenValidators = [
    body('deviceToken')
        .notEmpty()
        .withMessage('Token de dispositivo es requerido')
        .isLength({ min: 10 })
        .withMessage('Token de dispositivo debe tener al menos 10 caracteres'),    body('platform')
        .isIn(['android'])
        .withMessage('Plataforma debe ser: android'),
    body('deviceInfo')
        .optional()
        .isObject()
        .withMessage('Información del dispositivo debe ser un objeto')
];

const notificationIdValidator = [
    param('notificacionId')
        .isMongoId()
        .withMessage('ID de notificación no válido')
];

// Rutas públicas (requieren autenticación de cliente)

router.post('/register-device', 
    deviceTokenValidators,
    validateRequest,
    notificationController.registrarDeviceToken
);

// Ruta pública para registro sin autenticación (testing)
router.post('/registrar-token',
    [
        body('token').notEmpty().withMessage('Token FCM requerido'),
        body('clienteDocumento').notEmpty().withMessage('Documento de cliente requerido'),
        body('platform').isIn(['android']).withMessage('Plataforma debe ser android')
    ],
    validateRequest,
    notificationController.registrarDeviceTokenPublico
);

router.get('/', 
    notificationController.obtenerNotificaciones
);

router.put('/:notificacionId/leida',
    notificationIdValidator,
    validateRequest,
    notificationController.marcarComoLeida
);

router.get('/resumen',
    notificationController.obtenerResumenNoLeidas
);

router.get('/tokens/estado',
    notificationController.verificarEstadoTokens
);

router.post('/deactivate-device',
    [
        body('deviceToken')
            .notEmpty()
            .withMessage('Token de dispositivo es requerido')
    ],
    validateRequest,
    notificationController.desactivarDeviceToken
);

router.post('/test',
    notificationController.enviarNotificacionPrueba
);

// Nuevas rutas de diagnóstico
router.get('/admin/estadisticas',
    notificationController.obtenerEstadisticas
);

router.get('/admin/diagnostico',
    notificationController.diagnosticoNotificaciones
);

router.get('/verificar-fcm-api',
    notificationController.verificarEstadoFCMAPI
);

router.get('/diagnostico-error-404',
    notificationController.diagnosticoError404FCM
);

router.get('/guia-solucion-404',
    notificationController.guiaSolucionError404
);

router.get('/verificar-config-firebase',
    notificationController.verificarConfigFirebase
);

router.post('/prueba-local',
    notificationController.pruebaLocalNotificacion
);

router.post('/limpiar-tokens',
    notificationController.limpiarTokensInvalidos
);

router.get('/guia-token-fcm',
    notificationController.guiaTokenFCM
);

router.get('/validar-token-movil',
    notificationController.validarTokenMovil
);

// Rutas públicas sin autenticación (solo para diagnóstico y desarrollo)
router.get('/diagnostico-publico',
    notificationController.diagnosticoPublicoFCM
);

router.post('/probar-token',
    [
        body('deviceToken')
            .notEmpty()
            .withMessage('Token de dispositivo es requerido')
            .isLength({ min: 10 })
            .withMessage('Token de dispositivo debe tener al menos 10 caracteres')
    ],
    validateRequest,
    notificationController.probarNotificacionToken
);

// === RUTAS DE DIAGNÓSTICO ===
router.get('/debug/tokens/:clienteDocumento', 
    notificationController.obtenerTokensCliente
);

router.get('/debug/token-completo/:clienteDocumento',
    async (req, res) => {
        try {
            const { clienteDocumento } = req.params;
            const DeviceToken = require('../models/deviceTokenModel');
            
            // Buscar tokens del cliente
            const tokens = await DeviceToken.find({ 
                clienteDocumento: clienteDocumento,
                isActive: true 
            }).sort({ createdAt: -1 });
            
            if (tokens.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: `No se encontraron tokens para cliente ${clienteDocumento}`,
                    data: { clienteDocumento, tokensFound: 0 }
                });
            }
            
            const tokenData = tokens.map(token => ({
                id: token._id,
                clienteDocumento: token.clienteDocumento,
                platform: token.platform,
                tokenCompleto: token.deviceToken,
                tokenLength: token.deviceToken.length,
                validFormat: token.deviceToken.includes(':APA91b'),
                isActive: token.isActive,
                createdAt: token.createdAt,
                lastUsed: token.lastUsed
            }));
            
            res.json({
                success: true,
                message: `Encontrados ${tokens.length} tokens para cliente ${clienteDocumento}`,
                data: {
                    clienteDocumento,
                    tokensCount: tokens.length,
                    tokens: tokenData
                }
            });
            
        } catch (error) {
            console.error('Error obteniendo tokens completos:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
);

// === RUTAS DE DIAGNÓSTICO EN PRODUCCIÓN ===
router.get('/diagnostico-produccion',
    async (req, res) => {
        try {
            const DeviceToken = require('../models/deviceTokenModel');
            
            // Obtener los últimos 5 tokens
            const tokens = await DeviceToken.find({ isActive: true })
                .sort({ createdAt: -1 })
                .limit(5);
            
            const tokenInfo = tokens.map(token => ({
                id: token._id,
                clienteDocumento: token.clienteDocumento,
                platform: token.platform,
                tokenLength: token.deviceToken.length,
                tokenStart: token.deviceToken.substring(0, 20),
                tokenEnd: token.deviceToken.substring(token.deviceToken.length - 20),
                hasAPA91b: token.deviceToken.includes(':APA91b'),
                isComplete: token.deviceToken.length > 140,
                createdAt: token.createdAt
            }));
            
            res.json({
                success: true,
                message: 'Diagnóstico de tokens en producción',
                environment: process.env.NODE_ENV,
                tokensCount: tokens.length,
                tokens: tokenInfo
            });
            
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error en diagnóstico',
                error: error.message
            });
        }
    }
);

router.post('/validar-token-produccion',
    [
        body('clienteDocumento').notEmpty().withMessage('Documento de cliente requerido')
    ],
    validateRequest,
    async (req, res) => {
        try {
            const { clienteDocumento } = req.body;
            const DeviceToken = require('../models/deviceTokenModel');
            
            const token = await DeviceToken.findOne({ 
                clienteDocumento: clienteDocumento,
                isActive: true 
            }).sort({ createdAt: -1 });
            
            if (!token) {
                return res.status(404).json({
                    success: false,
                    message: `No se encontró token para cliente ${clienteDocumento}`
                });
            }
            
            // Información detallada del token
            const tokenInfo = {
                id: token._id,
                clienteDocumento: token.clienteDocumento,
                platform: token.platform,
                tokenLength: token.deviceToken.length,
                tokenStart: token.deviceToken.substring(0, 30),
                tokenEnd: token.deviceToken.substring(token.deviceToken.length - 30),
                hasAPA91b: token.deviceToken.includes(':APA91b'),
                isComplete: token.deviceToken.length > 140,
                createdAt: token.createdAt,
                // Solo mostrar token completo si es necesario para debug
                tokenCompleto: req.query.showFull === 'true' ? token.deviceToken : '[HIDDEN]'
            };
            
            res.json({
                success: true,
                message: 'Token encontrado y validado',
                environment: process.env.NODE_ENV,
                tokenInfo: tokenInfo
            });
            
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Error validando token',
                error: error.message
            });
        }
    }
);

// Ruta para diagnóstico específico de Firebase en producción
router.get('/diagnostico-firebase-produccion',
    notificationController.diagnosticoFirebaseProduccion
);

module.exports = router;
