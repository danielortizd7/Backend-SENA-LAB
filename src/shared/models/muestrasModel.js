const mongoose = require("mongoose");

const estadosValidos = ["Recibida", "En análisis", "Pendiente de resultados", "Finalizada", "Rechazada"];

const muestraSchema = new mongoose.Schema(
  {
    documento: { 
      type: String, 
      required: true,
      immutable: true // No se puede modificar una vez creado
    },
    fechaHora: { 
      type: Date, 
      required: true,
      default: Date.now,
      immutable: true // No se puede modificar una vez creado
    },
    tipoMuestreo: { 
      type: String, 
      required: true 
    },
    analisisSeleccionados: { 
      type: Array, 
      required: true 
    },
    id_muestra: { 
      type: String, 
      required: true,
      immutable: true,
      index: { 
        unique: true,
        collation: { locale: "es", strength: 2 }
      }
    },
    tipoDeAgua: {
      tipo: { 
        type: String,
        enum: ['potable', 'natural', 'residual', 'otra']
      },
      tipoPersonalizado: String,
      descripcion: String
    },
    historial: [
      {
        estado: { 
          type: String, 
          required: true, 
          enum: estadosValidos 
        },
        cedulaadministrador: { 
          type: String, 
          required: true, 
          trim: true 
        },
        nombreadministrador: { 
          type: String, 
          required: true 
        },
        fechaCambio: { 
          type: Date, 
          default: Date.now,
          immutable: true 
        },
        observaciones: String
      }
    ],
    creadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
      immutable: true
    },
    actualizadoPor: [{
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
        default: Date.now,
        immutable: true
      },
      accion: {
        type: String,
        required: true,
        enum: ['creación', 'actualización', 'cambio_estado']
      }
    }]
  },
  { 
    timestamps: true, 
    versionKey: false 
  }
);

// Middleware pre-save para asegurar que siempre haya un registro en actualizadoPor cuando se crea
muestraSchema.pre('save', function(next) {
  if (this.isNew && !this.actualizadoPor.length) {
    this.actualizadoPor.push({
      usuario: this.creadoPor,
      fecha: this.fechaHora,
      accion: 'creación'
    });
  }
  next();
});

// Verificar si el modelo ya existe antes de crearlo
const Muestra = mongoose.models.Muestra || mongoose.model("Muestra", muestraSchema, "muestras");

module.exports = {
    Muestra,
    estadosValidos
};