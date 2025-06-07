const AuditoriaUnified = require("../models/auditoria.model");
const Analisis = require("../../../shared/models/analisisModel");
const excelService = require('../../../shared/utils/generarExelAuditoria');
const { Muestra } = require("../../../shared/models/muestrasModel");

// Constantes para estados de muestra y sus transiciones válidas
const ESTADOS_MUESTRA = {
  RECIBIDA: 'Recibida',
  EN_ANALISIS: 'En análisis',
  FINALIZADA: 'Finalizada',
  EN_COTIZACION: 'En Cotización',
  RECHAZADA: 'Rechazada',
  PENDIENTE: 'Pendiente',
  APROBADA: 'Aprobada'
};

const TRANSICIONES_VALIDAS = {
  [ESTADOS_MUESTRA.RECIBIDA]: [ESTADOS_MUESTRA.EN_ANALISIS, ESTADOS_MUESTRA.RECHAZADA, ESTADOS_MUESTRA.EN_COTIZACION],
  [ESTADOS_MUESTRA.EN_ANALISIS]: [ESTADOS_MUESTRA.FINALIZADA, ESTADOS_MUESTRA.RECHAZADA],
  [ESTADOS_MUESTRA.FINALIZADA]: [ESTADOS_MUESTRA.APROBADA],
  [ESTADOS_MUESTRA.PENDIENTE]: [ESTADOS_MUESTRA.RECIBIDA, ESTADOS_MUESTRA.RECHAZADA],
  [ESTADOS_MUESTRA.EN_COTIZACION]: [ESTADOS_MUESTRA.RECIBIDA, ESTADOS_MUESTRA.RECHAZADA],
  [ESTADOS_MUESTRA.APROBADA]: [], // Estado final
  [ESTADOS_MUESTRA.RECHAZADA]: [] // Estado final
};

const FASES_PROGRESO = [
  ESTADOS_MUESTRA.RECIBIDA,
  ESTADOS_MUESTRA.EN_ANALISIS,
  ESTADOS_MUESTRA.FINALIZADA,
  ESTADOS_MUESTRA.APROBADA
];

/**
 * Genera información del progreso de la muestra a través de las fases
 * @param {string} estadoActual - Estado actual de la muestra
 * @param {Array} historialEstados - Historial de cambios de estado
 * @returns {Object} Información del progreso
 */
const generarProgresoMuestra = (estadoActual, historialEstados = []) => {
  const progreso = {
    faseActual: estadoActual,
    fasesCompletadas: [],
    fasesRestantes: [],
    porcentajeCompletado: 0,
    esFaseValida: FASES_PROGRESO.includes(estadoActual) || estadoActual === ESTADOS_MUESTRA.RECHAZADA,
    transicionesRealizadas: [],
    siguientesFasesPermitidas: TRANSICIONES_VALIDAS[estadoActual] || []
  };

  // Analizar historial para obtener transiciones realizadas
  if (historialEstados.length > 0) {
    progreso.transicionesRealizadas = historialEstados.map(item => ({
      desde: item.estadoAnterior || 'Inicial',
      hacia: item.estado,
      fecha: item.fechaCambio || item.fecha,
      usuario: item.usuario,
      observaciones: item.observaciones
    }));
  }

  // Calcular fases completadas
  FASES_PROGRESO.forEach(fase => {
    const tieneHistorialDeFase = historialEstados.some(h => h.estado === fase);
    if (tieneHistorialDeFase || fase === estadoActual) {
      progreso.fasesCompletadas.push(fase);
    } else {
      progreso.fasesRestantes.push(fase);
    }
  });

  // Calcular porcentaje de completado
  if (estadoActual === ESTADOS_MUESTRA.RECHAZADA) {
    progreso.porcentajeCompletado = 0; // Las muestras rechazadas no cuentan como progreso
  } else if (estadoActual === ESTADOS_MUESTRA.APROBADA) {
    progreso.porcentajeCompletado = 100;
  } else {
    const indiceActual = FASES_PROGRESO.indexOf(estadoActual);
    if (indiceActual >= 0) {
      progreso.porcentajeCompletado = Math.round(((indiceActual + 1) / FASES_PROGRESO.length) * 100);
    }
  }

  return progreso;
};

