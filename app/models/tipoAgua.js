const mongoose = require("mongoose");

const tipoAguaSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    tipoDeAgua: {
      type: String,
      required: true,
      trim: true,
      enum: ["potable", "natural", "residual", "otra"],
    },
    tipoPersonalizado: { type: String, trim: true, default: null },
    descripcion: { type: String, required: true, trim: true },
    esPredefinido: { type: Boolean, default: false }, //bloqueo  predefinidos
  },
  { timestamps: true, versionKey: false }
);

tipoAguaSchema.set("toJSON", {
  transform: (doc, ret) => {
    return {
      id: ret._id,
      tipoDeAgua:
        ret.tipoDeAgua === "otra" && ret.tipoPersonalizado ? ret.tipoPersonalizado : ret.tipoDeAgua,
      descripcion: ret.descripcion,
      esPredefinido: ret.esPredefinido,
    };
  },
});

module.exports = mongoose.model("TipoAgua", tipoAguaSchema, "tiposaguas");
