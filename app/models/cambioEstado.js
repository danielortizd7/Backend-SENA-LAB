const mongoose = require("mongoose");

const estadosValidos = ["Recibida", "En análisis", "Pendiente de resultados", "Finalizada", "Rechazada"];

const cambioEstadoSchema = new mongoose.Schema(
  {
    idMuestra: { type: String, required: true, unique: true }, 

    estado: {
      type: String,
      enum: estadosValidos, // Solo permite los estados válidos
      default: "Recibida", // Estado inicial
      required: true,
    },

    fechaCambio: { type: Date, default: Date.now }, // Guarda la fecha automática

    cedulaLaboratorista: { type: String, required: true }, // Cédula del laboratorista

    nombreLaboratorista: { type: String, required: true }, // Nombre del laboratorista
  },
  {
    timestamps: true, // Guarda createdAt y updatedAt automáticamente
    versionKey: false, // Quita el campo "__v"
  }
);

module.exports = mongoose.model("CambioEstado", cambioEstadoSchema);
