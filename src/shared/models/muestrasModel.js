const mongoose = require("mongoose");

const estadosValidos = ["Recibida", "En análisis", "Pendiente de resultados", "Finalizada", "Rechazada"];

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
        enum: ['potable', 'natural', 'residual', 'otra']
    },
    codigo: {
        type: String,
        required: true
    },
    descripcion: {
        type: String,
        required: true
    }
});

// Esquema para firmas
const firmaSchema = new mongoose.Schema({
    firma: {
        type: String,
        required: true
    },
    fecha: {
        type: Date,
        required: true
    }
});

// Esquema para historial de estados
const historialEstadoSchema = new mongoose.Schema({
    estado: {
        type: String,
        required: true,
        enum: ['Recibida', 'En análisis', 'Pendiente de resultados', 'Finalizada', 'Rechazada']
    },
    cedulaadministrador: {
        type: String,
        required: true
    },
    nombreadministrador: {
        type: String,
        required: true
    },
    fechaCambio: {
        type: Date,
        required: true
    },
    observaciones: {
        type: String
    }
});

// Esquema para rechazo de muestra
const rechazoSchema = new mongoose.Schema({
    rechazada: {
        type: Boolean,
        default: false
    },
    motivo: {
        type: String
    },
    fechaRechazo: {
        type: Date
    }
});

// Esquema para actualizaciones
const actualizacionSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    nombre: {
        type: String,
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
});

// Esquema principal de muestra
const muestraSchema = new mongoose.Schema({
    id_muestra: {
        type: String,
        required: true,
        unique: true
    },
    documento: {
        type: String,
        required: true
    },
    tipoDeAgua: {
        type: tipoAguaSchema,
        required: true
    },
    fechaHoraMuestreo: {
        type: Date,
        required: true
    },
    tipoAnalisis: {
        type: String,
        required: true,
        enum: ['Fisicoquímico', 'Microbiológico', 'Otro']
    },
    preservacionMuestra: {
        type: String,
        required: true,
        enum: ['Refrigeración', 'Congelación', 'Otra']
    },
    preservacionOtra: {
        type: String
    },
    lugarMuestreo: {
        type: String,
        required: true
    },
    analisisSeleccionados: [{
        type: String,
        required: true
    }],
    resultados: {
        type: Map,
        of: resultadoAnalisisSchema,
        default: new Map()
    },
    estado: {
        type: String,
        required: true,
        enum: ['Recibida', 'En análisis', 'Pendiente de resultados', 'Finalizada', 'Rechazada'],
        default: 'Recibida'
    },
    rechazoMuestra: {
        type: rechazoSchema,
        default: { rechazada: false }
    },
    historial: [historialEstadoSchema],
    firmas: {
        cedulaAdministrador: {
            type: String,
            required: true
        },
        firmaAdministrador: {
            type: String,
            required: true
        },
        cedulaCliente: {
            type: String,
            required: true
        },
        firmaCliente: {
            type: String,
            required: true
        },
        fechaFirmaAdministrador: {
            type: Date,
            required: true
        },
        fechaFirmaCliente: {
            type: Date,
            required: true
        }
    },
    observaciones: {
        type: String
    },
    creadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    actualizadoPor: [actualizacionSchema]
}, {
    timestamps: true
});

// Modelos
const Muestra = mongoose.models.Muestra || mongoose.model('Muestra', muestraSchema, 'muestras');
const TipoAgua = mongoose.models.TipoAgua || mongoose.model('TipoAgua', tipoAguaSchema, 'tipos_agua');

module.exports = {
    Muestra,
    TipoAgua,
    estadosValidos
};