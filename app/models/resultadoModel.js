const mongoose = require("mongoose");

const resultadoSchema = new mongoose.Schema(
  {
    idMuestra: { type: String, required: true, unique: true },
    pH: { type: Number, required: true },
    turbidez: { type: Number, required: true },
    oxigenoDisuelto: { type: Number, required: true },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Resultado", resultadoSchema, "resultados");

