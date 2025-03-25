const mongoose = require("mongoose");


const resultadoSchema = new mongoose.Schema(
  {
    idMuestra: {
      type: String,
      required: true,
      trim: true
    },
    documento: {
      type: String,
      required: true,
      trim: true
    },
    fechaHora: {
      type: Date,
      required: true
    },
    tipoMuestreo: {
      type: String,
      required: true
    },
    pH: {
      valor: {
        type: Number,
        min: 0,
        max: 14
      },
      unidad: {
        type: String,
        default: "mg/L"
      }
    },
    turbidez: {
      valor: {
        type: Number,
        min: 0
      },
      unidad: {
        type: String,
        default: "NTU"
      }
    },
    oxigenoDisuelto: {
      valor: {
        type: Number,
        min: 0
      },
      unidad: {
        type: String,
        default: "mg/L"
      }
    },
    nitratos: {
      valor: {
        type: Number,
        min: 0
      },
      unidad: {
        type: String,
        default: "mg/L"
      }
    },
    solidosSuspendidos: {
      valor: {
        type: Number,
        min: 0
      },
      unidad: {
        type: String,
        default: "mg/L"
      }
    },
    fosfatos: {
      valor: {
        type: Number,
        min: 0
      },
      unidad: {
        type: String,
        default: "mg/L"
      }
    },
    verificado: {
      type: Boolean,
      default: false
    },
    cedulaLaboratorista: {
      type: String,
      required: true
    },
    nombreLaboratorista: {
      type: String,
      required: true
    },
    historialCambios: [{
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
        default: Date.now
      }
    }]
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Índices para mejorar el rendimiento de las consultas
resultadoSchema.index({ idMuestra: 1 });
resultadoSchema.index({ documento: 1 });
resultadoSchema.index({ fechaHora: -1 });

module.exports = mongoose.model("Resultado", resultadoSchema);
