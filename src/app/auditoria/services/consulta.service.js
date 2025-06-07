const AuditoriaValidator = require('../validators/auditoria.validator');

class ConsultaService {
  constructor(auditoriaModel) {
    this.auditoriaModel = auditoriaModel;
  }

  async obtenerRegistroPorId(id) {
    return await this.auditoriaModel.findById(id);
  }

  async obtenerRegistros(filtros, opciones) {
    if (opciones.pagina && opciones.limite) {
      const { pagina, limite } = AuditoriaValidator.validarPaginacion(opciones.pagina, opciones.limite);
      return await this.auditoriaModel.paginate(filtros, { page: pagina, limit: limite });
    }
    return await this.auditoriaModel.find(filtros);
  }

  async obtenerAuditoriasSemanales(fechaInicio, fechaFin) {
    AuditoriaValidator.validarFechas(fechaInicio, fechaFin);
    return await this.auditoriaModel.obtenerResumenSemanal(fechaInicio, fechaFin);
  }

  async obtenerAuditoriasMensuales(fechaInicio, fechaFin) {
    AuditoriaValidator.validarFechas(fechaInicio, fechaFin);
    return await this.auditoriaModel.obtenerResumenMensual(fechaInicio, fechaFin);
  }

  async obtenerMuestrasParaAuditoria() {
    return await this.auditoriaModel.obtenerMuestrasAuditadas();
  }

  async obtenerParametrosParaAuditoria() {
    return await this.auditoriaModel.obtenerParametrosAuditados();
  }

  async obtenerHistorialAuditoria() {
    return await this.auditoriaModel.obtenerHistorialCompleto();
  }
}

module.exports = ConsultaService;
