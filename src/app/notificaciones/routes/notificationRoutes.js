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
        body('deviceToken')
            .notEmpty()
            .withMessage('Token de dispositivo es requerido')
            .isLength({ min: 10 })
            .withMessage('Token de dispositivo debe tener al menos 10 caracteres'),
        body('platform')
            .isIn(['android'])
            .withMessage('Plataforma debe ser: android'),
        body('clienteDocumento')
            .notEmpty()
            .withMessage('Documento de cliente es requerido')
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

module.exports = router;
