const mongoose = require("mongoose");

const auditoriaUnifiedSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true
    },
    // Información de la muestra y cliente (datos principales)
    muestra: {
      id_muestra: {
        type: String,
        required: true
      },
      _id: mongoose.Schema.Types.ObjectId,
      cliente: {
        _id: mongoose.Schema.Types.ObjectId,
        documento: String,
        nombre: String,
        email: String,
        telefono: String,
        direccion: String
      },
      tipoDeAgua: {
        tipo: String,
        codigo: String,
        descripcion: String
      },
      tipoMuestreo: String,
      lugarMuestreo: String,
      fechaHoraMuestreo: {
        fecha: String,
        hora: String,
        timestamp: Date
      },
      tipoAnalisis: String,
      identificacionMuestra: String,
      planMuestreo: String,
      condicionesAmbientales: String,
      preservacionMuestra: String,
      analisisSeleccionados: [{
        nombre: String,
        precio: String,
        unidad: String,
        metodo: String,
        rango: String
      }],
      estado: String,
      rechazoMuestra: {
        rechazada: Boolean,
        motivo: String,
        fechaRechazo: Date
      },
      observaciones: String,
      historial: [{
        type: Object
      }],
      creadoPor: {
        _id: mongoose.Schema.Types.ObjectId,
        nombre: String,
        documento: String,
        email: String,
        fechaCreacion: {
          fecha: String,
          hora: String,
          timestamp: Date
        }
      },
      actualizadoPor: [{
        type: Object
      }],
      createdAt: {
        fecha: String,
        hora: String,
        timestamp: Date
      },
      updatedAt: {
        fecha: String,
        hora: String,
        timestamp: Date
      },
      precioTotal: String,
      firmas: {
        firmaAdministrador: {
          firma: String
        },
        firmaCliente: {
          firma: String
        }
      }
    },
    // Información de la acción
    accion: {
      descripcion: {
        type: String,
        required: true,
        enum: [
          "registro nueva muestra",
          "registro de resultado",
          "actualización de resultado",
          "actualización de muestra",
          "eliminación de muestra",
          "error en creación de muestra",
          "error en actualización de muestra",
          "error en eliminación de muestra",
          "otra acción"
        ]
      },
      tipo: String,
      modulo: String,
      criticidad: String
    },
    // Información del creador
    creadoPor: {
      id: String,
      nombre: String,
      rol: String,
      documento: String,
      ip: String,
      userAgent: String,
      fechaCreacion: {
        fecha: String,
        hora: String,
        timestamp: Date
      }
    },
    // Metadatos y control
    metadata: {
      version: String,
      entorno: String,
      ultimaActualizacion: {
        fecha: String,
        hora: String,
        timestamp: Date
      }
    },
    fecha: {
      fecha: String,
      hora: String,
      timestamp: Date
    },
    estado: {
      type: String,
      required: true
    },
    mensaje: String,
    duracion: Number,
    error: {
      codigo: String,
      mensaje: String,
      stack: String
    },
    historial: [{
      cambios: Object,
      fecha: {
        fecha: String,
        hora: String,
        timestamp: Date
      },
      usuario: {
        id: String,
        nombre: String,
        rol: String,
        documento: String
      }
    }]
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
auditoriaUnifiedSchema.index({ 'muestra.id_muestra': 1 });

const Counter = require('./counterModel');

auditoriaUnifiedSchema.statics.generarNuevoId = async function(idMuestra) {
  const maxRetries = 5;
  let lastError;
  let backoffDelay = 100;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Si tenemos un ID de muestra, usarlo como parte del ID de auditoría
      if (idMuestra) {
        const id = `aud-${idMuestra}`;
        
        // Verificar ID único
        const existingDoc = await this.findOne({ _id: id });
        if (existingDoc) {
          throw new Error('Generated ID already exists');
        }
        
        return id;
      }

      // Si no hay ID de muestra, usar el formato anterior como fallback
      const nextSeq = await Counter.getNextSequence('auditoriaId');
      const timestamp = Date.now();
      const id = `auditoria${timestamp}_${nextSeq.toString().padStart(3, '0')}`;
      
      const existingDoc = await this.findOne({ _id: id });
      if (existingDoc) {
        throw new Error('Generated ID already exists');
      }
      
      return id;
    } catch (error) {
      console.warn(`Intento ${attempt + 1} fallido al generar ID de auditoría:`, error.message);
      lastError = error;
      
      if (attempt < maxRetries - 1) {
        backoffDelay = Math.min(backoffDelay * 2 + Math.random() * 100, 2000);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        continue;
      }
    }
  }

  console.error('Error al generar nuevo ID de auditoría después de múltiples intentos:', lastError);
  // Como último recurso, generar un ID único sin el contador
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `auditoria${timestamp}_${random}`;
};

module.exports = mongoose.model("AuditoriaUnified", auditoriaUnifiedSchema);