/**
 * Valida si una transición de estado es válida
 * @param {string} estadoOrigen - Estado actual
 * @param {string} estadoDestino - Estado objetivo
 * @returns {Object} Resultado de la validación
 */
const validarTransicionEstado = (estadoOrigen, estadoDestino) => {
  // Si es la creación inicial (de null a cualquier estado), permitir solo estados iniciales válidos
  if (estadoOrigen === null || estadoOrigen === undefined) {
    const estadosIniciales = [ESTADOS_MUESTRA.RECIBIDA, ESTADOS_MUESTRA.PENDIENTE, ESTADOS_MUESTRA.EN_COTIZACION];
    const esValida = estadosIniciales.includes(estadoDestino);
    return {
      esValida,
      razon: esValida ? 'Creación inicial de muestra' : `Estado inicial inválido: ${estadoDestino}`,
      transicionesPermitidas: estadosIniciales
    };
  }
  
  const transicionesPermitidas = TRANSICIONES_VALIDAS[estadoOrigen] || [];
  const esValida = transicionesPermitidas.includes(estadoDestino);
  
  return {
    esValida,
    razon: esValida ? 'Transición válida' : `No se puede cambiar de ${estadoOrigen} a ${estadoDestino}`,
    transicionesPermitidas
  };
};

class AuditoriaService {
  async obtenerRegistroAuditoria(id) {
    try {
      if (!id) {
        throw new Error('ID de auditoría es requerido');
      }
      
      const registro = await AuditoriaUnified.findOne({ _id: id }).lean();
      
      if (!registro) {
        throw new Error('Registro de auditoría no encontrado');
      }
      
      return registro;
    } catch (error) {
      console.error('Error obteniendo registro de auditoría:', error);
      throw error;
    }
  }

