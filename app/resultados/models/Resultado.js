const mongoose = require('mongoose');

const resultadoSchema = new mongoose.Schema({
    idMuestra: {
        type: String,
        required: [true, 'El ID de la muestra es requerido'],
        trim: true
    },
    documento: {
        type: String,
        required: [true, 'El documento es requerido'],
        trim: true
    },
    fechaHora: {
        type: Date,
        required: [true, 'La fecha y hora son requeridas']
    },
    tipoMuestreo: {
        type: String,
        required: [true, 'El tipo de muestreo es requerido'],
        enum: ['simple', 'compuesto']
    },
    parametros: [{
        nombre: {
            type: String,
            required: [true, 'El nombre del parámetro es requerido']
        },
        valor: {
            type: Number,
            required: [true, 'El valor del parámetro es requerido']
        },
        unidad: String
    }],
    cedulaLaboratorista: {
        type: String,
        required: [true, 'La cédula del laboratorista es requerida'],
        trim: true
    },
    nombreLaboratorista: {
        type: String,
        required: [true, 'El nombre del laboratorista es requerido']
    },
    observacion: {
        type: String,
        default: 'Muestra en buen estado'
    },
    verificado: {
        type: Boolean,
        default: false
    },
    verificadoPor: {
        nombre: String,
        cedula: String,
        fecha: Date
    },
    historialCambios: [{
        accion: {
            type: String,
            required: true,
            enum: ['Registrado', 'Editado', 'Verificado']
        },
        nombre: String,
        cedula: String,
        cambios: mongoose.Schema.Types.Mixed,
        fecha: {
            type: Date,
            default: Date.now
        }
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

// Middleware pre-save para actualizar updatedAt
resultadoSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Check if the model exists before creating it
const Resultado = mongoose.models.Resultado || mongoose.model('Resultado', resultadoSchema);

module.exports = Resultado;