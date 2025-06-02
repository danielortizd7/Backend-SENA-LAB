const AuditoriaService = require("../services/auditoriaService");
const { ResponseHandler } = require("../../../shared/utils/responseHandler");
const { ValidationError } = require("../../../shared/errors/AppError");
const { formatPaginationResponse } = require("../../../shared/middleware/paginationMiddleware");
const fs = require('fs');
const path = require('path');
const GenerarExcelAuditoria = require('../../../shared/utils/generarExelAuditoria');
const generarExcelAuditoria = new GenerarExcelAuditoria();

class AuditoriaController {
  async obtenerRegistroPorId(req, res) {
    try {
      const { id } = req.params;
      
      const registro = await AuditoriaService.obtenerRegistroPorId(id);
      
      if (!registro) {
        return res.status(404).json({
          success: false,
          message: 'Registro de auditoría no encontrado',
          errorCode: 'NOT_FOUND'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Registro de auditoría obtenido exitosamente',
        data: registro
      });

    } catch (error) {
      console.error('Error al obtener registro de auditoría:', error);
      return res.status(error instanceof ValidationError ? 400 : 500).json({
        success: false,
        message: error.message,
        errorCode: error instanceof ValidationError ? 'VALIDATION_ERROR' : 'SERVER_ERROR'
      });
    }
  }

  async obtenerRegistros(req, res) {
    try {
      const { fechaInicio, fechaFin, usuario, rol, accion, estado, pagina = 1, limite = 10 } = req.query;
      
      // Construir filtros
      const filtros = {};
      if (fechaInicio && fechaFin) {
        filtros.fecha = {
          $gte: new Date(fechaInicio),
          $lte: new Date(fechaFin)
        };
      }
      if (usuario) filtros['creadoPor.nombre'] = new RegExp(usuario, 'i');
      if (rol) filtros['creadoPor.rol'] = rol;
      if (accion) filtros['accion.tipo'] = accion;
      if (estado) filtros.estado = estado;

      // Obtener registros con paginación
      const registros = await AuditoriaService.obtenerRegistros(filtros, {
        pagina: parseInt(pagina),
        limite: parseInt(limite)
      });

      // Formatear respuesta
      const respuesta = formatPaginationResponse(registros, pagina, limite);
      
      return res.status(200).json({
        success: true,
        message: 'Registros de auditoría obtenidos exitosamente',
        data: respuesta
      });

    } catch (error) {
      console.error('Error al obtener registros de auditoría:', error);
      return res.status(error instanceof ValidationError ? 400 : 500).json({
        success: false,
        message: error.message,
        errorCode: error instanceof ValidationError ? 'VALIDATION_ERROR' : 'SERVER_ERROR'
      });
    }
  }

  async obtenerAuditoriasSemanales(req, res) {
    try {
      const { fechaInicio, fechaFin } = req.query;
      if (!fechaInicio || !fechaFin) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren fechaInicio y fechaFin para la consulta'
        });
      }
      const registros = await AuditoriaService.obtenerAuditoriasSemanales(fechaInicio, fechaFin);
      res.json({
        success: true,
        data: registros
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async obtenerAuditoriasMensuales(req, res) {
    try {
      const { fechaInicio, fechaFin } = req.query;
      if (!fechaInicio || !fechaFin) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren fechaInicio y fechaFin para la consulta'
        });
      }
      const registros = await AuditoriaService.obtenerAuditoriasMensuales(fechaInicio, fechaFin);
      res.json({
        success: true,
        data: registros
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async exportarRegistros(req, res) {
    try {
      const { fechaInicio, fechaFin, usuario, rol, accion, estado } = req.query;
      
      // Construir filtros
      const filtros = {};
      if (fechaInicio && fechaFin) {
        filtros.fecha = {
          $gte: new Date(fechaInicio),
          $lte: new Date(fechaFin)
        };
      }
      if (usuario) filtros['creadoPor.nombre'] = new RegExp(usuario, 'i');
      if (rol) filtros['creadoPor.rol'] = rol;
      if (accion) filtros['accion.tipo'] = accion;
      if (estado) filtros.estado = estado;

      // Obtener registros sin paginación para exportación
      const registros = await AuditoriaService.obtenerRegistros(filtros, { sinPaginacion: true });
      
      // Generar archivo Excel
      const buffer = await AuditoriaService.exportarRegistros(registros);
      
      // Configurar headers para descarga
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=auditoria.xlsx');
      
      return res.send(buffer);

    } catch (error) {
      console.error('Error al exportar registros de auditoría:', error);
      return res.status(error instanceof ValidationError ? 400 : 500).json({
        success: false,
        message: error.message,
        errorCode: error instanceof ValidationError ? 'VALIDATION_ERROR' : 'SERVER_ERROR'
      });
    }
  }

  async exportarExcel(req, res) {
    try {
      const {
        fechaInicio,
        fechaFin,
        usuario,
        rol,
        accion,
        estado
      } = req.query;

      const filtros = {
        fechaInicio,
        fechaFin,
        usuario,
        rol,
        accion,
        estado
      };

      const registros = await AuditoriaService.exportarRegistros(filtros);
      let buffer = await generarExcelAuditoria.generarExcelAuditorias(registros);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="auditorias.xlsx"');
      res.send(buffer);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async exportarExcelVisualizar(req, res) {
    try {
      const { fechaInicio, fechaFin } = req.query;
      const filtros = { fechaInicio, fechaFin };
      const registros = await AuditoriaService.exportarRegistros(filtros);
      let buffer = await generarExcelAuditoria.generarExcelAuditorias(registros);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'inline; filename="auditorias.xlsx"');
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Pragma', 'no-cache');
      
      res.send(buffer);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async filtrarRegistros(req, res) {
    try {
      const {
        fechaInicio,
        fechaFin,
        usuario,
        rol,
        accion,
        estado,
        idMuestra
      } = req.query;

      const filtros = {
        fechaInicio,
        fechaFin,
        usuario,
        rol,
        accion,
        estado,
        idMuestra
      };

      const resultado = await AuditoriaService.filtrarRegistros(filtros);
      res.json({
        success: true,
        data: resultado
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async obtenerDatosAuditoria(req, res) {
    try {
      const muestras = await AuditoriaService.obtenerMuestrasParaAuditoria();
      const parametros = await AuditoriaService.obtenerParametrosParaAuditoria();
      const historial = await AuditoriaService.obtenerHistorialAuditoria();
      res.json({
        success: true,
        data: {
          muestras,
          parametros,
          historial
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async obtenerEstadisticas(req, res) {
    try {
      const { fechaInicio, fechaFin } = req.query;
      if (!fechaInicio || !fechaFin) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren fechaInicio y fechaFin para la consulta'
        });
      }
      const estadisticas = await AuditoriaService.obtenerEstadisticasAuditoria(fechaInicio, fechaFin);
      res.json({
        success: true,
        data: estadisticas
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async obtenerEstadisticasAnalisis(req, res) {
    try {
      const { fechaInicio, fechaFin } = req.query;
      const estadisticas = await AuditoriaService.obtenerEstadisticasAnalisisMasUsados(fechaInicio, fechaFin);
      res.json({
        success: true,
        data: estadisticas
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async obtenerAlertas(req, res) {
    try {
      const alertas = await AuditoriaService.obtenerAlertasAuditoria();
      res.json({
        success: true,
        data: alertas
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async registrarAccion(req, res) {
    try {
      const datosAuditoria = {
        ...req.body,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      };

      // Si es una acción de registro de muestra, ajustamos la estructura
      if (datosAuditoria.accion?.descripcion === 'registro nueva muestra' && datosAuditoria.detalles) {
        // Aseguramos que los precios tengan el formato correcto
        if (datosAuditoria.detalles.analisisSeleccionados) {
          datosAuditoria.detalles.analisisSeleccionados = datosAuditoria.detalles.analisisSeleccionados.map(analisis => ({
            ...analisis,
            precio: typeof analisis.precio === 'string' ? analisis.precio : `$ ${analisis.precio.toLocaleString()}`
          }));
        }

        // Aseguramos que las fechas tengan el formato correcto
        if (datosAuditoria.detalles.fechaHoraMuestreo) {
          const fecha = new Date(datosAuditoria.detalles.fechaHoraMuestreo);
          datosAuditoria.detalles.fechaHoraMuestreo = {
            fecha: fecha.toLocaleDateString('es-ES'),
            hora: fecha.toLocaleTimeString('es-ES'),
            timestamp: fecha.toISOString()
          };
        }

        // Aseguramos que el precio total tenga el formato correcto
        if (datosAuditoria.detalles.precioTotal) {
          datosAuditoria.detalles.precioTotal = typeof datosAuditoria.detalles.precioTotal === 'string' 
            ? datosAuditoria.detalles.precioTotal 
            : `$ ${datosAuditoria.detalles.precioTotal.toLocaleString()}`;
        }
      }
      
      const registro = await AuditoriaService.registrarAccion(datosAuditoria);
      res.json({
        success: true,
        data: registro
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async obtenerMuestrasParaAuditoria(req, res) {
    try {
      const muestras = await AuditoriaService.obtenerMuestrasParaAuditoria();
      
      return res.status(200).json({
        success: true,
        message: 'Muestras obtenidas exitosamente',
        data: muestras
      });

    } catch (error) {
      console.error('Error al obtener muestras para auditoría:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
        errorCode: 'SERVER_ERROR'
      });
    }
  }

  async detectarPatronesAnomalos(req, res) {
    try {
      const { idMuestra, periodo } = req.query;
      
      const patrones = await AuditoriaService.detectarPatronesAnomalos(
        idMuestra,
        periodo ? parseInt(periodo) : 24
      );
      
      return res.status(200).json({
        success: true,
        message: 'Patrones anómalos detectados exitosamente',
        data: patrones
      });

    } catch (error) {
      console.error('Error al detectar patrones anómalos:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
        errorCode: 'SERVER_ERROR'
      });
    }
  }
}

module.exports = new AuditoriaController();