  async construirQueryFiltros(filtros = {}) {
    const query = {};

    if (filtros.fechaInicio && filtros.fechaFin) {
      query.fecha = {
        $gte: new Date(filtros.fechaInicio),
        $lte: new Date(filtros.fechaFin)
      };
    }

    if (filtros.usuario) {
      query['usuario.documento'] = filtros.usuario;
    }

    if (filtros.accion) {
      query['accion.descripcion'] = filtros.accion;
    }

    if (filtros.idMuestra) {
      query['detalles.idMuestra'] = filtros.idMuestra;
    }

    return query;
  }
  async registrarAccion(datosAuditoria) {
    try {
      if (!datosAuditoria.usuario || !datosAuditoria.accion) {
        throw new Error('Datos de usuario y acción son requeridos');
      }

      if (!datosAuditoria.detalles?.id_muestra) {
        throw new Error('El ID de muestra es requerido para la auditoría');
      }

      const auditoriaId = `aud-${datosAuditoria.detalles.id_muestra}`;
      
      // Fecha actual formateada
      const ahora = new Date();
      const fechaActual = {
        fecha: ahora.toLocaleDateString('es-ES'),
        hora: ahora.toLocaleTimeString('es-ES'),
        timestamp: ahora
      };      // Detectar cambios de estado para tracking mejorado
      let transicionEstado = null;
      let estadoActualMuestra = datosAuditoria.detalles?.estado || datosAuditoria.detalles?.muestra?.estado || 'Recibida';
      
      // El estado del documento debe reflejar el estado de la muestra, pero puede ser sobrescrito si se especifica explícitamente
      let estadoDocumento = datosAuditoria.estado || estadoActualMuestra;
      
      // Obtener el registro existente para detectar cambios de estado automáticamente
      const registroExistente = await AuditoriaUnified.findOne({ _id: auditoriaId });
      let estadoAnterior = null;
      
      if (registroExistente) {
        estadoAnterior = registroExistente.muestra?.estado || registroExistente.estado;
      }
      
      // Detectar transición de estado automáticamente
      if (datosAuditoria.transicionEstado) {
        const validacion = validarTransicionEstado(datosAuditoria.transicionEstado.estadoAnterior, datosAuditoria.transicionEstado.estadoNuevo);
        transicionEstado = {
          desde: datosAuditoria.transicionEstado.estadoAnterior,
          hacia: datosAuditoria.transicionEstado.estadoNuevo,
          esValida: validacion.esValida,
          razon: validacion.razon,
          fecha: fechaActual
        };
        // Usar el estado nuevo de la transición como estado actual
        estadoActualMuestra = datosAuditoria.transicionEstado.estadoNuevo;
        // El estado del documento debe reflejar el estado de la muestra
        estadoDocumento = datosAuditoria.estado || datosAuditoria.transicionEstado.estadoNuevo;
      } else if (datosAuditoria.detalles?.estadoAnterior && datosAuditoria.detalles?.estadoNuevo) {
        const validacion = validarTransicionEstado(datosAuditoria.detalles.estadoAnterior, datosAuditoria.detalles.estadoNuevo);
        transicionEstado = {
          desde: datosAuditoria.detalles.estadoAnterior,
          hacia: datosAuditoria.detalles.estadoNuevo,
          esValida: validacion.esValida,
          razon: validacion.razon,
          fecha: fechaActual
        };
        // Usar el estado nuevo de la transición como estado actual
        estadoActualMuestra = datosAuditoria.detalles.estadoNuevo;
        // El estado del documento debe reflejar el estado de la muestra
        estadoDocumento = datosAuditoria.estado || datosAuditoria.detalles.estadoNuevo;
      } else if (estadoAnterior && estadoAnterior !== estadoActualMuestra) {
        // Detectar cambio de estado automáticamente si hay diferencia
        const validacion = validarTransicionEstado(estadoAnterior, estadoActualMuestra);
        transicionEstado = {
          desde: estadoAnterior,
          hacia: estadoActualMuestra,
          esValida: validacion.esValida,
          razon: validacion.razon,
          fecha: fechaActual
        };
      } else if (!registroExistente && estadoActualMuestra) {
        // Primera vez que se registra la muestra
        const validacion = validarTransicionEstado(null, estadoActualMuestra);
        transicionEstado = {
          desde: null,
          hacia: estadoActualMuestra,
          esValida: validacion.esValida,
          razon: validacion.razon,
          fecha: fechaActual
        };
      }// Historial entry for this action
      const entradaHistorial = {
        cambios: {
          accion: datosAuditoria.accion.descripcion,
          tipo: datosAuditoria.accion.tipo,
          modulo: datosAuditoria.accion.modulo,
          criticidad: datosAuditoria.accion.criticidad || 'normal',
          antes: datosAuditoria.detalles?.cambios?.antes || null,
          despues: datosAuditoria.detalles?.cambios?.despues || null,
          transicionEstado: transicionEstado
        },
        fecha: fechaActual,
        usuario: {
          id: datosAuditoria.usuario.id,
          nombre: datosAuditoria.usuario.nombre,
          rol: datosAuditoria.usuario.rol,
          documento: datosAuditoria.usuario.documento
        },        // Asegurar que las observaciones se asignen correctamente desde todas las fuentes posibles
        observaciones: datosAuditoria.detalles?.observaciones || 
                      datosAuditoria.detalles?.verificacion?.observaciones ||
                      datosAuditoria.detalles?.resultados?.observaciones ||
                      datosAuditoria.observaciones || 
                      datosAuditoria.mensaje || 
                      ''};

      // Check if the record exists (using the same query we made above)
      if (!registroExistente) {        // If record doesn't exist, create new one
        const registro = await AuditoriaUnified.create({
          _id: auditoriaId,
          muestra: {
            id_muestra: datosAuditoria.detalles.id_muestra,
            _id: datosAuditoria.detalles._id || datosAuditoria.detalles.muestra?._id,
            cliente: datosAuditoria.detalles.cliente || datosAuditoria.detalles.muestra?.cliente,
            tipoDeAgua: datosAuditoria.detalles.tipoDeAgua || datosAuditoria.detalles.muestra?.tipoDeAgua,
            tipoMuestreo: datosAuditoria.detalles.tipoMuestreo || datosAuditoria.detalles.muestra?.tipoMuestreo,
            lugarMuestreo: datosAuditoria.detalles.lugarMuestreo || datosAuditoria.detalles.muestra?.lugarMuestreo,
            fechaHoraMuestreo: datosAuditoria.detalles.fechaHoraMuestreo || datosAuditoria.detalles.muestra?.fechaHoraMuestreo,
            tipoAnalisis: datosAuditoria.detalles.tipoAnalisis || datosAuditoria.detalles.muestra?.tipoAnalisis,
            identificacionMuestra: datosAuditoria.detalles.identificacionMuestra || datosAuditoria.detalles.muestra?.identificacionMuestra,
            planMuestreo: datosAuditoria.detalles.planMuestreo || datosAuditoria.detalles.muestra?.planMuestreo,
            condicionesAmbientales: datosAuditoria.detalles.condicionesAmbientales || datosAuditoria.detalles.muestra?.condicionesAmbientales,
            preservacionMuestra: datosAuditoria.detalles.preservacionMuestra || datosAuditoria.detalles.muestra?.preservacionMuestra,
            analisisSeleccionados: datosAuditoria.detalles.analisisSeleccionados || datosAuditoria.detalles.muestra?.analisisSeleccionados || [],
            estado: datosAuditoria.detalles?.estado || datosAuditoria.detalles?.muestra?.estado,
            rechazoMuestra: datosAuditoria.detalles.rechazoMuestra || datosAuditoria.detalles.muestra?.rechazoMuestra,
            observaciones: datosAuditoria.detalles.observaciones || datosAuditoria.detalles.muestra?.observaciones || '',
            historial: datosAuditoria.detalles.historial || datosAuditoria.detalles.muestra?.historial || [],
            creadoPor: datosAuditoria.detalles.creadoPor || datosAuditoria.detalles.muestra?.creadoPor,
            actualizadoPor: datosAuditoria.detalles.actualizadoPor || datosAuditoria.detalles.muestra?.actualizadoPor || [],
            createdAt: datosAuditoria.detalles.createdAt || datosAuditoria.detalles.muestra?.createdAt,
            updatedAt: datosAuditoria.detalles.updatedAt || datosAuditoria.detalles.muestra?.updatedAt,
            precioTotal: datosAuditoria.detalles.precioTotal || datosAuditoria.detalles.muestra?.precioTotal,
            firmas: datosAuditoria.detalles.firmas || datosAuditoria.detalles.muestra?.firmas
          },
          accion: {
            descripcion: datosAuditoria.accion.descripcion,
            tipo: datosAuditoria.accion.tipo || 'general',
            modulo: datosAuditoria.accion.modulo || 'muestra',
            criticidad: datosAuditoria.accion.criticidad || 'normal'
          },
          creadoPor: {
            id: datosAuditoria.usuario.id,
            nombre: datosAuditoria.usuario.nombre,
            rol: datosAuditoria.usuario.rol,
            documento: datosAuditoria.usuario.documento,
            ip: datosAuditoria.usuario.ip || 'N/A',
            userAgent: datosAuditoria.usuario.userAgent || 'N/A',
            fechaCreacion: fechaActual
          },
          fecha: fechaActual,          metadata: {
            version: datosAuditoria.detalles?.metadata?.version || '1.0',
            entorno: process.env.NODE_ENV || 'development',
            ultimaActualizacion: fechaActual
          },
          estado: estadoDocumento,
          mensaje: datosAuditoria.mensaje || '',
          historial: [entradaHistorial]        });
        return registro;
      } else {
        // If record exists, update it
        const registro = await AuditoriaUnified.findOneAndUpdate(
          { _id: auditoriaId },
          {            $set: {
              'accion.descripcion': datosAuditoria.accion.descripcion,
              'accion.tipo': datosAuditoria.accion.tipo || 'general',
              'accion.modulo': datosAuditoria.accion.modulo || 'muestra',
              'accion.criticidad': datosAuditoria.accion.criticidad || 'normal',
              'metadata.ultimaActualizacion': fechaActual,
              'metadata.version': datosAuditoria.detalles?.metadata?.version || '1.0',
              'metadata.entorno': process.env.NODE_ENV || 'development',
              estado: estadoDocumento,
              mensaje: datosAuditoria.mensaje || '',
              'muestra.estado': estadoActualMuestra,
              // Actualizar todos los campos de la muestra si están presentes
              ...(datosAuditoria.detalles.fechaHoraMuestreo && { 'muestra.fechaHoraMuestreo': datosAuditoria.detalles.fechaHoraMuestreo }),
              ...(datosAuditoria.detalles.tipoAnalisis && { 'muestra.tipoAnalisis': datosAuditoria.detalles.tipoAnalisis }),
              ...(datosAuditoria.detalles.identificacionMuestra && { 'muestra.identificacionMuestra': datosAuditoria.detalles.identificacionMuestra }),
              ...(datosAuditoria.detalles.planMuestreo && { 'muestra.planMuestreo': datosAuditoria.detalles.planMuestreo }),
              ...(datosAuditoria.detalles.condicionesAmbientales && { 'muestra.condicionesAmbientales': datosAuditoria.detalles.condicionesAmbientales }),
              ...(datosAuditoria.detalles.preservacionMuestra && { 'muestra.preservacionMuestra': datosAuditoria.detalles.preservacionMuestra }),
              ...(datosAuditoria.detalles.analisisSeleccionados && { 'muestra.analisisSeleccionados': datosAuditoria.detalles.analisisSeleccionados }),
              ...(datosAuditoria.detalles.observaciones && { 'muestra.observaciones': datosAuditoria.detalles.observaciones }),
              ...(datosAuditoria.detalles.precioTotal && { 'muestra.precioTotal': datosAuditoria.detalles.precioTotal })
            },
            $push: { 
              historial: entradaHistorial            }
          },
          { 
            new: true
          }
        );
        return registro;
      }

      return registro;
    } catch (error) {
      console.error('Error registrando auditoría unificada:', error);
      throw error;
    }
  }

