const mongoose = require("mongoose");

// Contador para generar IDs personalizados
const generarIdPersonalizado = async function () {
  const ultimo = await TipoAgua.findOne().sort({ _id: -1 });
  if (!ultimo) return "H01"; // Si no hay registros, inicia en H01

  const ultimoNumero = parseInt(ultimo._id.slice(1)); // Extrae el número
  const nuevoNumero = (ultimoNumero + 1).toString().padStart(2, "0"); // Incrementa y formatea
  return `H${nuevoNumero}`;
};

const tipoAguaSchema = new mongoose.Schema(
  {
    _id: { type: String }, // ID personalizado

    tipoDeAgua: {
      type: String,
      required: [true, "El tipo de agua es obligatorio"],
      trim: true,
      enum: {
        values: ["potable", "natural", "residual", "otra"],
        message: "El tipo de agua debe ser: potable, natural, residual u otra",
      },
    },

    tipoPersonalizado: {
      type: String,
      trim: true,
      validate: {
        validator: function (valor) {
          return this.tipoDeAgua !== "otra" || (valor && valor.trim().length > 0);
        },
        message: "Si seleccionas 'otra', debes ingresar un tipo personalizado.",
      },
    },

    descripcion: {
      type: String,
      required: [true, "La descripción es obligatoria"],
      trim: true,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

// Middleware para asignar _id antes de guardar
tipoAguaSchema.pre("save", async function (next) {
  if (!this._id) {
    this._id = await generarIdPersonalizado();
  }
  next();
});

// Modelo
const TipoAgua = mongoose.model("TiposAgua", tipoAguaSchema);
module.exports = TipoAgua;
