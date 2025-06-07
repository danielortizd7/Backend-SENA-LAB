const ConsultaService = require('./consulta.service');
const ExportService = require('./export.service');
const EstadisticasService = require('./estadisticas.service');
const RegistroService = require('./registro.service');

class AuditoriaService {
  constructor(auditoriaModel) {
    this.consultaService = new ConsultaService(auditoriaModel);
    this.exportService = new ExportService();
    this.estadisticasService = new EstadisticasService(auditoriaModel);
    this.registroService = new RegistroService(auditoriaModel);
  }

  // Métodos de consulta
  async obtenerRegistroPorId(id) {
    return await this.consultaService.obtenerRegistroPorId(id);
  }

  async obtenerRegistros(filtros, opciones) {
    return await this.consultaService.obtenerRegistros(filtros, opciones);
  }

  async obtenerAuditoriasSemanales(fechaInicio, fechaFin) {
    return await this.consultaService.obtenerAuditoriasSemanales(fechaInicio, fechaFin);
  }

  async obtenerAuditoriasMensuales(fechaInicio, fechaFin) {
    return await this.consultaService.obtenerAuditoriasMensuales(fechaInicio, fechaFin);
  }

  // Métodos de exportación
  async exportarRegistros(registros) {
    return await this.exportService.exportarRegistros(registros);
  }

  getHeadersDescarga() {
    return this.exportService.getHeadersDescarga();
  }

  getHeadersVisualizacion() {
    return this.exportService.getHeadersVisualizacion();
  }

  // Métodos de estadísticas
  async obtenerEstadisticasAuditoria(fechaInicio, fechaFin) {
    return await this.estadisticasService.obtenerEstadisticasAuditoria(fechaInicio, fechaFin);
  }

  async obtenerEstadisticasAnalisisMasUsados(fechaInicio, fechaFin) {
    return await this.estadisticasService.obtenerEstadisticasAnalisisMasUsados(fechaInicio, fechaFin);
  }

  async detectarPatronesAnomalos(idMuestra, periodo) {
    return await this.estadisticasService.detectarPatronesAnomalos(idMuestra, periodo);
  }

  async obtenerAlertas() {
    return await this.estadisticasService.obtenerAlertas();
  }

  // Métodos de registro
  async registrarAccion(datosAuditoria) {
    return await this.registroService.registrarAccion(datosAuditoria);
  }

  async obtenerMuestrasParaAuditoria() {
    return await this.consultaService.obtenerMuestrasParaAuditoria();
  }

  async obtenerParametrosParaAuditoria() {
    return await this.consultaService.obtenerParametrosParaAuditoria();
  }

  async obtenerHistorialAuditoria() {
    return await this.consultaService.obtenerHistorialAuditoria();
  }
}

module.exports = AuditoriaService;