  async obtenerRegistros(filtros = {}, pagina = 1, limite = 10) {
    try {
      const skip = (pagina - 1) * limite;
      const query = await this.construirQueryFiltros(filtros);

      const registros = await AuditoriaUnified.find(query)
        .sort({ fecha: -1 })
        .skip(skip)
        .limit(limite)
        .lean();

      const total = await AuditoriaUnified.countDocuments(query);

      return {
        registros,
        total,
        pagina,
        totalPaginas: Math.ceil(total / limite)
      };
    } catch (error) {
      console.error('Error obteniendo registros de auditoría:', error);
      throw error;
    }
  }

  async obtenerAuditoriasSemanales(fechaInicio, fechaFin) {
    try {
      if (!fechaInicio || !fechaFin) {
        throw new Error('Se requieren fechaInicio y fechaFin para la consulta');
      }
      const registros = await AuditoriaUnified.find({
        fecha: {
          $gte: new Date(fechaInicio),
          $lte: new Date(fechaFin)
        }
      }).sort({ fecha: 1 }).lean();
      
      return registros;
    } catch (error) {
      console.error('Error obteniendo auditorías semanales:', error);
      throw error;
    }
  }

  async obtenerMuestrasParaAuditoria() {
    try {
      // Trae las muestras con los campos relevantes para la auditoría
      const muestras = await Muestra.find({}, {
        id_muestra: 1,
        "cliente.nombre": 1,
        "cliente.documento": 1,
        fechaHoraMuestreo: 1,
        estado: 1,
        analisisSeleccionados: 1
      }).lean();

      if (!muestras || muestras.length === 0) return [];

      return muestras.map(m => ({
        id: m.id_muestra || '',
        cliente: m.cliente?.nombre || '',
        fechaIngreso: m.fechaHoraMuestreo ? new Date(m.fechaHoraMuestreo).toLocaleString() : '',
        estado: m.estado || '',
        parametros: Array.isArray(m.analisisSeleccionados) ? m.analisisSeleccionados.map(a => a.nombre) : []
      }));
    } catch (error) {
      console.error('Error obteniendo muestras para auditoría:', error);
      throw error;
    }
  }

