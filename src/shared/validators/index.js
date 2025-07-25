const { body, param, query, custom } = require('express-validator');

// Validadores para firma-digital
const firmaValidators = {
    guardarFirma: [
        body('id_muestra')
            .notEmpty().withMessage('El ID de muestra es requerido')
            .trim(),

        body('firmas.administrador.nombre')
            .notEmpty().withMessage('El nombre del administrador es requerido'),

        body('firmas.administrador.documento')
            .notEmpty().withMessage('El documento del administrador es requerido'),

        body('firmas.administrador.firmaAdministrador')
            .notEmpty().withMessage('La firma del administrador es requerida')
            .custom((value) => {
                if (!value || value.trim() === '') {
                    throw new Error('La firma del administrador no puede estar vacía');
                }
                if (!value.startsWith('data:image/')) {
                    throw new Error('La firma debe ser una imagen en base64');
                }
                return true;
            }),

        body('firmas.cliente.nombre')
            .notEmpty().withMessage('El nombre del cliente es requerido'),

        body('firmas.cliente.documento')
            .notEmpty().withMessage('El documento del cliente es requerido'),

        body('firmas.cliente.firmaCliente')
            .notEmpty().withMessage('La firma del cliente es requerida')
            .custom((value) => {
                if (!value || value.trim() === '') {
                    throw new Error('La firma del cliente no puede estar vacía');
                }
                if (!value.startsWith('data:image/')) {
                    throw new Error('La firma debe ser una imagen en base64');
                }
                return true;
            })
    ],
    buscarMuestra: [
        param('idMuestra')
            .notEmpty().withMessage('El ID de muestra es requerido')
            .trim()
    ]
};

// Validadores para cambios-estado
const cambioEstadoValidators = {
    cambiarEstado: [
        body('id_muestra')
            .notEmpty().withMessage('El ID de muestra es requerido')
            .trim(),
        body('estado')
            .notEmpty().withMessage('El estado es requerido')
            .isIn(['Pendiente', 'En análisis', 'Finalizada', 'Cotizada', 'Aprobada', 'Rechazada']).withMessage('Estado no válido')
    ]
};

// Validadores para ingreso-resultados
const resultadoValidators = {
    guardarResultado: [
        body('resultados').isObject().withMessage('Los resultados deben ser un objeto'),
        body('observaciones').optional().isString().withMessage('Las observaciones deben ser texto')
    ],
    editarResultado: [
        body('resultados').isObject().withMessage('Los resultados deben ser un objeto'),
        body('observaciones').optional().isString().withMessage('Las observaciones deben ser texto')
    ],
    verificarResultado: [
        param('idMuestra')
            .trim()
            .notEmpty()
            .withMessage('El ID de muestra es obligatorio'),
        body('observaciones')
            .optional()
            .isString()
            .withMessage('Las observaciones deben ser texto')
            .trim()
    ]
};

// Validadores para tipos-agua
const tipoAguaValidators = {
    crearTipoAgua: [
        body('nombre')
            .notEmpty().withMessage('El nombre es requerido')
            .trim(),
        body('descripcion')
            .optional()
            .trim()
    ],
    asignarTipoAgua: [
        param('idMuestra')
            .trim()
            .notEmpty()
            .withMessage('El ID de muestra es obligatorio'),
        body('tipoDeAgua')
            .trim()
            .notEmpty()
            .withMessage('El tipo de agua es obligatorio')
            .isIn(['potable', 'residual', 'otra'])
            .withMessage('Tipo de agua no válido'),
        body('tipoPersonalizado')
            .if(body('tipoDeAgua').equals('otra'))
            .trim()
            .notEmpty()
            .withMessage('El tipo personalizado es obligatorio cuando el tipo es "otra"'),
        body('descripcion')
            .trim()
            .notEmpty()
            .withMessage('La descripción es obligatoria')
            .isLength({ min: 5 })
            .withMessage('La descripción debe tener al menos 5 caracteres')
    ],

    actualizarTipoAgua: [
        param('idMuestra')
            .trim()
            .notEmpty()
            .withMessage('El ID de muestra es obligatorio'),
        body('tipoDeAgua')
            .trim()
            .notEmpty()
            .withMessage('El tipo de agua es obligatorio')
            .isIn(['potable', 'residual', 'otra'])
            .withMessage('Tipo de agua no válido'),
        body('tipoPersonalizado')
            .if(body('tipoDeAgua').equals('otra'))
            .trim()
            .notEmpty()
            .withMessage('El tipo personalizado es obligatorio cuando el tipo es "otra"'),
        body('descripcion')
            .trim()
            .notEmpty()
            .withMessage('La descripción es obligatoria')
            .isLength({ min: 5 })
            .withMessage('La descripción debe tener al menos 5 caracteres')
    ]
};

