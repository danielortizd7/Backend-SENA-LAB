const mongoose = require('mongoose');

// Schema para Muestras
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
    fechaHora: {
        type: Date,
        required: true
    },
    tipoMuestreo: {
        type: String,
        enum: ['simple', 'compuesto'],
        required: true
    },
    tipoAgua: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TipoAgua',
        required: true
    },
    estado: {
        type: String,
        enum: ['Recibida', 'En análisis', 'Pendiente de resultados', 'Finalizada', 'Rechazada'],
        default: 'Recibida'
    },
    historial: [{
        estado: {
            type: String,
            required: true
        },
        cedulaLaboratorista: {
            type: String,
            required: true
        },
        fechaCambio: {
            type: Date,
            default: Date.now
        }
    }],
    resultado: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resultado'
    },
    firmas: {
        firmaLaboratorista: {
            type: String,
            required: false
        },
        cedulaLaboratorista: {
            type: String,
            required: false
        },
        firmaCliente: {
            type: String,
            required: false
        },
        cedulaCliente: {
            type: String,
            required: false
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Schema para Tipos de Agua
const tipoAguaSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre del tipo de agua es requerido'],
        unique: true,
        trim: true
    },
    descripcion: {
        type: String,
        required: [true, 'La descripción es requerida'],
        trim: true
    },
    parametros: [{
        nombre: String,
        unidad: String,
        valorMinimo: Number,
        valorMaximo: Number
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Schema para Estados
const cambioEstadoSchema = new mongoose.Schema({
    muestra: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Muestra',
        required: true
    },
    estadoAnterior: {
        type: String,
        required: true
    },
    estadoNuevo: {
        type: String,
        required: true
    },
    responsable: {
        nombre: {
            type: String,
            required: true
        },
        cedula: {
            type: String,
            required: true
        }
    },
    observacion: String,
    fecha: {
        type: Date,
        default: Date.now
    }
});

// Schema para Firmas
const firmaSchema = new mongoose.Schema({
    muestra: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Muestra',
        required: true
    },
    firmaDigital: {
        type: String,
        required: true
    },
    responsable: {
        nombre: {
            type: String,
            required: true
        },
        cedula: {
            type: String,
            required: true
        }
    },
    fecha: {
        type: Date,
        default: Date.now
    },
    estado: {
        type: String,
        enum: ['activa', 'anulada'],
        default: 'activa'
    }
});

// Schema para Resultados
const resultadoSchema = new mongoose.Schema({
    muestra: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Muestra',
        required: true
    },
    resultado: {
        type: String,
        required: true
    },
    fecha: {
        type: Date,
        default: Date.now
    }
});

// Middleware pre-save para actualizar updatedAt
muestraSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

tipoAguaSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Crear modelos
const Muestra = mongoose.model('Muestra', muestraSchema);
const TipoAgua = mongoose.model('TipoAgua', tipoAguaSchema);
const CambioEstado = mongoose.model('CambioEstado', cambioEstadoSchema);
const Firma = mongoose.model('Firma', firmaSchema);
const Resultado = mongoose.model('Resultado', resultadoSchema);

module.exports = {
    Muestra,
    TipoAgua,
    CambioEstado,
    Firma,
    Resultado
};
