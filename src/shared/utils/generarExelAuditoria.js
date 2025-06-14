const ExcelJS = require('exceljs');
const stream = require('stream');

class generarExcelAuditoria {
  async generarExcelAuditorias(registros) {
    const { Muestra } = require('../../shared/models/muestrasModel');
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
      { header: 'Identificación Muestra', key: 'identificacionMuestra', width: 20 },        // 4. Estados y acciones
      { header: 'Estado Actual', key: 'estadoActual', width: 18 },      
      // 5. Historial completo de acciones (ordenado)
      { header: 'Historial de Acciones', key: 'historialAcciones', width: 80 },
      // 6. Cambios técnicos (si aplica)
      { header: 'Resultado Final', key: 'cambiosDespues', width: 40 }    ];

    // Aplicar estilos al encabezado
    sheet.getRow(1).eachCell((cell) => {
      cell.style = headerStyle;
    });

    // Función auxiliar para formatear fechas de manera robusta
    const formatearFecha = (fecha, conHora = true) => {
      if (!fecha) return '';
      try {
        let fechaObj;
        if (typeof fecha === 'object' && fecha.timestamp) {
          console.log('Procesando timestamp:', fecha.timestamp);
          fechaObj = new Date(fecha.timestamp.$date || fecha.timestamp);
        } else if (typeof fecha === 'object' && fecha.$date) {
          console.log('Procesando $date:', fecha.$date);
          fechaObj = new Date(fecha.$date);
        } else {
          console.log('Procesando fecha directa:', fecha);
          // Manejar fechas de MongoDB que vienen como Date objects o strings ISO
          fechaObj = new Date(fecha);
        }
        
        if (isNaN(fechaObj.getTime())) {
          console.log('Fecha inválida tras conversión');
          return '';        }
          if (isNaN(fechaObj.getTime())) return '';
        
        return conHora ? 
          fechaObj.toLocaleString('es-CO', { 
            timeZone: 'America/Bogota',
            year: 'numeric', month: '2-digit', day: '2-digit', 
            hour: '2-digit', minute: '2-digit', second: '2-digit'
          }) :          fechaObj.toLocaleDateString('es-CO', { 
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
    for (let i = 0; i < registros.length; i++) {
      const reg = registros[i];
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
        `${tipoAgua.descripcion} (${tipoAgua.codigo || 'N/A'})` : '';      // Análisis seleccionados con detalles
      const analisisSeleccionados = muestra.analisisSeleccionados || [];
      const analisisInfo = analisisSeleccionados.length > 0 ?
        analisisSeleccionados.map(analisis => 
          `${analisis.nombre} - $${analisis.precio} (${analisis.unidad}) - ${analisis.metodo}`
        ).join('\n') : '';
        // 3. Información de la acción actual
      const accion = reg.accion || {};
      const accionDescripcion = accion.descripcion || '';
        // 4. Historial completo de acciones - ORDENADO cronológicamente
      const historial = reg.historial || [];
      
      // Ordenar historial por fecha (más reciente primero)
      const historialOrdenado = historial.sort((a, b) => {
        const fechaA = new Date(a.fecha?.timestamp || a.fecha || 0);
        const fechaB = new Date(b.fecha?.timestamp || b.fecha || 0);
        return fechaB - fechaA; // Orden descendente (más reciente primero)
      });      // Fecha de muestreo - buscar en muestra o usar fecha de registro
      let fechaMuestreo = 'Fecha no disponible';
      if (muestra.fechaHoraMuestreo) {
        fechaMuestreo = formatearFecha(muestra.fechaHoraMuestreo, true);
      } else if (reg.detalles?.fechaHoraMuestreo) {
        fechaMuestreo = formatearFecha(reg.detalles.fechaHoraMuestreo, true);
      } else if (muestra.fechaMuestreo) {
        fechaMuestreo = formatearFecha(muestra.fechaMuestreo, true);
      }
      
      console.log('Fecha de muestreo final:', fechaMuestreo);const historialInfo = historialOrdenado.map((item, index) => {
        // Numeración descendente: el más reciente (index 0) tiene el número más alto
        const numeroAccion = historialOrdenado.length - index;
        
        const fechaItem = formatearFecha(item.fecha);
        const usuarioItem = item.usuario ? `${item.usuario.nombre} (${item.usuario.rol})` : '';
        const accionItem = item.cambios?.accion || '';
        const estadoTransicion = item.cambios?.transicionEstado ? 
          `Estado: ${item.cambios.transicionEstado.desde || 'Inicial'} → ${item.cambios.transicionEstado.hacia}` : '';
        const observacionesItem = item.observaciones || item.cambios?.observaciones || 'Sin observaciones';
        
        // Formatear resultados si existen
        let resultadosInfo = '';
        
        // Si hay resultados anteriores (antes)
        if (item.cambios?.antes && typeof item.cambios.antes === 'object') {
          const resultadosAntes = Object.entries(item.cambios.antes)
            .map(([parametro, datos]) => {
              if (typeof datos === 'object' && datos.valor) {
                return `  ${parametro}: ${datos.valor} ${datos.unidad || ''} (${datos.metodo || 'N/A'})`;
              }
              return `  ${parametro}: ${datos}`;
            }).join('\n');
          
          if (resultadosAntes) {
            resultadosInfo += `\nValores Anteriores:\n${resultadosAntes}`;
          }
        }
        
        // Si hay resultados nuevos (despues)
        if (item.cambios?.despues && typeof item.cambios.despues === 'object') {
          const resultadosDespues = Object.entries(item.cambios.despues)
            .map(([parametro, datos]) => {
              if (typeof datos === 'object' && datos.valor) {
                return `  ${parametro}: ${datos.valor} ${datos.unidad || ''} (${datos.metodo || 'N/A'})`;
              }
              return `  ${parametro}: ${datos}`;
            }).join('\n');
          
          if (resultadosDespues) {
            const tituloResultados = item.cambios?.antes ? 'Valores Nuevos:' : 'Resultados Registrados:';
            resultadosInfo += `\n${tituloResultados}\n${resultadosDespues}`;
          }
        }
        
        return `${numeroAccion}. ${accionItem}
Fecha: ${fechaItem}
Usuario: ${usuarioItem}
${estadoTransicion}${resultadosInfo}
Observaciones: ${observacionesItem}`;
      }).join('\n\n');
      
      // 5. Usuario responsable
      const usuario = reg.creadoPor || reg.usuario || {};
        // 6. Cambios técnicos del historial más reciente con resultados
      let cambiosAntes = '';
      let cambiosDespues = '';
      if (historial.length > 0) {
        // Buscar la entrada más reciente que tenga cambios de resultados
        const ultimoCambioConResultados = historial.find(entrada => 
          entrada.cambios && (entrada.cambios.antes || entrada.cambios.despues)
        );
        
        if (ultimoCambioConResultados && ultimoCambioConResultados.cambios) {
          // Formatear valores anteriores
          if (ultimoCambioConResultados.cambios.antes) {
            if (typeof ultimoCambioConResultados.cambios.antes === 'object') {
              cambiosAntes = Object.entries(ultimoCambioConResultados.cambios.antes)
                .map(([param, datos]) => {
                  if (typeof datos === 'object' && datos.valor) {
                    return `${param}: ${datos.valor} ${datos.unidad || ''} (${datos.metodo || 'N/A'})`;
                  }
                  return `${param}: ${datos}`;
                }).join('\n');
            } else {
              cambiosAntes = ultimoCambioConResultados.cambios.antes.toString();
            }
          } else {
            cambiosAntes = 'Primer registro - Sin valores anteriores';
          }
          
          // Formatear valores nuevos
          if (ultimoCambioConResultados.cambios.despues) {
            if (typeof ultimoCambioConResultados.cambios.despues === 'object') {
              cambiosDespues = Object.entries(ultimoCambioConResultados.cambios.despues)
                .map(([param, datos]) => {
                  if (typeof datos === 'object' && datos.valor) {
                    return `${param}: ${datos.valor} ${datos.unidad || ''} (${datos.metodo || 'N/A'})`;
                  }
                  return `${param}: ${datos}`;
                }).join('\n');
            } else {
              cambiosDespues = ultimoCambioConResultados.cambios.despues.toString();
            }
          }
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
        identificacionMuestra: muestra.identificacionMuestra || '',        // 4. Estados y acciones
        estadoActual: muestra.estado || reg.estado || '',        
        // 5. Historial completo de acciones (ordenado)
        historialAcciones: historialInfo,        // 6. Cambios técnicos
        cambiosDespues: cambiosDespues
      });
    }

    // Mantener ancho fijo de columnas (no ajustar automáticamente)
    sheet.columns.forEach((column) => {
      // Solo aplicar bordes y alineación, mantener ancho original
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        cell.alignment = { vertical: 'top', wrapText: true };
      });
    });    // Aplicar formato básico a las filas sin aumentar altura automáticamente
    sheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.alignment = { vertical: 'top', wrapText: true };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      // Mantener altura fija estándar
      row.height = 20;
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