  async obtenerParametrosParaAuditoria() {
    try {
      // Trae todos los parámetros únicos de todas las muestras
      const muestras = await Muestra.find({}, { analisisSeleccionados: 1 }).lean();
      if (!muestras || muestras.length === 0) return [];
      
      const set = new Set();
      muestras.forEach(m => {
        (m.analisisSeleccionados || []).forEach(a => set.add(a.nombre));
      });
      
      return Array.from(set).map(nombre => ({ id: nombre, nombre }));
    } catch (error) {
      console.error('Error obteniendo parámetros para auditoría:', error);
      throw error;
    }
  }

  async obtenerHistorialAuditoria() {
    try {
      // Trae el historial de acciones relevantes agrupadas por parámetro
      const auditorias = await AuditoriaUnified.find({}, {
        fecha: 1,
        accion: 1,
        detalles: 1
      }).sort({ fecha: 1 }).lean();

      if (!auditorias || auditorias.length === 0) return [];

      // Cada entrada: { parametro, fecha, descripcion, cambios }
      const historial = [];
      auditorias.forEach(a => {
        if (a.detalles && Array.isArray(a.detalles.analisisSeleccionados)) {
          a.detalles.analisisSeleccionados.forEach(param => {
            historial.push({
              parametro: param.nombre,
              fecha: a.fecha ? new Date(a.fecha).toLocaleString() : '',
              descripcion: a.accion?.descripcion || '',
              cambios: a.detalles?.cambios?.despues || null,
              tipo: a.accion?.descripcion === 'registro nueva muestra' ? 'creacion' : 'modificacion'
            });
          });
        }
      });
      
      return historial;
    } catch (error) {
      console.error('Error obteniendo historial de auditoría:', error);
      throw error;
    }
  }

