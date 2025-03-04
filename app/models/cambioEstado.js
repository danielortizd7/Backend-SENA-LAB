const mongoose = require("mongoose");

const cambioEstadoSchema = new mongoose.Schema(
  {
    idMuestra: { type: String, required: true },
    historial: [
      {
        estado: { type: String, required: true },
        cedulaLaboratorista: { type: String, required: true },
        fechaCambio: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("CambioEstado", cambioEstadoSchema, "cambioestados");
