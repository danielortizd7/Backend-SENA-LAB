const mongoose = require("mongoose");

const tipoAguaSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true }, // 🔥 Aquí está la NASA automática
    tipoDeAgua: {
      type: String,
      required: true,
      trim: true,
      enum: ["potable", "natural", "residual", "otra"],
    },
    tipoPersonalizado: { type: String, trim: true, default: null }, // Lo que faltaba para "otra"
    descripcion: { type: String, required: true, trim: true },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("TipoAgua", tipoAguaSchema, "tiposaguas"); // 🔥 Aquí aseguramos la colección