  /**
   * Obtiene el progreso completo de una muestra con información de auditoría
   * @param {string} idMuestra - ID de la muestra
   * @returns {Object} Información completa del progreso
   */
  async obtenerProgresoMuestra(idMuestra) {
    try {
      if (!idMuestra) {
        throw new Error('ID de muestra es requerido');
      }

      // Obtener registro de auditoría
      const auditoriaId = `aud-${idMuestra}`;
      const registro = await AuditoriaUnified.findOne({ _id: auditoriaId }).lean();
      
      if (!registro) {
        return {
          id_muestra: idMuestra,
          progreso: {
            faseActual: 'Sin información',
            fasesCompletadas: [],
            fasesRestantes: FASES_PROGRESO,
            porcentajeCompletado: 0,
            esFaseValida: false,
            transicionesRealizadas: [],
            siguientesFasesPermitidas: []
          },
          historialCompleto: [],
          mensaje: 'No se encontró información de auditoría para esta muestra'
        };
      }

      // Obtener historial de transiciones de estado del registro de auditoría
      const transicionesEstado = [];
      if (registro.historial && Array.isArray(registro.historial)) {
        registro.historial.forEach(entrada => {
          if (entrada.cambios?.transicionEstado) {
            transicionesEstado.push({
              desde: entrada.cambios.transicionEstado.desde,
              hacia: entrada.cambios.transicionEstado.hacia,
              fecha: entrada.fecha,
              usuario: entrada.usuario,
              esValida: entrada.cambios.transicionEstado.esValida,
              observaciones: entrada.cambios.transicionEstado.razon
            });
          }
        });
      }

      // Generar información del progreso
      const estadoActual = registro.muestra?.estado || 'Sin estado';
      const progreso = generarProgresoMuestra(estadoActual, transicionesEstado);

      // Agregar información adicional del progreso
      progreso.historialTransiciones = transicionesEstado;
      progreso.fechaUltimaActualizacion = registro.metadata?.ultimaActualizacion;
      progreso.totalAcciones = registro.historial ? registro.historial.length : 0;

      return {
        id_muestra: idMuestra,
        estadoActual,
        progreso,
        historialCompleto: registro.historial || [],
        muestra: registro.muestra,
        metadata: {
          version: registro.metadata?.version,
          entorno: registro.metadata?.entorno,
          creadoPor: registro.creadoPor,
          fechaCreacion: registro.fecha,
          ultimaActualizacion: registro.metadata?.ultimaActualizacion
        }
      };
    } catch (error) {
      console.error('Error obteniendo progreso de muestra:', error);
      throw error;
    }
  }

  /**
   * Genera un archivo Excel con los registros de auditoría
   * @param {Array} registros - Array de registros de auditoría
   * @returns {Buffer} Buffer del archivo Excel
   */
  async generarExcel(registros) {
    try {
      const generadorExcel = new excelService();
      return await generadorExcel.generarExcelAuditorias(registros);
    } catch (error) {
      console.error('Error generando Excel de auditoría:', error);
      throw error;
    }
  }
}

module.exports = new AuditoriaService();

