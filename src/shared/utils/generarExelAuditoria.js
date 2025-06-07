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
    };    // Definir columnas con flujo lógico de información de la muestra y auditoría
    sheet.columns = [
      // 1. Información básica del registro de auditoría
      { header: 'ID Auditoría', key: 'id', width: 18 },
      { header: 'Fecha y Hora', key: 'fecha', width: 20 },
      
      // 2. Información de la muestra (flujo principal)
      { header: 'ID Muestra', key: 'idMuestra', width: 18 },
      { header: 'Cliente', key: 'cliente', width: 35 },
      { header: 'Tipo de Agua', key: 'tipoAgua', width: 25 },
      { header: 'Lugar Muestreo', key: 'lugarMuestreo', width: 25 },
      { header: 'Fecha Muestreo', key: 'fechaMuestreo', width: 20 },
      { header: 'Tipo Muestreo', key: 'tipoMuestreo', width: 18 },
      { header: 'Tipo Análisis', key: 'tipoAnalisis', width: 18 },
      
      // 3. Análisis y condiciones técnicas
      { header: 'Análisis Solicitados', key: 'analisisSeleccionados', width: 45 },
      { header: 'Precio Total', key: 'precioTotal', width: 15 },
      { header: 'Condiciones Ambientales', key: 'condicionesAmbientales', width: 30 },
      { header: 'Preservación', key: 'preservacion', width: 18 },
      { header: 'Identificación Muestra', key: 'identificacionMuestra', width: 20 },
      
      // 4. Estados y acciones
      { header: 'Estado Actual', key: 'estadoActual', width: 18 },
      { header: 'Acción Realizada', key: 'accionDescripcion', width: 35 },
      { header: 'Observaciones', key: 'observaciones', width: 40 },
      
      // 5. Historial completo de acciones
      { header: 'Historial de Acciones', key: 'historialAcciones', width: 60 },
      
      // 6. Usuario responsable
      { header: 'Usuario', key: 'usuarioNombre', width: 25 },
      { header: 'Rol', key: 'usuarioRol', width: 15 },
      { header: 'Documento', key: 'usuarioDocumento', width: 18 },
      
      // 7. Cambios técnicos (si aplica)
      { header: 'Valores Anteriores', key: 'cambiosAntes', width: 35 },
      { header: 'Valores Nuevos', key: 'cambiosDespues', width: 35 },
      
      // 8. Metadata del sistema
      { header: 'Versión', key: 'version', width: 12 },
      { header: 'Entorno', key: 'entorno', width: 15 }
    ];

    // Aplicar estilos al encabezado
    sheet.getRow(1).eachCell((cell) => {
      cell.style = headerStyle;
    });    // Función auxiliar para formatear fechas de manera robusta
    const formatearFecha = (fecha, conHora = true) => {
      if (!fecha) return '';
      try {
        let fechaObj;
        if (typeof fecha === 'object' && fecha.timestamp) {
          fechaObj = new Date(fecha.timestamp.$date || fecha.timestamp);
        } else if (typeof fecha === 'object' && fecha.$date) {
          fechaObj = new Date(fecha.$date);
        } else {
          fechaObj = new Date(fecha);
        }
        
        if (isNaN(fechaObj.getTime())) return '';
        
        return conHora ? 
          fechaObj.toLocaleString('es-CO', { 
            timeZone: 'America/Bogota',
            year: 'numeric', month: '2-digit', day: '2-digit', 
            hour: '2-digit', minute: '2-digit', second: '2-digit'
          }) :
          fechaObj.toLocaleDateString('es-CO', { 
            timeZone: 'America/Bogota',
            year: 'numeric', month: '2-digit', day: '2-digit'
          });
      } catch (error) {
        return fecha.toString();
      }
    };

    // Función auxiliar para formatear cambios técnicos
    const formatearCambios = (cambios) => {
      if (!cambios) return '';
      if (typeof cambios === 'object' && cambios !== null) {
        return Object.entries(cambios)
          .map(([k, v]) => {
            if (typeof v === 'object' && v !== null) {
              const valor = v.valor || JSON.stringify(v);
              const unidad = v.unidad || '';
              const metodo = v.metodo ? ` (${v.metodo})` : '';
              return `${k}: ${valor} ${unidad}${metodo}`;
            }
            return `${k}: ${v}`;
          })
          .join('\n');
      }
      return cambios.toString();
    };

    // Agregar datos con formato completo y estructurado
    registros.forEach(reg => {
      // 1. Información básica del registro
      const fechaRegistro = formatearFecha(reg.fecha);
      
      // 2. Información de la muestra
      const muestra = reg.muestra || {};
      const idMuestra = muestra.id_muestra || reg.detalles?.idMuestra || '';
      
      // Cliente con información completa
      const cliente = muestra.cliente || {};
      const clienteInfo = cliente.nombre ? 
        `${cliente.nombre} - ${cliente.documento}\nEmail: ${cliente.email || 'N/A'}\nTel: ${cliente.telefono || 'N/A'}\nDir: ${cliente.direccion || 'N/A'}` : '';
      
      // Tipo de agua con descripción completa
      const tipoAgua = muestra.tipoDeAgua || {};
      const tipoAguaInfo = tipoAgua.descripcion ? 
        `${tipoAgua.descripcion} (${tipoAgua.codigo || 'N/A'})` : '';
      
      // Fecha de muestreo
      const fechaMuestreo = formatearFecha(muestra.fechaHoraMuestreo, false);
      
      // Análisis seleccionados con detalles
      const analisisSeleccionados = muestra.analisisSeleccionados || [];
      const analisisInfo = analisisSeleccionados.length > 0 ?
        analisisSeleccionados.map(analisis => 
          `${analisis.nombre} - $${analisis.precio} (${analisis.unidad}) - ${analisis.metodo}`
        ).join('\n') : '';
      
      // 3. Información de la acción actual
      const accion = reg.accion || {};
      const accionDescripcion = accion.descripcion || '';
      
      // Observaciones actuales
      const observaciones = muestra.observaciones || reg.mensaje || '';
      
      // 4. Historial completo de acciones
      const historial = reg.historial || [];
      const historialInfo = historial.map(item => {
        const fechaItem = formatearFecha(item.fecha);
        const usuarioItem = item.usuario ? `${item.usuario.nombre} (${item.usuario.rol})` : '';
        const accionItem = item.cambios?.accion || '';
        const obsItem = item.observaciones || '';
        const estadoTransicion = item.cambios?.transicionEstado ? 
          ` [${item.cambios.transicionEstado.desde} → ${item.cambios.transicionEstado.hacia}]` : '';
        
        return `[${fechaItem}] ${accionItem}${estadoTransicion} - ${usuarioItem} - Obs: ${obsItem}`;
      }).join(' | ');
      
      // 5. Usuario responsable
      const usuario = reg.creadoPor || reg.usuario || {};
      
      // 6. Cambios técnicos del historial más reciente
      let cambiosAntes = '';
      let cambiosDespues = '';
      if (historial.length > 0) {
        const ultimoCambio = historial[historial.length - 1];
        if (ultimoCambio.cambios) {
          cambiosAntes = formatearCambios(ultimoCambio.cambios.antes);
          cambiosDespues = formatearCambios(ultimoCambio.cambios.despues);
        }
      }
      
      // 7. Metadata
      const metadata = reg.metadata || {};

      sheet.addRow({
        // 1. Información básica del registro de auditoría
        id: reg._id || '',
        fecha: fechaRegistro,
        
        // 2. Información de la muestra (flujo principal)
        idMuestra: idMuestra,
        cliente: clienteInfo,
        tipoAgua: tipoAguaInfo,
        lugarMuestreo: muestra.lugarMuestreo || '',
        fechaMuestreo: fechaMuestreo,
        tipoMuestreo: muestra.tipoMuestreo || '',
        tipoAnalisis: muestra.tipoAnalisis || '',
        
        // 3. Análisis y condiciones técnicas
        analisisSeleccionados: analisisInfo,
        precioTotal: muestra.precioTotal ? `$${muestra.precioTotal}` : '',
        condicionesAmbientales: muestra.condicionesAmbientales || '',
        preservacion: muestra.preservacionMuestra || '',
        identificacionMuestra: muestra.identificacionMuestra || '',
        
        // 4. Estados y acciones
        estadoActual: muestra.estado || reg.estado || '',
        accionDescripcion: accionDescripcion,
        observaciones: observaciones,
        
        // 5. Historial completo de acciones
        historialAcciones: historialInfo,
        
        // 6. Usuario responsable
        usuarioNombre: usuario.nombre || '',
        usuarioRol: usuario.rol || '',
        usuarioDocumento: usuario.documento || '',
        
        // 7. Cambios técnicos
        cambiosAntes: cambiosAntes,
        cambiosDespues: cambiosDespues,
        
        // 8. Metadata del sistema
        version: metadata.version || '',
        entorno: metadata.entorno || ''
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
