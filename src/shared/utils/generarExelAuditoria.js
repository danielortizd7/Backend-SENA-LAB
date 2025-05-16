const ExcelJS = require('exceljs');
const stream = require('stream');

class generarExcelAuditoria {
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
    ];

    registros.forEach(reg => {
      // Filtrar cliente para que solo contenga nombre y documento
      let clienteFiltrado = '';
      if (reg.detalles && reg.detalles.cliente) {
        clienteFiltrado = JSON.stringify({
          nombre: reg.detalles.cliente.nombre,
          documento: reg.detalles.cliente.documento
        });
      }
      sheet.addRow({
        _id: reg._id || '',
        usuarioNombre: reg.usuario && reg.usuario.nombre ? reg.usuario.nombre : '',
      //  usuarioRol: reg.usuario && reg.usuario.rol ? reg.usuario.rol : '',
        usuarioDocumento: reg.usuario && reg.usuario.documento ? reg.usuario.documento : '',
        accionDescripcion: reg.accion && reg.accion.descripcion ? reg.accion.descripcion : '',
        idMuestra: reg.detalles && reg.detalles.id_muestra ? reg.detalles.id_muestra : '',
        cliente: clienteFiltrado,
        fechaHoraMuestreo: reg.detalles && reg.detalles.fechaHoraMuestreo ? new Date(reg.detalles.fechaHoraMuestreo).toLocaleString() : '',
        tipoAnalisis: reg.detalles && reg.detalles.tipoAnalisis ? reg.detalles.tipoAnalisis : '',
        estado: reg.detalles && reg.detalles.estado ? reg.detalles.estado : '',
        analisisSeleccionados: reg.detalles && reg.detalles.analisisSeleccionados ? reg.detalles.analisisSeleccionados.map(a => a.nombre).join(', ') : '',
       // resultados: reg.detalles && reg.detalles.resultados ? JSON.stringify(reg.detalles.resultados) : '',
        cambiosAntes: reg.detalles && reg.detalles.cambios && reg.detalles.cambios.antes ? 
          (typeof reg.detalles.cambios.antes === 'object' ? Object.entries(reg.detalles.cambios.antes).map(([k, v]) => `${k}: ${v.valor}`).join(', ') : reg.detalles.cambios.antes) 
          : '',
        cambiosDespues: reg.detalles && reg.detalles.cambios && reg.detalles.cambios.despues ? 
          (typeof reg.detalles.cambios.despues === 'object' ? Object.entries(reg.detalles.cambios.despues).map(([k, v]) => `${k}: ${v.valor}`).join(', ') : reg.detalles.cambios.despues) 
          : '',
        fecha: reg.fecha ? new Date(reg.fecha).toLocaleString() : ''
      });
    });

    // Usar stream para obtener un Buffer válido
    const bufferStream = new stream.PassThrough();
    await workbook.xlsx.write(bufferStream);
    const chunks = [];
    for await (const chunk of bufferStream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
}

module.exports = generarExcelAuditoria;
