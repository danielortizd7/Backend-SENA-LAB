const mongoose = require("mongoose");
const dbExterna = mongoose.connection.useDb("test");

const muestraSchema = new mongoose.Schema({
  documento: { type: String },
  fechaHora: { type: Date },
  tipoMuestreo: { type: String },
  analisisSeleccionados: { type: Array },
  id_muestra: { type: String },
  firmas: {
    cedulaLaboratorista: { type: String },
    firmaLaboratorista: { type: String },
    cedulaCliente: { type: String },
    firmaCliente: { type: String },
  },
});

// Index para buscar sin importar mayúsculas o minúsculas
muestraSchema.index({ id_muestra: 1 }, { collation: { locale: "es", strength: 2 } });

module.exports = dbExterna.model("Muestra", muestraSchema, "muestras");
