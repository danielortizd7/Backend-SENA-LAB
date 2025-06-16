const mongoose = require('mongoose');

const historialEstadoSchema = new mongoose.Schema({
  estado: {
    type: String,
    required: true,
    enum: ["Recibida", "En análisis", "Finalizada", "En Cotizacion", "Rechazada", "Aceptada"]
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
    enum: ["Recibida", "En análisis", "Finalizada", "En Cotizacion", "Rechazada", "Aceptada"],
    default: "Recibida"
  },
  historialEstados: [historialEstadoSchema],
});

module.exports = mongoose.model('Muestra', muestraSchema); 