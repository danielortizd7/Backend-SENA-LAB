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

// Validadores comunes
const deviceTokenValidators = [
    body('deviceToken')
        .notEmpty()
        .withMessage('Token de dispositivo es requerido')
        .isLength({ min: 10 })
        .withMessage('Token de dispositivo debe tener al menos 10 caracteres'),
    body('platform')
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

// === RUTAS PRINCIPALES DE NOTIFICACIONES ===

// Registro de dispositivo (con autenticación)
router.post('/register-device', 
    deviceTokenValidators,
    validateRequest,
    notificationController.registrarDeviceToken
);

// Registro público (para testing)
router.post('/registrar-token',
    [
        body('token').notEmpty().withMessage('Token FCM requerido'),
        body('clienteDocumento').notEmpty().withMessage('Documento de cliente requerido'),
        body('platform').isIn(['android']).withMessage('Plataforma debe ser android')
    ],
    validateRequest,
    notificationController.registrarDeviceTokenPublico
);

// Obtener notificaciones del usuario
router.get('/', notificationController.obtenerNotificaciones);

// Marcar notificación como leída
router.put('/:notificacionId/leida',
    notificationIdValidator,
    validateRequest,
    notificationController.marcarComoLeida
);

// Resumen de notificaciones no leídas
router.get('/resumen', notificationController.obtenerResumenNoLeidas);

// Estado de tokens del usuario
router.get('/tokens/estado', notificationController.verificarEstadoTokens);

// Desactivar token de dispositivo
router.post('/deactivate-device',
    [body('deviceToken').notEmpty().withMessage('Token de dispositivo es requerido')],
    validateRequest,
    notificationController.desactivarDeviceToken
);

// Enviar notificación de prueba
router.post('/test', notificationController.enviarNotificacionPrueba);

// === RUTAS DE ADMINISTRACIÓN ===
router.get('/admin/estadisticas', notificationController.obtenerEstadisticas);
router.get('/admin/diagnostico', notificationController.diagnosticoNotificaciones);

// === RUTAS DE DIAGNÓSTICO (SOLO DESARROLLO) ===
if (process.env.NODE_ENV !== 'production') {
    // Diagnóstico básico
    router.get('/verificar-fcm-api', notificationController.verificarEstadoFCMAPI);
    router.get('/verificar-config-firebase', notificationController.verificarConfigFirebase);
    router.get('/diagnostico-publico', notificationController.diagnosticoPublicoFCM);
    
    // Pruebas y utilidades
    router.post('/prueba-local', notificationController.pruebaLocalNotificacion);
    router.post('/limpiar-tokens', notificationController.limpiarTokensInvalidos);
    router.post('/probar-token',
        [body('deviceToken').notEmpty().withMessage('Token de dispositivo es requerido')],
        validateRequest,
        notificationController.probarNotificacionToken
    );
    
    // Debug de tokens específicos
    router.get('/debug/tokens/:clienteDocumento', notificationController.obtenerTokensCliente);
}

module.exports = router;
