const ExcelJS = require('exceljs');
const stream = require('stream');

class generarExcelAuditoria {
  async generarExcelAuditorias(registros) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Registros de Auditoría');

    // Estilos para el encabezado
    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '003366' } },
      alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    };

    // Definir columnas con estilos mejorados y más datos relevantes
    sheet.columns = [
      { header: 'ID Registro', key: 'id', width: 15 },
      { header: 'Fecha y Hora', key: 'fecha', width: 20 },
      { header: 'Usuario', key: 'usuarioNombre', width: 25 },
      { header: 'Documento', key: 'usuarioDocumento', width: 18 },
      { header: 'IP', key: 'ip', width: 15 },
      { header: 'Módulo', key: 'modulo', width: 18 },
      { header: 'Acción', key: 'accionDescripcion', width: 25 },
      { header: 'Tipo', key: 'tipoAccion', width: 15 },
      { header: 'Criticidad', key: 'criticidad', width: 15 },
      { header: 'ID Muestra', key: 'idMuestra', width: 18 },
      { header: 'Cliente', key: 'cliente', width: 30 },
      { header: 'Tipo Análisis', key: 'tipoAnalisis', width: 22 },
      { header: 'Estado Muestra', key: 'estadoMuestra', width: 18 },
      { header: 'Estado Auditoría', key: 'estadoAuditoria', width: 15 },
      { header: 'Cambios Antes', key: 'cambiosAntes', width: 40 },
      { header: 'Cambios Después', key: 'cambiosDespues', width: 40 },
      { header: 'Mensaje', key: 'mensaje', width: 35 },
      { header: 'Duración (ms)', key: 'duracion', width: 15 }
    ];

    // Aplicar estilos al encabezado
    sheet.getRow(1).eachCell((cell) => {
      cell.style = headerStyle;
    });

    // Agregar datos con formato mejorado
    registros.forEach(reg => {
      // Formatear cliente
      let clienteFiltrado = '';
      if (reg.detalles && reg.detalles.cliente) {
        clienteFiltrado = `${reg.detalles.cliente.nombre} (${reg.detalles.cliente.documento})`;
      }
      // Formatear tipo de análisis
      let tipoAnalisis = '';
      if (reg.detalles && reg.detalles.analisisSeleccionados) {
        tipoAnalisis = reg.detalles.analisisSeleccionados.map(a => a.nombre).join(', ');
      }
      // Estado real de la muestra
      let estadoMuestra = reg.detalles?.estado || '';
      // Estado de la auditoría
      let estadoAuditoria = reg.estado || '';
      // Formatear cambios
      const formatearCambios = (cambios) => {
        if (!cambios) return '';
        if (typeof cambios === 'object') {
          return Object.entries(cambios)
            .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
            .join('\n');
        }
        return cambios;
      };
      sheet.addRow({
        id: reg._id || '',
        fecha: reg.fecha ? new Date(reg.fecha).toLocaleString() : '',
        usuarioNombre: reg.usuario?.nombre || '',
        usuarioDocumento: reg.usuario?.documento || '',
        ip: reg.usuario?.ip || '',
        modulo: reg.accion?.modulo || '',
        accionDescripcion: reg.accion?.descripcion || '',
        tipoAccion: reg.accion?.tipo || '',
        criticidad: reg.accion?.criticidad || '',
        idMuestra: reg.detalles?.idMuestra || '',
        cliente: clienteFiltrado,
        tipoAnalisis,
        estadoMuestra,
        estadoAuditoria,
        cambiosAntes: formatearCambios(reg.detalles?.cambios?.antes),
        cambiosDespues: formatearCambios(reg.detalles?.cambios?.despues),
        mensaje: reg.mensaje || '',
        duracion: reg.duracion || 0
      });
    });

    // Ajustar automáticamente el ancho de las columnas según el contenido
    sheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const cellValue = cell.value ? cell.value.toString() : '';
        maxLength = Math.max(maxLength, cellValue.length);
      });
      column.width = Math.max(column.width, Math.min(maxLength + 2, 60));
    });

    // Ajustar altura de filas automáticamente según el contenido
    sheet.eachRow((row, rowNumber) => {
      let maxLines = 1;
      row.eachCell((cell) => {
        const lines = cell.value ? cell.value.toString().split('\n').length : 1;
        maxLines = Math.max(maxLines, lines);
        cell.alignment = { vertical: 'middle', wrapText: true };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      row.height = 18 * maxLines;
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
