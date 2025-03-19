const mongoose = require("mongoose");

const estadosValidos = ["Recibida", "En análisis", "Pendiente de resultados", "Finalizada", "Rechazada"];

const muestraSchema = new mongoose.Schema(
  {
    documento: { type: String, required: true },
    fechaHora: { type: Date, required: true },
    tipoMuestreo: { type: String, required: true },
    analisisSeleccionados: { type: Array, required: true },
    id_muestra: { 
      type: String, 
      required: true,
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
        estado: { type: String, required: true, enum: estadosValidos },
        cedulaLaboratorista: { type: String, required: true, trim: true },
        fechaCambio: { type: Date, default: Date.now },
      },
    ],

    firmas: {
      cedulaLaboratorista: { 
        type: String,
        default: null
      },
      firmaLaboratorista: { 
        type: String,
        default: null
      },
      cedulaCliente: { 
        type: String,
        default: null
      },
      firmaCliente: { 
        type: String,
        default: null
      },
      
    },

    resultado: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resultado"
    }
  },
  { timestamps: true, versionKey: false }
);

const Muestra = mongoose.model("Muestra", muestraSchema, "muestras");

module.exports = {
    Muestra,
    estadosValidos
};