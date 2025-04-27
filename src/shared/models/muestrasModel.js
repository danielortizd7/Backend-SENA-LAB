const mongoose = require("mongoose");

const estadosValidos = ["Recibida", "En análisis", "Finalizada", "En Cotizacion", "Rechazada"];

// Constantes para tipos de muestreo
const TIPOS_MUESTREO = {
    SIMPLE: "Simple",
    COMPUESTO: "Compuesto"
};

// Constantes para validación
const TIPOS_AGUA = {
    POTABLE: 'potable',
    NATURAL: 'natural',
    RESIDUAL: 'residual',
    OTRA: 'otra'
};

const SUBTIPOS_RESIDUAL = {
    DOMESTICA: 'Doméstica',
    NO_DOMESTICA: 'No Doméstica'
};

const ESTADOS = {
    RECIBIDA: 'Recibida',
    EN_ANALISIS: 'En análisis',
    FINALIZADA: 'Finalizada',
    EN_COTIZACION: 'En Cotizacion',
    RECHAZADA: 'Rechazada'
};

// Esquema para resultados de análisis
const resultadoAnalisisSchema = new mongoose.Schema({
    valor: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    unidad: {
        type: String,
        required: true
    }
});

// Esquema para tipos de agua
const tipoAguaSchema = new mongoose.Schema({
    tipo: {
        type: String,
        required: true,
        enum: Object.values(TIPOS_AGUA)
    },
    codigo: {
        type: String,
        required: true
    },
    descripcion: {
        type: String,
        required: true
    },
    subtipoResidual: {
        type: String,
        enum: Object.values(SUBTIPOS_RESIDUAL),
        required: function() {
            return this.tipo === TIPOS_AGUA.RESIDUAL;
        }
    }
});

// Esquema para historial de estados
const historialEstadoSchema = new mongoose.Schema({
    estado: {
        type: String,
        required: true,
        enum: estadosValidos
    },
    estadoAnterior: {
        type: String,
        required: true,
        enum: estadosValidos
    },
    fecha: {
        type: Date,
        default: Date.now
    },
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    observaciones: {
        type: String
    }
}, { _id: false });

// Esquema para datos de usuario
const datosUsuarioSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    documento: {
        type: String,
        required: true
    },
    nombre: {
        type: String,
        required: true
    },
    email: String,
    telefono: String,
    direccion: String,
    fechaCreacion: {
        type: Object,
        fecha: String,
        hora: String
    }
});

// Esquema para las firmas
const firmasSchema = new mongoose.Schema({
    firmaAdministrador: {
        nombre: {
            type: String
        },
        documento: {
            type: String
        },
        firma: {
            type: String
        }
    },
    firmaCliente: {
        nombre: {
            type: String
        },
        documento: {
            type: String
        },
        firma: {
            type: String
        }
    }
}, { _id: false });

// Esquema para análisis seleccionado
const analisisSeleccionadoSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true
    },
    precio: {
        type: Number,
        required: true
    },
    unidad: {
        type: String,
        required: true
    },
    metodo: {
        type: String,
        required: true
    },
    rango: {
        type: String,
        required: true
    }
}, { _id: false });

// Esquema principal de muestra
const muestraSchema = new mongoose.Schema({
    // 1. ID único generado automáticamente
    id_muestra: {
        type: String,
        required: true,
        unique: true
    },

    // 2. Datos del cliente
    cliente: {
        type: datosUsuarioSchema,
        required: true
    },
    
    // 3. Tipo de Agua
    tipoDeAgua: {
        tipo: {
            type: String,
            required: true,
            enum: Object.values(TIPOS_AGUA)
        },
        codigo: {
            type: String,
            required: true
        },
        descripcion: {
            type: String,
            required: true
        },
        subtipoResidual: {
            type: String,
            enum: Object.values(SUBTIPOS_RESIDUAL),
            required: function() {
                return this.tipo === TIPOS_AGUA.RESIDUAL;
            }
        }
    },
    
    // 4. Tipo de Muestreo
    tipoMuestreo: {
        type: String,
        required: true,
        enum: Object.values(TIPOS_MUESTREO),
        default: TIPOS_MUESTREO.SIMPLE
    },

    // 5. Lugar de Muestreo
    lugarMuestreo: {
        type: String,
        required: true
    },
    
    // 6. Fecha y Hora de Muestreo
    fechaHoraMuestreo: {
        type: Date,
        required: true
    },
    
    // 7. Tipo de Análisis
    tipoAnalisis: {
        type: String,
        required: true,
        enum: ['Fisicoquímico', 'Microbiológico']
    },
    
    // 8. Identificación proporcionada por el cliente
    identificacionMuestra: {
        type: String,
        required: true
    },
    
    // 9. Plan de muestreo
    planMuestreo: {
        type: String,
        required: true
    },
    
    // 10. Condiciones ambientales
    condicionesAmbientales: {
        type: String,
        required: true
    },
    
    // 11. Preservación de la muestra
    preservacionMuestra: {
        type: String,
        required: true,
        enum: ['Refrigeración', 'Congelación', 'Acidificación', 'Otro']
    },
    descripcion: {
        type: String,
        required: function() {
            return this.preservacionMuestra === 'Otro';
        }
    },
    
    // 12. Análisis seleccionados
    analisisSeleccionados: {
        type: [analisisSeleccionadoSchema],
        required: true,
        validate: {
            validator: function(v) {
                return Array.isArray(v) && v.length > 0;
            },
            message: 'Debe seleccionar al menos un análisis'
        }
    },
    
    // 13. Precio total
    precioTotal: {
        type: Number,
        required: true,
        default: 0
    },
    
    // 14. Estado y rechazo
    estado: {
        type: String,
        required: true,
        enum: estadosValidos,
        default: "Recibida"
    },
    rechazoMuestra: {
        rechazada: {
            type: Boolean,
            default: false
        },
        motivo: String,
        fechaRechazo: Date
    },

    // Campos adicionales
    observaciones: {
        type: String
    },
    firmas: firmasSchema,
    historialEstados: [historialEstadoSchema],
    creadoPor: {
        type: datosUsuarioSchema,
        required: true
    },
    actualizadoPor: [{
        usuario: {
            type: datosUsuarioSchema,
            required: true
        },
        fecha: {
            type: Date,
            required: true
        },
        accion: {
            type: String,
            required: true
        }
    }],
    laboratorista: {
        type: datosUsuarioSchema
    }
}, {
    timestamps: true
});

// Middleware para calcular el precio total antes de guardar
muestraSchema.pre('save', function(next) {
    if (this.analisisSeleccionados && Array.isArray(this.analisisSeleccionados)) {
        this.precioTotal = this.analisisSeleccionados.reduce((total, analisis) => {
            return total + (analisis.precio || 0);
        }, 0);
    }
    next();
});

// Modelos
const Muestra = mongoose.models.Muestra || mongoose.model('Muestra', muestraSchema, 'muestras');
const TipoAgua = mongoose.models.TipoAgua || mongoose.model('TipoAgua', tipoAguaSchema, 'tipos_agua');

module.exports = {
    Muestra,
    TipoAgua,
    TIPOS_AGUA,
    SUBTIPOS_RESIDUAL,
    ESTADOS,
    estadosValidos,
    TIPOS_MUESTREO
};