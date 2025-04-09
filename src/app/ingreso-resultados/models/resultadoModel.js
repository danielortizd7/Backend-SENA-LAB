const mongoose = require("mongoose");

const valorMedicionSchema = new mongoose.Schema({
    valor: {
        type: String,
        trim: true
    },
    unidad: {
        type: String,
        required: true
    }
}, { _id: false });

const cambioResultadoSchema = new mongoose.Schema({
    valorAnterior: {
        type: String,
        required: true
    },
    valorNuevo: {
        type: String,
        required: true
    },
    unidad: {
        type: String,
        required: true
    }
}, { _id: false });

// Esquema para datos de usuario
const datosUsuarioSchema = new mongoose.Schema({
    documento: {
        type: String,
        required: true
    },
    nombre: {
        type: String,
        required: true
    }
}, { _id: false });

const historialCambioSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true
    },
    cedula: {
        type: String,
        required: true
    },
    fecha: {
        type: Date,
        required: true
    },
    observaciones: {
        type: String,
        default: "Sin observaciones"
    },
    cambiosRealizados: {
        resultados: {
            type: Map,
            of: cambioResultadoSchema
        }
    }
}, { _id: false });

const resultadoSchema = new mongoose.Schema(
    {
        idMuestra: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            index: true,
            ref: 'Muestra'
        },
        cliente: {
            type: datosUsuarioSchema,
            required: true
        },
        tipoDeAgua: {
            tipo: {
                type: String,
                required: true
            },
            codigo: {
                type: String,
                required: true
            },
            descripcion: {
                type: String,
                required: true
            }
        },
        lugarMuestreo: {
            type: String,
            required: true
        },
        fechaHoraMuestreo: {
            type: Date,
            required: true
        },
        tipoAnalisis: {
            type: String,
            required: true
        },
        estado: {
            type: String,
            required: true,
            enum: ['Recibida', 'En análisis', 'Finalizada', 'Rechazada'],
            default: 'En análisis'
        },
        // Campos de resultados dinámicos
        cloruros: valorMedicionSchema,
        fluoruros: valorMedicionSchema,
        nitratos: valorMedicionSchema,
        nitritos: valorMedicionSchema,
        sulfatos: valorMedicionSchema,
        fosfatos: valorMedicionSchema,
        manganeso: valorMedicionSchema,
        observaciones: {
            type: String,
            default: ""
        },
        verificado: {
            type: Boolean,
            default: false
        },
        cedulaLaboratorista: String,
        nombreLaboratorista: String,
        historialCambios: [historialCambioSchema]
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Índices para mejorar el rendimiento de las consultas
resultadoSchema.index({ 'cliente.documento': 1 });
resultadoSchema.index({ fechaHoraMuestreo: -1 });
resultadoSchema.index({ estado: 1 });

// Virtual para obtener la muestra relacionada
resultadoSchema.virtual('muestra', {
    ref: 'Muestra',
    localField: 'idMuestra',
    foreignField: 'id_muestra',
    justOne: true
});

// Método estático para obtener resultado con muestra
resultadoSchema.statics.findWithMuestra = async function(id) {
    return this.findOne({ idMuestra: id }).populate('muestra');
};

// Método estático para obtener todos los resultados con sus muestras
resultadoSchema.statics.findAllWithMuestras = async function(query = {}, options = {}) {
    return this.find(query)
        .populate('muestra')
        .skip(options.skip)
        .limit(options.limit)
        .sort(options.sort || { fechaHoraMuestreo: -1 });
};

// Configurar el nombre del campo en MongoDB
resultadoSchema.set('toObject', {
    transform: function(doc, ret) {
        if (ret.idMuestra) {
            ret.idMuestra = ret.idMuestra;
            delete ret.idMuestra;
        }
        // Eliminar _id y __v de la respuesta principal
        delete ret._id;
        delete ret.__v;

        // Eliminar _id de cada elemento del historial
        if (ret.historialCambios) {
            ret.historialCambios = ret.historialCambios.map(cambio => {
                const cambioObj = cambio.toObject ? cambio.toObject() : cambio;
                delete cambioObj._id;
                return cambioObj;
            });
        }
        return ret;
    }
});

resultadoSchema.set('toJSON', {
    transform: function(doc, ret) {
        if (ret.idMuestra) {
            ret.idMuestra = ret.idMuestra;
            delete ret.idMuestra;
        }
        // Eliminar _id y __v de la respuesta principal
        delete ret._id;
        delete ret.__v;

        // Eliminar _id de cada elemento del historial
        if (ret.historialCambios) {
            ret.historialCambios = ret.historialCambios.map(cambio => {
                const cambioObj = cambio.toObject ? cambio.toObject() : cambio;
                delete cambioObj._id;
                return cambioObj;
            });
        }
        return ret;
    }
});

// Middleware para asegurar que idMuestra nunca sea null
resultadoSchema.pre('save', async function(next) {
    if (!this.idMuestra) {
        throw new Error('idMuestra es requerido y no puede ser null');
    }
    if (this.isNew) {
        const Muestra = mongoose.model('Muestra');
        const muestra = await Muestra.findOne({ id_muestra: this.idMuestra });
        if (!muestra) {
            throw new Error('La muestra referenciada no existe');
        }
    }
    next();
});

// Método de instancia para actualizar el estado de la muestra
resultadoSchema.methods.actualizarEstadoMuestra = async function(estado) {
    const Muestra = mongoose.model('Muestra');
    await Muestra.findOneAndUpdate(
        { id_muestra: this.idMuestra },
        { estado: estado }
    );
};

module.exports = mongoose.model("Resultado", resultadoSchema);
