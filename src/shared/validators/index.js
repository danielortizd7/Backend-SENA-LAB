const { body, param, query, custom } = require('express-validator');
const mongoose = require('mongoose');

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
            .isIn(['Pendiente', 'En Proceso', 'Finalizada', 'Cotizada', 'Aprobada', 'Rechazada']).withMessage('Estado no válido')
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
            .custom((value, { req }) => {
                const analisisValidos = [
                    "pH", "Conductividad", "Turbiedad", "Color aparente", "Alcalinidad total",
                    "Dureza total", "Dureza cálcica", "Calcio", "Magnesio", "Cloro libre (residual)",
                    "Cloruros", "Fluoruros", "Nitratos", "Nitritos", "Sulfatos", "Fosfatos",
                    "Manganeso", "Hierro", "Mercurio total", "Análisis de metales en agua",
                    "Oxígeno Disuelto", "Demanda Bioquímica de Oxígeno (DB05)",
                    "Demanda Química de Oxígeno (DQO)", "Sólidos Sedimentables (SSED)",
                    "Sólidos Suspendidos Totales (SST)", "Coliformes Totales Cuantitativo",  
                    "Coliformes Totales Cualitativo"
                ];

                // Validar nombres de análisis
                if (!value.every(analisis => {
                    if (typeof analisis === 'object') {
                        return analisisValidos.includes(analisis.nombre);
                    }
                    return analisisValidos.includes(analisis);
                })) {
                    throw new Error('Uno o más análisis seleccionados no son válidos');
                }

                // Validar rangos según tipo de análisis
                if (req.body.tipoAnalisis === 'FisicoQuimico') {
                    value.forEach(analisis => {
                        if (typeof analisis === 'object' && !/^[\d,\.]+\s*-\s*[\d,\.]+$/.test(analisis.rango)) {
                            throw new Error(`Formato de rango inválido para ${analisis.nombre}. Use "X,X - Y,Y"`);
                        }
                    });
                } else if (req.body.tipoAnalisis === 'Microbiologico') {
                    value.forEach(analisis => {
                        if (typeof analisis === 'object') {
                            if (!/^(UFC\/\d+ml|Ausencia\/Presencia)$/.test(analisis.rango)) {
                                throw new Error(`Formato de rango inválido para ${analisis.nombre}. Use "UFC/Xml" o "Ausencia/Presencia"`);
                            }
                            if (!analisis.unidad || !['UFC', 'Ausencia/Presencia'].includes(analisis.unidad)) {
                                throw new Error(`Unidad inválida para ${analisis.nombre}. Use "UFC" o "Ausencia/Presencia"`);
                            }
                        }
                    });
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
                const analisisValidos = [
                    "pH", "Conductividad", "Turbiedad", "Color aparente", "Alcalinidad total",
                    "Dureza total", "Dureza cálcica", "Calcio", "Magnesio", "Cloro libre (residual)",
                    "Cloruros", "Fluoruros", "Nitratos", "Nitritos", "Sulfatos", "Fosfatos",
                    "Manganeso", "Hierro", "Mercurio total", "Análisis de metales en agua",
                    "Oxígeno Disuelto", "Demanda Bioquímica de Oxígeno (DB05)",
                    "Demanda Química de Oxígeno (DQO)", "Sólidos Sedimentables (SSED)",
                    "Sólidos Suspendidos Totales (SST)","Coliformes Totales Cuantitativo",
                    "Coliformes Totales Cualitativo"
                ];
                
                if (!value.every(analisis => analisisValidos.includes(analisis))) {
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
        body('estado')
            .optional()
            .isIn(['Recibida', 'En análisis', 'Finalizada', 'Rechazada', 'En Cotización'])
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