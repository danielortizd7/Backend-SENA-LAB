const AuditoriaUnified = require("../models/auditoriaModelUnified");
const { generarPDFAuditoria } = require('../../../shared/utils/generarPDF');
const excelService = require('../../../shared/utils/generarExelAuditoria');
const { Muestra } = require("../../../shared/models/muestrasModel");

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
      const nuevoId = await AuditoriaUnified.generarNuevoId();

      const registro = new AuditoriaUnified({
          _id: nuevoId,
          usuario: datosAuditoria.usuario,
          accion: {
            descripcion: datosAuditoria.accion.descripcion
          },
          detalles: {
              ...datosAuditoria.detalles,
              idMuestra: datosAuditoria.detalles?.idMuestra || null
          },
          fecha: datosAuditoria.fecha,
          estado: datosAuditoria.estado || 'exitoso',
          mensaje: datosAuditoria.mensaje || '',
          duracion: datosAuditoria.duracion || 0,
          error: datosAuditoria.error || null
      });

      await registro.save();
      return registro;
    } catch (error) {
      console.error('Error registrando auditoría unificada:', error);
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

  static async generarPDFRegistro(id) {
    try {
      const registro = await this.obtenerRegistroAuditoria(id);
      if (!registro) {
        throw new Error('Registro de auditoría no encontrado');
      }
      const pdfPath = await generarPDFAuditoria(registro);
      return pdfPath;
    } catch (error) {
      console.error('Error generando PDF de auditoría unificada:', error);
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
}

module.exports = new AuditoriaService();
