const AuditoriaUnified = require("../models/auditoriaModelUnified");
const Analisis = require("../../../shared/models/analisisModel");
const excelService = require('../../../shared/utils/generarExelAuditoria');
const { Muestra } = require("../../../shared/models/muestrasModel");
const mongoose = require('mongoose');

// Función para formatear fecha y hora en formato consistente
const formatearFechaHora = (fecha) => {
    if (!fecha) return null;
    
    try {
        // Asegurarnos de que la fecha sea un objeto Date
        const fechaObj = new Date(fecha);
        
        // Convertir a zona horaria de Colombia (America/Bogota)
        const fechaColombiana = new Date(fechaObj.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
        
        // Formatear fecha
        const dia = fechaColombiana.getDate().toString().padStart(2, '0');
        const mes = (fechaColombiana.getMonth() + 1).toString().padStart(2, '0');
        const año = fechaColombiana.getFullYear();
        
        // Formatear hora en formato 24 horas para consistencia
        const horas = fechaColombiana.getHours().toString().padStart(2, '0');
        const minutos = fechaColombiana.getMinutes().toString().padStart(2, '0');
        const segundos = fechaColombiana.getSeconds().toString().padStart(2, '0');
        
        return {
            fecha: `${dia}/${mes}/${año}`,
            hora: `${horas}:${minutos}:${segundos}`,
            timestamp: fechaColombiana.toISOString()
        };
    } catch (error) {
        console.error('Error al formatear fecha:', error);
        return null;
    }
};

class AuditoriaService {
  construirQueryFiltros(filtros = {}) {
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

      // Asegurarnos de que id_muestra esté presente en los detalles
      if (!datosAuditoria.detalles) {
        datosAuditoria.detalles = {};
      }

      // Manejar el id_muestra que puede venir como idMuestra
      const idMuestra = datosAuditoria.detalles.id_muestra || datosAuditoria.detalles.idMuestra;
      if (!idMuestra) {
        console.error('Detalles recibidos:', JSON.stringify(datosAuditoria.detalles, null, 2));
        throw new Error('id_muestra es requerido en detalles');
      }

      // Normalizar el id_muestra en los detalles
      datosAuditoria.detalles.id_muestra = idMuestra;

      // Buscar documento de auditoría existente
      const docExistente = await AuditoriaUnified.findOne({
        '_id': `aud-${idMuestra}`
      });

      // Datos para historial
      const historialNuevo = {
        cambios: datosAuditoria.detalles?.cambios,
        fecha: formatearFechaHora(new Date()),
        usuario: {
          id: datosAuditoria.usuario.id,
          nombre: datosAuditoria.usuario.nombre,
          rol: datosAuditoria.usuario.rol,
          documento: datosAuditoria.usuario.documento
        }
      };

      if (docExistente) {
        // Preparar los datos de la muestra
        const datosMuestra = {
          ...docExistente.muestra,
          ...datosAuditoria.detalles,
          id_muestra: idMuestra,
          _id: datosAuditoria.detalles._id || docExistente.muestra._id,
          cliente: datosAuditoria.detalles.cliente || docExistente.muestra.cliente,
          tipoDeAgua: datosAuditoria.detalles.tipoDeAgua || docExistente.muestra.tipoDeAgua,
          tipoMuestreo: datosAuditoria.detalles.tipoMuestreo || datosAuditoria.detalles.cambios?.tipoMuestreo,
          lugarMuestreo: datosAuditoria.detalles.lugarMuestreo || datosAuditoria.detalles.cambios?.lugarMuestreo,
          fechaHoraMuestreo: datosAuditoria.detalles.fechaHoraMuestreo || datosAuditoria.detalles.cambios?.fechaHoraMuestreo,
          tipoAnalisis: datosAuditoria.detalles.tipoAnalisis,
          identificacionMuestra: datosAuditoria.detalles.identificacionMuestra || datosAuditoria.detalles.cambios?.identificacionMuestra,
          planMuestreo: datosAuditoria.detalles.planMuestreo || datosAuditoria.detalles.cambios?.planMuestreo,
          condicionesAmbientales: datosAuditoria.detalles.condicionesAmbientales || datosAuditoria.detalles.cambios?.condicionesAmbientales,
          preservacionMuestra: datosAuditoria.detalles.preservacionMuestra || datosAuditoria.detalles.cambios?.preservacionMuestra,
          analisisSeleccionados: datosAuditoria.detalles.analisisSeleccionados || datosAuditoria.detalles.cambios?.analisisSeleccionados,
          estado: datosAuditoria.detalles.estado || datosAuditoria.detalles.estadoFinal || docExistente.muestra.estado,
          rechazoMuestra: datosAuditoria.detalles.rechazoMuestra || docExistente.muestra.rechazoMuestra,
          observaciones: datosAuditoria.detalles.observaciones || datosAuditoria.detalles.cambios?.observaciones,
          precioTotal: datosAuditoria.detalles.precioTotal,
          historial: datosAuditoria.detalles.historial || docExistente.muestra.historial,
          creadoPor: datosAuditoria.detalles.creadoPor || docExistente.muestra.creadoPor,
          actualizadoPor: datosAuditoria.detalles.actualizadoPor || docExistente.muestra.actualizadoPor,
          firmas: datosAuditoria.detalles.firmas || docExistente.muestra.firmas,
          createdAt: datosAuditoria.detalles.createdAt || docExistente.muestra.createdAt,
          updatedAt: formatearFechaHora(new Date())
        };

        // Actualizar campos de muestra y agregar historial
        const update = {
          $set: {
            'muestra': datosMuestra,
            'accion': {
              descripcion: datosAuditoria.accion.descripcion,
              tipo: datosAuditoria.accion.tipo || 'general',
              modulo: datosAuditoria.accion.modulo || 'general',
              criticidad: datosAuditoria.accion.criticidad || 'baja'
            },
            'metadata': {
              version: datosAuditoria.detalles?.metadata?.version || '1.0',
              entorno: process.env.NODE_ENV || 'development',
              ultimaActualizacion: formatearFechaHora(new Date())
            },
            'fecha': formatearFechaHora(datosAuditoria.fecha || new Date()),
            'estado': datosAuditoria.detalles?.estado || datosAuditoria.detalles?.estadoFinal || docExistente.estado,
            'mensaje': datosAuditoria.mensaje || '',
            'duracion': datosAuditoria.duracion || 0,
            'error': datosAuditoria.error || null
          },
          $push: {
            'historial': historialNuevo
          }
        };

        console.log('Actualizando auditoría con datos:', JSON.stringify(datosMuestra, null, 2));
        const actualizado = await AuditoriaUnified.findByIdAndUpdate(docExistente._id, update, { new: true });
        return actualizado;
      } else {
        // Crear nuevo documento
        const nuevoId = `aud-${idMuestra}`;
        const docAuditoria = {
          _id: nuevoId,
          muestra: {
            ...datosAuditoria.detalles,
            id_muestra: idMuestra,
            _id: datosAuditoria.detalles._id,
            cliente: datosAuditoria.detalles.cliente,
            tipoDeAgua: datosAuditoria.detalles.tipoDeAgua,
            tipoMuestreo: datosAuditoria.detalles.tipoMuestreo || datosAuditoria.detalles.cambios?.tipoMuestreo,
            lugarMuestreo: datosAuditoria.detalles.lugarMuestreo || datosAuditoria.detalles.cambios?.lugarMuestreo,
            fechaHoraMuestreo: datosAuditoria.detalles.fechaHoraMuestreo || datosAuditoria.detalles.cambios?.fechaHoraMuestreo,
            tipoAnalisis: datosAuditoria.detalles.tipoAnalisis,
            identificacionMuestra: datosAuditoria.detalles.identificacionMuestra || datosAuditoria.detalles.cambios?.identificacionMuestra,
            planMuestreo: datosAuditoria.detalles.planMuestreo || datosAuditoria.detalles.cambios?.planMuestreo,
            condicionesAmbientales: datosAuditoria.detalles.condicionesAmbientales || datosAuditoria.detalles.cambios?.condicionesAmbientales,
            preservacionMuestra: datosAuditoria.detalles.preservacionMuestra || datosAuditoria.detalles.cambios?.preservacionMuestra,
            analisisSeleccionados: datosAuditoria.detalles.analisisSeleccionados || datosAuditoria.detalles.cambios?.analisisSeleccionados,
            estado: datosAuditoria.detalles.estado || datosAuditoria.detalles.estadoFinal || 'Recibida',
            rechazoMuestra: datosAuditoria.detalles.rechazoMuestra || { rechazada: false, motivo: null, fechaRechazo: null },
            observaciones: datosAuditoria.detalles.observaciones || datosAuditoria.detalles.cambios?.observaciones,
            precioTotal: datosAuditoria.detalles.precioTotal,
            historial: datosAuditoria.detalles.historial || [],
            creadoPor: datosAuditoria.detalles.creadoPor,
            actualizadoPor: datosAuditoria.detalles.actualizadoPor || [],
            firmas: datosAuditoria.detalles.firmas || {
              firmaAdministrador: { firma: null },
              firmaCliente: { firma: null }
            },
            createdAt: formatearFechaHora(new Date()),
            updatedAt: formatearFechaHora(new Date())
          },
          accion: {
            descripcion: datosAuditoria.accion.descripcion,
            tipo: datosAuditoria.accion.tipo || 'general',
            modulo: datosAuditoria.accion.modulo || 'general',
            criticidad: datosAuditoria.accion.criticidad || 'baja'
          },
          creadoPor: {
            id: datosAuditoria.usuario.id,
            nombre: datosAuditoria.usuario.nombre,
            rol: datosAuditoria.usuario.rol,
            documento: datosAuditoria.usuario.documento,
            ip: datosAuditoria.ip || 'No registrada',
            userAgent: datosAuditoria.userAgent || 'No registrado',
            fechaCreacion: formatearFechaHora(new Date())
          },
          metadata: {
            version: datosAuditoria.detalles?.metadata?.version || '1.0',
            entorno: process.env.NODE_ENV || 'development',
            ultimaActualizacion: formatearFechaHora(new Date())
          },
          fecha: formatearFechaHora(datosAuditoria.fecha || new Date()),
          estado: datosAuditoria.detalles?.estado || datosAuditoria.detalles?.estadoFinal || 'En análisis',
          mensaje: datosAuditoria.mensaje || '',
          duracion: datosAuditoria.duracion || 0,
          error: datosAuditoria.error || null,
          historial: [historialNuevo]
        };
        const creado = await AuditoriaUnified.create(docAuditoria);
        return creado;
      }
    } catch (error) {
      console.error('Error en registrarAccion:', error);
      throw error;
    }
  }

  // Función para obtener auditorías semanales 
  async obtenerAuditoriasSemanales(fechaInicio, fechaFin) {
    try {
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

  // Función para obtener auditorías mensuales 
  async obtenerAuditoriasMensuales(fechaInicio, fechaFin) {
    try {
      const registros = await AuditoriaUnified.find({
        fecha: {
          $gte: new Date(fechaInicio),
          $lte: new Date(fechaFin)
        }
      }).sort({ fecha: 1 }).lean();
      return registros;
    } catch (error) {
      console.error('Error obteniendo auditorías mensuales:', error);
      throw error;
    }
  }

  static async obtenerRegistros(filtros = {}, pagina = 1, limite = 10) {
    try {
      const skip = (pagina - 1) * limite;

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

      const registros = await AuditoriaUnified.find(query)
        .sort({ fecha: -1 })
        .skip(skip)
        .limit(limite)
        .lean();

      return registros;
    } catch (error) {
      console.error('Error obteniendo registros de auditoría unificada:', error);
      throw error;
    }
  }

  static async obtenerRegistroAuditoria(id) {
    try {
      const registro = await AuditoriaUnified.findOne({ _id: id }).lean();
      return registro;
    } catch (error) {
      console.error('Error obteniendo registro de auditoría unificada:', error);
      throw error;
    }
  }

  async filtrarRegistros(filtros = {}, pagina = 1, limite = 10) {
    const filtrosLimpios = Object.fromEntries(
      Object.entries(filtros).filter(([_, v]) => v !== undefined)
    );
    try {
      const skip = (pagina - 1) * limite;

      const query = {};

      if (filtrosLimpios.fechaInicio && filtrosLimpios.fechaFin) {
        query.fecha = {
          $gte: new Date(filtrosLimpios.fechaInicio),
          $lte: new Date(filtrosLimpios.fechaFin)
        };
      }

      if (filtrosLimpios.usuario) {
        query['usuario.documento'] = filtrosLimpios.usuario;
      }

      if (filtrosLimpios.accion) {
        query['accion.descripcion'] = filtrosLimpios.accion;
      }

      if (filtrosLimpios.idMuestra) {
        query['detalles.idMuestra'] = filtrosLimpios.idMuestra;
      }

      const registros = await AuditoriaUnified.find(query)
        .sort({ fecha: -1 })
        .skip(skip)
        .limit(limite)
        .lean();

      return registros;
    } catch (error) {
      console.error('Error filtrando registros de auditoría unificada:', error);
      throw error;
    }
  }

  async exportarRegistros(filtros = {}) {
    try {
      const query = this.construirQueryFiltros(filtros);
      return await AuditoriaUnified.find(query).sort({ fecha: -1 });
    } catch (error) {
      throw new Error(`Error al exportar registros: ${error.message}`);
    }
  }

  async generarExcelAuditorias(filtros = {}) {
    try {
      const registros = await this.exportarRegistros(filtros);
      const buffer = await excelService.generarExcelAuditorias(registros);
      return buffer;
    } catch (error) {
      console.error('Error generando Excel de auditorías:', error);
      throw error;
    }
  }

  // === FUNCIONES PARA DASHBOARD DE AUDITORÍA ===
  async obtenerMuestrasParaAuditoria() {
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
  }

  async obtenerParametrosParaAuditoria() {
    // Trae todos los parámetros únicos de todas las muestras
    const muestras = await Muestra.find({}, { analisisSeleccionados: 1 }).lean();
    if (!muestras || muestras.length === 0) return [];
    const set = new Set();
    muestras.forEach(m => {
      (m.analisisSeleccionados || []).forEach(a => set.add(a.nombre));
    });
    return Array.from(set).map((nombre, idx) => ({ id: nombre, nombre }));
  }

  async obtenerHistorialAuditoria() {
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
  }

  async obtenerEstadisticasAuditoria(fechaInicio, fechaFin) {
    try {
      const pipeline = [
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
            _id: {
              accion: '$accion.descripcion',
              modulo: '$accion.modulo',
              criticidad: '$accion.criticidad'
            },
            total: { $sum: 1 },
            exitosos: {
              $sum: { $cond: [{ $eq: ['$estado', 'exitoso'] }, 1, 0] }
            },
            fallidos: {
              $sum: { $cond: [{ $eq: ['$estado', 'fallido'] }, 1, 0] }
            }
          }
        }
      ];

      const estadisticas = await AuditoriaUnified.aggregate(pipeline);
      return estadisticas;
    } catch (error) {
      console.error('Error obteniendo estadísticas de auditoría:', error);
      throw error;
    }
  }

  async obtenerAlertasAuditoria() {
    try {
      const alertas = await AuditoriaUnified.find({
        'accion.criticidad': 'alta',
        fecha: {
          $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
        }
      }).sort({ fecha: -1 }).limit(10);

      return alertas;
    } catch (error) {
      console.error('Error obteniendo alertas de auditoría:', error);
      throw error;
    }
  }

  async obtenerEstadisticasAnalisisMasUsados(fechaInicio, fechaFin) {
    // 1. Obtener todos los análisis
    const todosAnalisis = await Analisis.find({}, { nombre: 1, _id: 0 }).lean();
    // 2. Buscar todas las muestras (con filtro de fecha si aplica)
    const match = {};
    if (fechaInicio && fechaFin) {
      match.fechaHoraMuestreo = {
        $gte: new Date(fechaInicio),
        $lte: new Date(fechaFin)
      };
    }
    const muestras = await Muestra.find(match, { analisisSeleccionados: 1 }).lean();
    // 3. Contar en cuántas muestras aparece cada análisis
    const conteo = {};
    muestras.forEach(muestra => {
      if (Array.isArray(muestra.analisisSeleccionados)) {
        // Usar un Set para evitar duplicados en la misma muestra
        const usados = new Set(muestra.analisisSeleccionados.map(a => a.nombre));
        usados.forEach(nombre => {
          conteo[nombre] = (conteo[nombre] || 0) + 1;
        });
      }
    });
    // 4. Unir todos los análisis con el conteo (si no está, cantidad 0)
    const resultado = todosAnalisis.map(a => ({
      _id: a.nombre,
      cantidad: conteo[a.nombre] || 0
    }));
    // Ordenar de mayor a menor
    resultado.sort((a, b) => b.cantidad - a.cantidad);
    return resultado;
  }

  async detectarPatronesAnomalos(idMuestra = null, periodo = 24) {
    try {
        // Construir query base para el período especificado (en horas)
        const query = {
            fecha: {
                $gte: new Date(Date.now() - periodo * 60 * 60 * 1000)
            }
        };

        // Si se especifica una muestra, filtrar por ella
        if (idMuestra) {
            query['detalles.idMuestra'] = idMuestra;
        }

        // Buscar patrones anómalos
        const auditorias = await AuditoriaUnified.find(query).sort({ fecha: -1 }).lean();

        const analisis = {
            erroresConsecutivos: 0,
            cambiosEstadoRapidos: [],
            accionesPorUsuario: {},
            tiemposRespuesta: [],
            criticidadAlta: 0
        };

        let ultimaAuditoria = null;

        auditorias.forEach(auditoria => {
            // Contar errores consecutivos
            if (auditoria.estado === 'fallido') {
                analisis.erroresConsecutivos++;
            } else {
                analisis.erroresConsecutivos = 0;
            }

            // Detectar cambios de estado rápidos
            if (ultimaAuditoria && 
                auditoria.detalles?.estado !== ultimaAuditoria.detalles?.estado) {
                const tiempoEntreCambios = new Date(auditoria.fecha) - new Date(ultimaAuditoria.fecha);
                if (tiempoEntreCambios < 5 * 60 * 1000) { // menos de 5 minutos
                    analisis.cambiosEstadoRapidos.push({
                        idMuestra: auditoria.detalles?.idMuestra,
                        estadoAnterior: ultimaAuditoria.detalles?.estado,
                        estadoNuevo: auditoria.detalles?.estado,
                        tiempo: tiempoEntreCambios / 1000 // en segundos
                    });
                }
            }

            // Contabilizar acciones por usuario
            const usuarioId = auditoria.usuario?.id;
            if (usuarioId) {
                if (!analisis.accionesPorUsuario[usuarioId]) {
                    analisis.accionesPorUsuario[usuarioId] = {
                        nombre: auditoria.usuario.nombre,
                        acciones: 0,
                        errores: 0
                    };
                }
                analisis.accionesPorUsuario[usuarioId].acciones++;
                if (auditoria.estado === 'fallido') {
                    analisis.accionesPorUsuario[usuarioId].errores++;
                }
            }

            // Registrar tiempo de respuesta si está disponible
            if (auditoria.duracion) {
                analisis.tiemposRespuesta.push(auditoria.duracion);
            }

            // Contar acciones de criticidad alta
            if (auditoria.accion?.criticidad === 'alta') {
                analisis.criticidadAlta++;
            }

            ultimaAuditoria = auditoria;
        });

        // Calcular métricas y detectar anomalías
        const anomalias = [];

        // 1. Muchos errores consecutivos
        if (analisis.erroresConsecutivos >= 3) {
            anomalias.push({
                tipo: 'errores_consecutivos',
                descripcion: `Se detectaron ${analisis.erroresConsecutivos} errores consecutivos`,
                nivel: 'alto'
            });
        }

        // 2. Cambios de estado muy rápidos
        if (analisis.cambiosEstadoRapidos.length > 0) {
            anomalias.push({
                tipo: 'cambios_estado_rapidos',
                descripcion: `Se detectaron ${analisis.cambiosEstadoRapidos.length} cambios de estado rápidos`,
                detalles: analisis.cambiosEstadoRapidos,
                nivel: 'medio'
            });
        }

        // 3. Usuario con alta tasa de errores
        Object.entries(analisis.accionesPorUsuario).forEach(([usuarioId, datos]) => {
            if (datos.acciones >= 5 && (datos.errores / datos.acciones) > 0.3) {
                anomalias.push({
                    tipo: 'alta_tasa_errores_usuario',
                    descripcion: `Usuario ${datos.nombre} tiene una alta tasa de errores (${Math.round(datos.errores/datos.acciones*100)}%)`,
                    nivel: 'medio'
                });
            }
        });

        // 4. Muchas acciones críticas en poco tiempo
        if (analisis.criticidadAlta > 5) {
            anomalias.push({
                tipo: 'alta_frecuencia_acciones_criticas',
                descripcion: `Se detectaron ${analisis.criticidadAlta} acciones de criticidad alta en ${periodo} horas`,
                nivel: 'alto'
            });
        }

        return {
            anomalias,
            metricas: {
                totalAcciones: auditorias.length,
                erroresConsecutivos: analisis.erroresConsecutivos,
                cambiosEstadoRapidos: analisis.cambiosEstadoRapidos.length,
                accionesCriticas: analisis.criticidadAlta,
                tiempoPromedioRespuesta: analisis.tiemposRespuesta.length > 0 
                    ? analisis.tiemposRespuesta.reduce((a, b) => a + b, 0) / analisis.tiemposRespuesta.length 
                    : 0
            }
        };
    } catch (error) {
        console.error('Error detectando patrones anómalos:', error);
        throw error;
    }
}

  async notificarAnomalias(anomalias) {
    // TODO: Implementar sistema de notificaciones
    // Por ahora solo registramos en consola
    if (anomalias.length > 0) {
        console.warn('⚠️ Se detectaron anomalías en la auditoría:');
        anomalias.forEach(anomalia => {
            console.warn(`- ${anomalia.tipo} (${anomalia.nivel}): ${anomalia.descripcion}`);
        });
    }
  }
};

module.exports = new AuditoriaService(); //final para subir

