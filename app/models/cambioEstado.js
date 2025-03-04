const mongoose = require("mongoose");

const cambioEstadoSchema = new mongoose.Schema(
  {
    idMuestra: { type: String, required: true, unique: true },
    estado: { type: String, required: true },
    cedulaLaboratorista: { type: String, required: true },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("CambioEstado", cambioEstadoSchema, "cambioestados");
