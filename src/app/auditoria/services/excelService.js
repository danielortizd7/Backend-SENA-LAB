const ExcelJS = require('exceljs');

class ExcelService {
  async generarExcelAuditorias(registros) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Registros de Auditoría');

    // Definir columnas basadas en campos de auditoría unificada
    sheet.columns = [
      { header: 'Usuario Nombre', key: 'usuarioNombre', width: 30 },
     // { header: 'Usuario Rol', key: 'usuarioRol', width: 20 },
      { header: 'Usuario Documento', key: 'usuarioDocumento', width: 20 },
      { header: 'Acción', key: 'accionDescripcion', width: 30 },
      { header: 'ID Muestra', key: 'idMuestra', width: 25 },
      { header: 'Cliente', key: 'cliente', width: 40 },
      { header: 'Fecha y Hora Muestreo', key: 'fechaHoraMuestreo', width: 25 },
      { header: 'Tipo de Análisis', key: 'tipoAnalisis', width: 25 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Análisis Seleccionados', key: 'analisisSeleccionados', width: 40 },
      //{ header: 'Resultados', key: 'resultados', width: 40 },
      { header: 'Cambios Antes', key: 'cambiosAntes', width: 40 },
      { header: 'Cambios Después', key: 'cambiosDespues', width: 40 },
      { header: 'Fecha Auditoría', key: 'fecha', width: 25 },
     // { header: 'Estado Auditoría', key: 'estadoAuditoria', width: 15 },
      //{ header: 'Mensaje', key: 'mensaje', width: 40 },
      //{ header: 'Duración', key: 'duracion', width: 10 },
     // { header: 'Error Código', key: 'errorCodigo', width: 20 },
      //{ header: 'Error Mensaje', key: 'errorMensaje', width: 40 },
     // { header: 'Error Stack', key: 'errorStack', width: 50 }
    ];

    registros.forEach(reg => {
      sheet.addRow({
        _id: reg._id || '',
        usuarioId: reg.usuario && reg.usuario.id ? reg.usuario.id : '',
        usuarioNombre: reg.usuario && reg.usuario.nombre ? reg.usuario.nombre : '',
        usuarioRol: reg.usuario && reg.usuario.rol ? reg.usuario.rol : '',
        usuarioDocumento: reg.usuario && reg.usuario.documento ? reg.usuario.documento : '',
        accionDescripcion: reg.accion && reg.accion.descripcion ? reg.accion.descripcion : '',
        idMuestra: reg.detalles && reg.detalles.id_muestra ? reg.detalles.id_muestra : '',
        cliente: reg.detalles && reg.detalles.cliente ? JSON.stringify(reg.detalles.cliente) : '',
        tipoDeAgua: reg.detalles && reg.detalles.tipoDeAgua ? JSON.stringify(reg.detalles.tipoDeAgua) : '',
        lugarMuestreo: reg.detalles && reg.detalles.lugarMuestreo ? reg.detalles.lugarMuestreo : '',
        fechaHoraMuestreo: reg.detalles && reg.detalles.fechaHoraMuestreo ? new Date(reg.detalles.fechaHoraMuestreo).toLocaleString() : '',
        tipoAnalisis: reg.detalles && reg.detalles.tipoAnalisis ? reg.detalles.tipoAnalisis : '',
        estado: reg.detalles && reg.detalles.estado ? reg.detalles.estado : '',
        analisisSeleccionados: reg.detalles && reg.detalles.analisisSeleccionados ? JSON.stringify(reg.detalles.analisisSeleccionados) : '',
        resultados: reg.detalles && reg.detalles.resultados ? JSON.stringify(reg.detalles.resultados) : '',
        cambiosAntes: reg.detalles && reg.detalles.cambios && reg.detalles.cambios.antes ? JSON.stringify(reg.detalles.cambios.antes) : '',
        cambiosDespues: reg.detalles && reg.detalles.cambios && reg.detalles.cambios.despues ? JSON.stringify(reg.detalles.cambios.despues) : '',
        fecha: reg.fecha ? new Date(reg.fecha).toLocaleString() : '',
        estadoAuditoria: reg.estado || '',
        mensaje: reg.mensaje || '',
        duracion: reg.duracion || 0,
        errorCodigo: reg.error && reg.error.codigo ? reg.error.codigo : '',
        errorMensaje: reg.error && reg.error.mensaje ? reg.error.mensaje : '',
        errorStack: reg.error && reg.error.stack ? reg.error.stack : ''
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}

module.exports = new ExcelService();
