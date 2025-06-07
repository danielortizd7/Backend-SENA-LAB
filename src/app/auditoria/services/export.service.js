const GenerarExcelAuditoria = require('../utils/excel.generator');

class ExportService {
  constructor() {
    this.excelGenerator = new GenerarExcelAuditoria();
  }

  async exportarRegistros(registros) {
    return await this.excelGenerator.generarExcelAuditorias(registros);
  }

  async exportarVisualizacion(registros) {
    return await this.excelGenerator.generarExcelAuditorias(registros);
  }

  getHeadersDescarga() {
    return {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="auditorias.xlsx"'
    };
  }

  getHeadersVisualizacion() {
    return {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'inline; filename="auditorias.xlsx"',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };
  }
}

module.exports = ExportService;