// Validadores para Backend-SENA-LAB
const senaLabValidators = {
    crearMuestra: [
        body('tipoMuestreo')
            .notEmpty().withMessage('El tipo de muestreo es obligatorio')
            .trim()
            .isIn(['simple', 'compuesto']).withMessage('Tipo de muestreo no válido'),
        body('analisisSeleccionados')
            .isArray().withMessage('Los análisis seleccionados deben ser un array')
            .notEmpty().withMessage('Debe seleccionar al menos un análisis')
            .custom((value) => {
                const analisisValidos = ['pH', 'turbidez', 'conductividad', 'temperatura', 'oxigenoDisuelto', 'nitratos', 'fosfatos'];
                const todosValidos = value.every(analisis => analisisValidos.includes(analisis));
                if (!todosValidos) {
                    throw new Error('Uno o más análisis seleccionados no son válidos');
                }
                return true;
            }),
        body('tipoDeAgua.tipo')
            .optional()
            .isIn(['potable', 'natural', 'residual', 'otra']).withMessage('Tipo de agua no válido'),
        body('tipoDeAgua.tipoPersonalizado')
            .if(body('tipoDeAgua.tipo').equals('otra'))
            .notEmpty().withMessage('El tipo personalizado es obligatorio cuando el tipo es "otra"')
            .trim(),
        body('tipoDeAgua.descripcion')
            .optional()
            .isString().withMessage('La descripción debe ser texto')
            .trim()
            .isLength({ min: 10 }).withMessage('La descripción debe tener al menos 10 caracteres'),
        body().custom((value, { req }) => {
            if (!req.usuario) {
                throw new Error('Usuario no autenticado');
            }
            if (req.usuario.rol !== 'laboratorista' && req.usuario.rol !== 'administrador') {
                throw new Error('No tiene permisos para crear muestras');
            }
            return true;
        })
    ],
    actualizarMuestra: [
        param('id')
            .notEmpty().withMessage('El ID de muestra es obligatorio')
            .trim()
            .matches(/^MUESTRA-H\d+$/).withMessage('Formato de ID inválido'),
        body('tipoMuestreo')
            .optional()
            .notEmpty().withMessage('El tipo de muestreo no puede estar vacío')
            .trim()
            .isIn(['simple', 'compuesto']).withMessage('Tipo de muestreo no válido'),
        body('analisisSeleccionados')
            .optional()
            .isArray().withMessage('Los análisis seleccionados deben ser un array')
            .notEmpty().withMessage('Debe seleccionar al menos un análisis')
            .custom((value) => {
                const analisisValidos = ['pH', 'turbidez', 'conductividad', 'temperatura', 'oxigenoDisuelto', 'nitratos', 'fosfatos'];
                const todosValidos = value.every(analisis => analisisValidos.includes(analisis));
                if (!todosValidos) {
                    throw new Error('Uno o más análisis seleccionados no son válidos');
                }
                return true;
            }),
        body('tipoDeAgua.tipo')
            .optional()
            .isIn(['potable', 'natural', 'residual', 'otra']).withMessage('Tipo de agua no válido'),
        body('tipoDeAgua.tipoPersonalizado')
            .if(body('tipoDeAgua.tipo').equals('otra'))
            .notEmpty().withMessage('El tipo personalizado es obligatorio cuando el tipo es "otra"')
            .trim(),
        body('tipoDeAgua.descripcion')
            .optional()
            .isString().withMessage('La descripción debe ser texto')
            .trim()
            .isLength({ min: 10 }).withMessage('La descripción debe tener al menos 10 caracteres'),        body('estado')
            .optional()
            .isIn(['Recibida', 'En análisis', 'Finalizada', 'Rechazada', 'En Cotización', 'Aceptada'])
            .withMessage('Estado no válido'),
        body('observaciones')
            .optional()
            .isString().withMessage('Las observaciones deben ser texto')
            .trim()
            .isLength({ min: 5 }).withMessage('Las observaciones deben tener al menos 5 caracteres'),
        body().custom((value, { req }) => {
            if (!req.usuario) {
                throw new Error('Usuario no autenticado');
            }
            if (req.usuario.rol !== 'laboratorista' && req.usuario.rol !== 'administrador') {
                throw new Error('No tiene permisos para actualizar muestras');
            }
            return true;
        })
    ]
};

module.exports = {
    firmaValidators,
    cambioEstadoValidators,
    resultadoValidators,
    tipoAguaValidators,
    senaLabValidators
}; 