const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');

// Configuración global de mongoose-paginate-v2
mongoosePaginate.paginate.options = {
  lean: true,
  limit: 10,
  customLabels: {
    totalDocs: 'total',
    docs: 'registros',
    limit: 'limite',
    page: 'pagina',
    totalPages: 'totalPaginas'
  }
};

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
    },    historial: [{
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true
      },
      cambios: {
        type: Object,
        default: {}
      },
      observaciones: {
        type: String,
        default: ""
      },
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

// Añadir plugin de paginación
auditoriaUnifiedSchema.plugin(mongoosePaginate);

auditoriaUnifiedSchema.index({ 'usuario.documento': 1 });
auditoriaUnifiedSchema.index({ fecha: -1 });
auditoriaUnifiedSchema.index({ 'accion.descripcion': 1 });
auditoriaUnifiedSchema.index({ estado: 1 });
auditoriaUnifiedSchema.index({ 'muestra.id_muestra': 1 });

auditoriaUnifiedSchema.statics.generarNuevoId = async function(idMuestra) {
  try {
    // El ID de muestra es requerido para la auditoría
    if (!idMuestra) {
      throw new Error('El ID de muestra es requerido para generar el ID de auditoría');
    }

    const id = `aud-${idMuestra}`;
    
    // Verificar ID único
    const existingDoc = await this.findOne({ _id: id });
    if (existingDoc) {
      throw new Error('Generated ID already exists');
    }
    
    return id;
  } catch (error) {
    console.error('Error al generar nuevo ID de auditoría:', error);
    throw error;
  }
};

auditoriaUnifiedSchema.statics.obtenerResumenSemanal = async function(fechaInicio, fechaFin) {
  return await this.aggregate([
    {
      $match: {
        fecha: {
          $gte: new Date(fechaInicio),
          $lte: new Date(fechaFin)
        }
      }
    },
    {
      $group: {
        _id: { $week: "$fecha" },
        total: { $sum: 1 },
        exitosos: {
          $sum: { $cond: [{ $eq: ["$estado", "exitoso"] }, 1, 0] }
        },
        fallidos: {
          $sum: { $cond: [{ $eq: ["$estado", "fallido"] }, 1, 0] }
        }
      }
    },
    { $sort: { "_id": 1 } }
  ]);
};

auditoriaUnifiedSchema.statics.obtenerResumenMensual = async function(fechaInicio, fechaFin) {
  return await this.aggregate([
    {
      $match: {
        fecha: {
          $gte: new Date(fechaInicio),
          $lte: new Date(fechaFin)
        }
      }
    },
    {
      $group: {
        _id: { $month: "$fecha" },
        total: { $sum: 1 },
        exitosos: {
          $sum: { $cond: [{ $eq: ["$estado", "exitoso"] }, 1, 0] }
        },
        fallidos: {
          $sum: { $cond: [{ $eq: ["$estado", "fallido"] }, 1, 0] }
        }
      }
    },
    { $sort: { "_id": 1 } }
  ]);
};

auditoriaUnifiedSchema.statics.obtenerEstadisticasGenerales = async function(fechaInicio, fechaFin) {
  const match = {
    fecha: {
      $gte: new Date(fechaInicio),
      $lte: new Date(fechaFin)
    }
  };

  const [porEstado, porAccion, porUsuario] = await Promise.all([
    this.aggregate([
      { $match: match },
      { $group: { _id: '$estado', total: { $sum: 1 } } }
    ]),
    this.aggregate([
      { $match: match },
      { $group: { _id: '$accion.tipo', total: { $sum: 1 } } }
    ]),
    this.aggregate([
      { $match: match },
      { $group: { _id: '$creadoPor.nombre', total: { $sum: 1 } } }
    ])
  ]);

  return {
    distribucionPorEstado: porEstado,
    distribucionPorAccion: porAccion,
    distribucionPorUsuario: porUsuario
  };
};

auditoriaUnifiedSchema.statics.obtenerMuestrasAuditadas = async function() {
  const ultimosDias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  return await this.aggregate([
    {
      $match: {
        fecha: { $gte: ultimosDias },
        'muestra.estado': { $exists: true }
      }
    },
    {
      $group: {
        _id: '$muestra.id_muestra',
        ultimoEstado: { $last: '$muestra.estado' },
        cantidadCambios: { $sum: 1 },
        ultimaActualizacion: { $max: '$fecha' },
        analisisSeleccionados: { $last: '$muestra.analisisSeleccionados' }
      }
    },
    { $sort: { ultimaActualizacion: -1 } },
    { $limit: 50 }
  ]);
};

auditoriaUnifiedSchema.statics.obtenerParametrosAuditados = async function() {
  return await this.aggregate([
    {
      $group: {
        _id: null,
        totalRegistros: { $sum: 1 },
        estados: { $addToSet: '$muestra.estado' },
        usuarios: { $addToSet: '$creadoPor.nombre' },
        tiposAccion: { $addToSet: '$accion.tipo' }
      }
    }
  ]);
};

auditoriaUnifiedSchema.statics.obtenerHistorialCompleto = async function() {
  const ultimoMes = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  return await this.aggregate([
    {
      $match: { fecha: { $gte: ultimoMes } }
    },
    {
      $project: {
        fecha: 1,
        'muestra.id_muestra': 1,
        'muestra.estado': 1,
        'accion.descripcion': 1,
        'creadoPor.nombre': 1
      }
    },
    { $sort: { fecha: -1 } },
    { $limit: 100 }
  ]);
};

auditoriaUnifiedSchema.statics.analizarPatrones = async function(idMuestra, periodo) {
  const registros = await this.find({
    'muestra.id_muestra': idMuestra,
    fecha: {
      $gte: new Date(Date.now() - periodo * 60 * 60 * 1000)
    }
  }).sort({ fecha: 1 });

  const patrones = {
    cambiosFrequentes: [],
    accionesInusuales: [],
    alertas: []
  };

  if (registros.length > 5) {
    const cambiosPorHora = registros.length / periodo;
    if (cambiosPorHora > 0.5) {
      patrones.alertas.push({
        tipo: 'cambios_frecuentes',
        mensaje: `Alta frecuencia de cambios: ${cambiosPorHora.toFixed(2)} cambios por hora`,
        nivel: 'alto'
      });
    }
  }

  return patrones;
};

auditoriaUnifiedSchema.statics.obtenerAlertas = async function() {
  const ultimasHoras = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  return await this.find({
    fecha: { $gte: ultimasHoras },
    'accion.criticidad': 'alta'
  })
  .sort({ fecha: -1 })
  .limit(10);
};

// Crear y exportar el modelo
const AuditoriaUnified = mongoose.model('AuditoriaUnified', auditoriaUnifiedSchema);

module.exports = AuditoriaUnified;

