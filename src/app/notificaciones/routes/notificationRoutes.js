const express = require('express');
const router = express.Router();
// const notificationController = require('../controllers/notificationController'); // Comentado temporalmente por corrupción
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

// Todas las rutas comentadas temporalmente por corrupción del controlador
/*
router.post('/register-device', 
    deviceTokenValidators,
    validateRequest,
    notificationController.registrarDeviceToken
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

router.get('/admin/estadisticas',
    notificationController.obtenerEstadisticas
);

router.get('/admin/diagnostico',
    notificationController.diagnosticoNotificaciones
);

router.get('/verificar-fcm-api',
    notificationController.verificarEstadoFCMAPI
);
*/

module.exports = router;
