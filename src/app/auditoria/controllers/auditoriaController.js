const auditoriaService = require("../services/auditoriaService");
const { ValidationError } = require("../../../shared/errors/AppError");

class AuditoriaController {
  async obtenerRegistroPorId(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID de auditoría es requerido',
          errorCode: 'VALIDATION_ERROR'
        });
      }

      const registro = await auditoriaService.obtenerRegistroAuditoria(id);
      return res.status(200).json({
        success: true,
        message: 'Registro de auditoría obtenido exitosamente',
        data: registro
      });
    } catch (error) {
      console.error('Error al obtener registro de auditoría:', error);
      const status = error.message.includes('no encontrado') ? 404 : 500;
      return res.status(status).json({
        success: false,
        message: error.message,
        errorCode: status === 404 ? 'NOT_FOUND' : 'SERVER_ERROR'
      });
    }
  }

  async obtenerRegistros(req, res) {
    try {
      const { fechaInicio, fechaFin, usuario, accion, idMuestra, pagina = 1, limite = 10 } = req.query;
      
      // Construir filtros
      const filtros = {
        fechaInicio,
        fechaFin,
        usuario,
        accion,
        idMuestra
      };

      const result = await auditoriaService.obtenerRegistros(filtros, pagina, limite);
      
      return res.status(200).json({
        success: true,
        message: 'Registros de auditoría obtenidos exitosamente',
        data: result.registros,
        pagination: {
          total: result.total,
          pagina: result.pagina,
          totalPaginas: result.totalPaginas
        }
      });

    } catch (error) {
      console.error('Error al obtener registros de auditoría:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
        errorCode: 'SERVER_ERROR'
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
      const registros = await auditoriaService.obtenerAuditoriasSemanales(fechaInicio, fechaFin);
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
      const registros = await auditoriaService.obtenerAuditoriasMensuales(fechaInicio, fechaFin);
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

  async obtenerDatosAuditoria(req, res) {
    try {
      const muestras = await auditoriaService.obtenerMuestrasParaAuditoria();
      const historial = await auditoriaService.obtenerHistorialAuditoria();
      res.json({
        success: true,
        data: {
          muestras,
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
      const estadisticas = await auditoriaService.obtenerEstadisticasAuditoria(fechaInicio, fechaFin);
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
      const estadisticas = await auditoriaService.obtenerEstadisticasAnalisisMasUsados(fechaInicio, fechaFin);
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
      const alertas = await auditoriaService.obtenerAlertasAuditoria();
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

  // Métodos de exportación
  async exportarRegistros(req, res) {
    try {
      const { fechaInicio, fechaFin, usuario, accion, idMuestra } = req.query;
      const filtros = { fechaInicio, fechaFin, usuario, accion, idMuestra };
      
      const result = await auditoriaService.obtenerRegistros(filtros, 1, 1000); // Obtener hasta 1000 registros
      
      res.json({
        success: true,
        data: result.registros,
        total: result.total
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async exportarExcel(req, res) {
    try {
      const { fechaInicio, fechaFin, usuario, accion, idMuestra } = req.query;
      const filtros = { fechaInicio, fechaFin, usuario, accion, idMuestra };
      
      const result = await auditoriaService.obtenerRegistros(filtros, 1, 1000);
      const excelBuffer = await auditoriaService.generarExcel(result.registros);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=auditorias_${Date.now()}.xlsx`);
      res.send(excelBuffer);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async exportarExcelVisualizar(req, res) {
    try {
      const { fechaInicio, fechaFin, usuario, accion, idMuestra } = req.query;
      const filtros = { fechaInicio, fechaFin, usuario, accion, idMuestra };
      
      const result = await auditoriaService.obtenerRegistros(filtros, 1, 1000);
      const excelBuffer = await auditoriaService.generarExcel(result.registros);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `inline; filename=auditorias_${Date.now()}.xlsx`);
      res.send(excelBuffer);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Métodos adicionales
  async detectarPatronesAnomalos(req, res) {
    try {
      const { idMuestra, periodo = 24 } = req.query;
      
      if (!idMuestra) {
        return res.status(400).json({
          success: false,
          message: 'ID de muestra es requerido'
        });
      }

      const patrones = await auditoriaService.analizarPatrones(idMuestra, periodo);
      
      res.json({
        success: true,
        data: patrones
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
      const muestras = await auditoriaService.obtenerMuestrasParaAuditoria();
      res.json({
        success: true,
        data: muestras
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async filtrarRegistros(req, res) {
    try {
      const { fechaInicio, fechaFin, usuario, accion, idMuestra, pagina = 1, limite = 10 } = req.query;
      const filtros = { fechaInicio, fechaFin, usuario, accion, idMuestra };
      
      const result = await auditoriaService.obtenerRegistros(filtros, parseInt(pagina), parseInt(limite));
      
      res.json({
        success: true,
        data: result.registros,
        pagination: {
          total: result.total,
          pagina: result.pagina,
          totalPaginas: result.totalPaginas
        }
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
      
      const registro = await auditoriaService.registrarAccion(datosAuditoria);
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

  /**
   * Obtener progreso de una muestra específica
   */
  async obtenerProgresoMuestra(req, res) {
    try {
      const { idMuestra } = req.params;
      
      if (!idMuestra) {
        return res.status(400).json({
          success: false,
          message: 'ID de muestra es requerido',
          errorCode: 'VALIDATION_ERROR'
        });
      }

      const progreso = await auditoriaService.obtenerProgresoMuestra(idMuestra);
      
      return res.status(200).json({
        success: true,
        message: 'Progreso de muestra obtenido exitosamente',
        data: progreso
      });
    } catch (error) {
      console.error('Error al obtener progreso de muestra:', error);
      const status = error.message.includes('no encontrado') ? 404 : 500;
      return res.status(status).json({
        success: false,
        message: error.message,
        errorCode: status === 404 ? 'NOT_FOUND' : 'SERVER_ERROR'
      });
    }
  }
}

module.exports = new AuditoriaController();
