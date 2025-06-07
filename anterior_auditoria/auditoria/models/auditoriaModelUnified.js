const mongoose = require("mongoose");

const auditoriaUnifiedSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true
    },
    usuario: {
      id: String,
      nombre: String,
      rol: String,
      documento: String
    },
    accion: {
      descripcion: {
        type: String,
        required: true,
        enum: [
          "registro nueva muestra",
          "registro de resultado",
          "actualización de resultado",
          "otra acción"
        ]
      }
    },
    detalles: {
      id_muestra: String,
      cliente: Object,
      tipoDeAgua: Object,
      lugarMuestreo: String,
      fechaHoraMuestreo: Date,
      tipoAnalisis: String,
      estado: String,
      analisisSeleccionados: Array,
      resultados: Object,
      cambios: {
        antes: Object,
        despues: Object
      },
      parametros: Object,
      query: Object
    },
    fecha: {
      type: Date,
      default: Date.now,
      required: true
    },
    estado: {
      type: String,
      enum: ['exitoso', 'fallido'],
      default: 'exitoso',
      required: true
    },
    mensaje: String,
    duracion: Number,
    error: {
      codigo: String,
      mensaje: String,
      stack: String
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

auditoriaUnifiedSchema.index({ 'usuario.documento': 1 });
auditoriaUnifiedSchema.index({ fecha: -1 });
auditoriaUnifiedSchema.index({ 'accion.descripcion': 1 });
auditoriaUnifiedSchema.index({ estado: 1 });
auditoriaUnifiedSchema.index({ 'usuario.rol': 1 });
auditoriaUnifiedSchema.index({ 'detalles.idMuestra': 1 });

const Counter = require('./counterModel');

auditoriaUnifiedSchema.statics.generarNuevoId = async function() {
  const now = new Date();
  const mesActual = now.getMonth() + 1; // Mes actual (1-12)
  const anioActual = now.getFullYear();

  let sequenceDocument = await Counter.findOne({ _id: 'auditoriaId' });

  if (!sequenceDocument) {
    // Crear nuevo documento si no existe
    sequenceDocument = new Counter({
      _id: 'auditoriaId',
      seq: 1,
      mes: mesActual,
      anio: anioActual
    });
  } else {
    // Verificar si el mes o año ha cambiado para reiniciar el contador
    if (sequenceDocument.mes !== mesActual || sequenceDocument.anio !== anioActual) {
      sequenceDocument.seq = 1;
      sequenceDocument.mes = mesActual;
      sequenceDocument.anio = anioActual;
    } else {
      sequenceDocument.seq += 1;
    }
  }

  await sequenceDocument.save();

  const nuevoNumero = sequenceDocument.seq;
  const nuevoId = 'auditoria' + nuevoNumero.toString().padStart(3, '0');
  return nuevoId;
};

module.exports = mongoose.model("AuditoriaUnified", auditoriaUnifiedSchema);
