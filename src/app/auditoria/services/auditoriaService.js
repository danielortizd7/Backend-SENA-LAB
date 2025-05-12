const AuditoriaUnified = require("../models/auditoriaModelUnified");
const { generarPDFAuditoria } = require('../../../shared/utils/generarPDF');

class AuditoriaService {
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
      const registros = await AuditoriaUnified.aggregate([
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
              semana: { $isoWeek: "$fecha" },
              año: { $isoWeekYear: "$fecha" },
              accion: "$accion.descripcion"
            },
            total: { $sum: 1 }
          }
        },
        {
          $sort: {
            "_id.año": 1,
            "_id.semana": 1
          }
        }
      ]);
      return registros;
    } catch (error) {
      console.error('Error obteniendo auditorías semanales:', error);
      throw error;
    }
  }

  // Función para obtener auditorías mensuales
  async obtenerAuditoriasMensuales(fechaInicio, fechaFin) {
    try {
      const registros = await AuditoriaUnified.aggregate([
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
              mes: { $month: "$fecha" },
              año: { $year: "$fecha" },
              accion: "$accion.descripcion"
            },
            total: { $sum: 1 }
          }
        },
        {
          $sort: {
            "_id.año": 1,
            "_id.mes": 1
          }
        }
      ]);
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

  static async filtrarRegistros(filtros = {}, pagina = 1, limite = 10) {
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
}

module.exports = new AuditoriaService();
