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

/**
 * @route POST /api/notificaciones/register-device
 * @desc Registrar token de dispositivo móvil
 * @access Cliente autenticado
 */
router.post('/register-device', 
    deviceTokenValidators,
    validateRequest,
    notificationController.registrarDeviceToken
);

/**
 * @route GET /api/notificaciones
 * @desc Obtener notificaciones del cliente
 * @access Cliente autenticado
 */
router.get('/', 
    notificationController.obtenerNotificaciones
);

/**
 * @route PUT /api/notificaciones/:notificacionId/leida
 * @desc Marcar notificación como leída
 * @access Cliente autenticado
 */
router.put('/:notificacionId/leida',
    notificationIdValidator,
    validateRequest,
    notificationController.marcarComoLeida
);

/**
 * @route GET /api/notificaciones/resumen
 * @desc Obtener resumen de notificaciones no leídas
 * @access Cliente autenticado
 */
router.get('/resumen',
    notificationController.obtenerResumenNoLeidas
);

/**
 * @route GET /api/notificaciones/tokens/estado
 * @desc Verificar estado de tokens FCM del cliente
 * @access Cliente autenticado
 */
router.get('/tokens/estado',
    notificationController.verificarEstadoTokens
);

/**
 * @route POST /api/notificaciones/deactivate-device
 * @desc Desactivar token de dispositivo (logout)
 * @access Cliente autenticado
 */
router.post('/deactivate-device',
    [
        body('deviceToken')
            .notEmpty()
            .withMessage('Token de dispositivo es requerido')
    ],
    validateRequest,
    notificationController.desactivarDeviceToken
);

// Rutas de desarrollo/testing

/**
 * @route POST /api/notificaciones/test
 * @desc Enviar notificación de prueba (solo desarrollo)
 * @access Cliente autenticado
 */
router.post('/test',
    notificationController.enviarNotificacionPrueba
);

// Rutas administrativas

/**
 * @route GET /api/notificaciones/admin/estadisticas
 * @desc Obtener estadísticas de notificaciones
 * @access Administrador
 */
router.get('/admin/estadisticas',
    // TODO: Agregar middleware de autenticación de admin
    notificationController.obtenerEstadisticas
);

/**
 * @route GET /api/notificaciones/admin/diagnostico
 * @desc Diagnóstico completo del sistema de notificaciones
 * @access Administrador
 */
router.get('/admin/diagnostico',
    // TODO: Agregar middleware de autenticación de admin
    notificationController.diagnosticoNotificaciones
);

module.exports = router;
