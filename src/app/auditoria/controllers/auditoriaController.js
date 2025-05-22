const auditoriaService = require("../services/auditoriaService");
const fs = require('fs');
const path = require('path');
const GenerarExcelAuditoria = require('../../../shared/utils/generarExelAuditoria');
const generarExcelAuditoria = new GenerarExcelAuditoria();

class AuditoriaController {
  async obtenerRegistroPorId(req, res) {
    try {
      let registro = await auditoriaService.obtenerRegistroAuditoria(req.params.id);
      if (!registro) {
        return res.status(404).json({
          success: false,
          message: 'Registro de auditoría no encontrado'
        });
      }
      res.json({
        success: true,
        data: registro
      });
    } catch (error) {
      if (error.message.includes('ID de auditoría inválido')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async obtenerRegistros(req, res) {
    try {
      const {
        fechaInicio,
        fechaFin,
        usuario,
        rol,
        accion,
        estado,
        pagina = 1,
        limite = 10
      } = req.query;

      const filtros = {
        fechaInicio,
        fechaFin,
        usuario,
        rol,
        accion,
        estado
      };

      const resultado = await auditoriaService.filtrarRegistros(
        filtros,
        parseInt(pagina),
        parseInt(limite)
      );

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

  async exportarRegistros(req, res) {
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

      const registros = await auditoriaService.exportarRegistros(filtros);
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

      const registros = await auditoriaService.exportarRegistros(filtros);
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
      const registros = await auditoriaService.exportarRegistros(filtros);
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

      const resultado = await auditoriaService.filtrarRegistros(filtros);
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
      const muestras = await auditoriaService.obtenerMuestrasParaAuditoria();
      const parametros = await auditoriaService.obtenerParametrosParaAuditoria();
      const historial = await auditoriaService.obtenerHistorialAuditoria();
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

  async registrarAccion(req, res) {
    try {
      const datosAuditoria = {
        ...req.body,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      };
      
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
}

module.exports = new AuditoriaController();
