const Auditoria = require("../models/auditoriaModel");
const AuditoriaMuestras = require('../models/auditoriaModelMuestras');
const generarPDF = require('../../../shared/utils/generarPDFMuestras');

class AuditoriaService {
  async registrarAccion(datosAuditoria) {
    try {
      const nuevoId = await Auditoria.generarNuevoId();

      const registro = new Auditoria({
          _id: nuevoId,
          usuario: datosAuditoria.usuario,
          accion: datosAuditoria.accion,
          detalles: {
              ...datosAuditoria.detalles,
              idMuestra: datosAuditoria.detalles.idMuestra || null
          },
          fecha: datosAuditoria.fecha
      });

      await registro.save();
      return registro;
  } catch (error) {
      console.error('Error registrando auditoría:', error);
      throw error;
  }
}

async registrarAccionMuestra(datosAuditoria) {
  try {
      const nuevoId = await AuditoriaMuestras.generarNuevoId();

      const auditoriaData = {
          _id: nuevoId,
          usuario: datosAuditoria.usuario,
          accion: {
              tipo: datosAuditoria.metodo || 'POST',
              descripcion: datosAuditoria.descripcion
          },
          muestra: {
              id: datosAuditoria.idMuestra,
              tipo: datosAuditoria.tipoMuestra,
              estado: datosAuditoria.estadoMuestra,
              datosCompletos: datosAuditoria.datosCompletos
          }
      };

      return await AuditoriaMuestras.create(auditoriaData);
  } catch (error) {
      console.error('Error registrando auditoría de muestra:', error);
      return await Auditoria.create({
          ...datosAuditoria,
          tipo: 'MUESTRA_FALLBACK'
      });
  }
}

// Métodos registrarAccion y registrarAccionMuestra ya definidos en la parte anterior
static async obtenerRegistros(filtros = {}, pagina = 1, limite = 10) {
  try {
      const skip = (pagina - 1) * limite;

      const [registrosGenerales, registrosMuestras] = await Promise.all([
          Auditoria.find(filtros).sort({ fecha: -1 }).skip(skip).limit(limite).lean(),
          AuditoriaMuestras.find(filtros).sort({ createdAt: -1 }).skip(skip).limit(limite).lean()
      ]);

      const registrosCombinados = registrosGenerales.concat(registrosMuestras);
      registrosCombinados.sort((a, b) => new Date(b.fecha || b.createdAt) - new Date(a.fecha || a.createdAt));

      const registrosPaginados = registrosCombinados.slice(0, limite);

      return registrosPaginados;
  } catch (error) {
      console.error('Error obteniendo registros de auditoría:', error);
      throw error;
  }
}

static async obtenerRegistroAuditoria(id) {
  try {
      let registro = await Auditoria.findOne({ _id: id }).lean();
      if (!registro) {
          registro = await AuditoriaMuestras.findOne({ _id: id }).lean();
      }
      return registro;
  } catch (error) {
      console.error('Error obteniendo registro de auditoría:', error);
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
          query['accion.tipo'] = filtrosLimpios.accion;
      }

      if (filtrosLimpios.idMuestra) {
          query['detalles.idMuestra'] = filtrosLimpios.idMuestra;
      }

      const [registrosGenerales, registrosMuestras] = await Promise.all([
          Auditoria.find(query).sort({ fecha: -1 }).skip(skip).limit(limite).lean(),
          AuditoriaMuestras.find(query).sort({ createdAt: -1 }).skip(skip).limit(limite).lean()
      ]);

      const registrosCombinados = registrosGenerales.concat(registrosMuestras);
      registrosCombinados.sort((a, b) => new Date(b.fecha || b.createdAt) - new Date(a.fecha || a.createdAt));

      const registrosPaginados = registrosCombinados.slice(0, limite);

      return registrosPaginados;
  } catch (error) {
      console.error('Error filtrando registros de auditoría:', error);
      throw error;
  }
}

static async generarPDFRegistro(id) {
  try {
      const registro = await this.obtenerRegistroAuditoria(id);
      if (!registro) {
          throw new Error('Registro de auditoría no encontrado');
      }
      const pdfPath = await generarPDF(registro);
      return pdfPath;
  } catch (error) {
      console.error('Error generando PDF de auditoría:', error);
      throw error;
  }
}

  async exportarRegistros(filtros = {}) {
    try {
      const query = this.construirQueryFiltros(filtros);
      return await Auditoria.find(query).sort({ fecha: -1 });
    } catch (error) {
      throw new Error(`Error al exportar registros: ${error.message}`);
    }
  }

}

module.exports = new AuditoriaService(); 