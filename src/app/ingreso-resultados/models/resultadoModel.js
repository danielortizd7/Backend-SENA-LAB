const mongoose = require("mongoose");


const resultadoSchema = new mongoose.Schema(
  {
    idMuestra: { type: String, required: true },
    documento: { type: String, required: true },
    fechaHora: { type: Date, required: true },
    tipoMuestreo: { type: String, required: true },
    pH: { type: Number, required: false },
    turbidez: { type: Number, required: false },
    oxigenoDisuelto: { type: Number, required: false },
    nitratos: { type: Number, required: false },
    fosfatos: { type: Number, required: false },
    observacion: { type: String, required: false }, // Observaciones
    verificado: { type: Boolean, default: false }, // Marcar como verificado
    cedulaLaboratorista: { type: String, required: true },
    nombreLaboratorista: { type: String, required: true },

    historialCambios: [
      {
        nombre: { type: String },
        cedula: { type: String },
        cambios: { type: Object }, // Guarda los cambios realizados
        fecha: { type: Date, default: Date.now }, // Marca cuándo se hizo el cambio
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Resultado", resultadoSchema);
