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
    cedulaLaboratorista: { type: String, required: true },
    nombreLaboratorista: { type: String, required: true },
  },
  {
    timestamps: true,
    versionKey: false, //Para que no salga "__v"
  }
);

//Aquí se ordenan los campos antes de guardar
resultadoSchema.set("toJSON", {
  transform: (doc, ret) => {
    return {
      idMuestra: ret.idMuestra,
      documento: ret.documento,
      fechaHora: ret.fechaHora,
      tipoMuestreo: ret.tipoMuestreo,
      pH: ret.pH,
      turbidez: ret.turbidez,
      oxigenoDisuelto: ret.oxigenoDisuelto,
      nitratos: ret.nitratos,
      fosfatos: ret.fosfatos,
      cedulaLaboratorista: ret.cedulaLaboratorista,
      nombreLaboratorista: ret.nombreLaboratorista,
      _id: ret._id,
      createdAt: ret.createdAt,
      updatedAt: ret.updatedAt,
    };
  },
});

module.exports = mongoose.model("Resultado", resultadoSchema);
