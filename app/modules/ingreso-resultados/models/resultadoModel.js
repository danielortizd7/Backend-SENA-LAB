const mongoose = require("mongoose");

const resultadoSchema = new mongoose.Schema(
  {
    idMuestra: { type: String, required: true, unique: true },
    datosMuestra: {  // ✅ Guarda información de la muestra
      documento: String,
      fechaHora: Date,
      tipoMuestreo: String,
      analisisSeleccionados: Array,
    },
    pH: { type: Number, required: true },
    turbidez: { type: Number, required: true },
    oxigenoDisuelto: { type: Number, required: true },
    nitratos: { type: Number, required: true },
    fosfatos: { type: Number, required: true },
    cedulaLaboratorista: { type: String, required: true },
    nombreLaboratorista: { type: String, required: true },
    fechaAnalisis: { type: Date, default: Date.now },  // ✅ Fecha de análisis automática
  },
  { timestamps: true }
);

module.exports = mongoose.model("IngresoResultados", resultadoSchema);
