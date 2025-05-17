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
      // Filtrar cliente para que solo contenga nombre y documento
      if (registro.detalles && registro.detalles.cliente) {
        registro.detalles.cliente = {
          nombre: registro.detalles.cliente.nombre,
          documento: registro.detalles.cliente.documento
        };
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

      // Filtrar cliente para que solo contenga nombre y documento
      const resultadoFiltrado = resultado.map(registro => {
        if (registro.detalles && registro.detalles.cliente) {
          registro.detalles.cliente = {
            nombre: registro.detalles.cliente.nombre,
            documento: registro.detalles.cliente.documento
          };
        }
        return registro;
      });

      res.json({
        success: true,
        data: resultadoFiltrado
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

      // Filtrar cliente para que solo contenga nombre y documento
      const registrosFiltrados = registros.map(registro => {
        if (registro.detalles && registro.detalles.cliente) {
          registro.detalles.cliente = {
            nombre: registro.detalles.cliente.nombre,
            documento: registro.detalles.cliente.documento
          };
        }
        return registro;
      });

      res.json({
        success: true,
        data: registrosFiltrados
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

      // Filtrar cliente para que solo contenga nombre y documento
      const registrosFiltrados = registros.map(registro => {
        if (registro.detalles && registro.detalles.cliente) {
          registro.detalles.cliente = {
            nombre: registro.detalles.cliente.nombre,
            documento: registro.detalles.cliente.documento
          };
        }
        return registro;
      });

      res.json({
        success: true,
        data: registrosFiltrados
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

      // Configurar headers para descarga de archivo
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=registros-auditoria.json');

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
        fechaFin
      } = req.query;

      const filtros = {
        fechaInicio,
        fechaFin
      };

      // Obtener los registros desde el servicio
      const registros = await auditoriaService.exportarRegistros(filtros);

      // Generar el Excel con los registros
      let buffer = await generarExcelAuditoria.generarExcelAuditorias(registros);
      // Enviar el archivo directamente como attachment
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
      
      // Set proper headers for inline viewing
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

      // Filtrar cliente para que solo contenga nombre y documento
      const resultadoFiltrado = resultado.map(registro => {
        if (registro.detalles && registro.detalles.cliente) {
          registro.detalles.cliente = {
            nombre: registro.detalles.cliente.nombre,
            documento: registro.detalles.cliente.documento
          };
        }
        return registro;
      });

      res.json({
        success: true,
        data: resultadoFiltrado
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Nuevo método para generar PDF de un registro de auditoría
  async generarPDFRegistro(req, res) {
    try {
      const id = req.params.id;
      const pdfPath = await auditoriaService.generarPDFRegistro(id);
      res.json({
        success: true,
        pdfUrl: pdfPath
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Nuevo endpoint para datos iniciales de auditoría
  async obtenerDatosAuditoria(req, res) {
    try {
      // Obtener todas las muestras y registros de auditoría
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
}

module.exports = new AuditoriaController();
