const mongoose = require('mongoose');

const historialEstadoSchema = new mongoose.Schema({
  estado: {
    type: String,
    required: true,
    enum: ["Recibida", "En Proceso", "Finalizada", "Cotizada", "Aprobada", "Rechazada"]
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  }
});

const muestraSchema = new mongoose.Schema({
  estado: {
    type: String,
    required: true,
    enum: ["Recibida ", "En Proceso", "Finalizada", "Cotizada", "Aprobada", "Rechazada"],
    default: "Recibida "
  },
  historialEstados: [historialEstadoSchema],
});

module.exports = mongoose.model('Muestra', muestraSchema); 