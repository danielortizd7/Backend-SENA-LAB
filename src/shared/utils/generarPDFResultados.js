const PdfPrinter = require('pdfmake');
const pdfFonts = require('../../../pdfmakefonts/vfs_fonts');
const fs = require('node:fs');

// Soporte para diferentes formas de exportación de vfs_fonts.js
const vfs = pdfFonts.vfs || pdfFonts;

if (!vfs['Roboto-Regular.ttf']) {
  throw new Error('No se encontró la fuente Roboto-Regular.ttf en pdfFonts. Verifica que tu archivo vfs_fonts.js contenga las fuentes necesarias.');
}

const printer = new PdfPrinter({
  Roboto: {
    normal: Buffer.from(vfs['Roboto-Regular.ttf'], 'base64'),
    bold: Buffer.from(vfs['Roboto-Medium.ttf'], 'base64'),
    italics: Buffer.from(vfs['Roboto-Italic.ttf'], 'base64'),
    bolditalics: Buffer.from(vfs['Roboto-MediumItalic.ttf'], 'base64'),
  }
});

function generarDocumentDefinition(resultado, logoBase64) {
  const formatDate = (dateObj) => {
    if (!dateObj) return 'N/A';
    if (dateObj.fecha && dateObj.hora) {
      return `${dateObj.fecha} ${dateObj.hora}`;
    }
    return new Date(dateObj).toLocaleString();
  };

  const resultadosArray = Array.isArray(resultado.resultadosArray)
    ? resultado.resultadosArray.map(item => [
        { text: item.nombreFormateado || '', style: 'tableBody' },
        { text: item.unidad || '', style: 'tableBody' },
        { text: item.valor || '', style: 'tableBody' },
        { text: item.metodo || '', style: 'tableBody' },
        { text: item.tipo || '', style: 'tableBody' },
      ])
    : [];

  const historialCambiosReverso = (resultado.historialCambiosReverso || []).map((cambio, idx) => ({
    stack: [
      { text: `CAMBIO #${idx + 1}`, style: 'historialCambioTitulo' },
      { text: `Realizado por: ${cambio.nombre || 'No disponible'} | Fecha: ${cambio.fechaFormateada || formatDate(cambio.fecha)}`, style: 'historialCambioInfo' },
      { text: `Observaciones: ${cambio.observaciones || 'Sin observaciones'}`, style: 'historialCambioInfo' },
      cambio.cambiosResultadosArray && cambio.cambiosResultadosArray.length > 0 ? {
        table: {
          widths: ['*', '*', '*', '*'],
          body: [
            [
              { text: 'Análisis', style: 'tableHeader' },
              { text: 'Valor Anterior', style: 'tableHeader' },
              { text: 'Valor Nuevo', style: 'tableHeader' },
              { text: 'Unidad', style: 'tableHeader' },
            ],
            ...cambio.cambiosResultadosArray.map(item => [
              { text: item.parametro || '', style: 'tableBody' },
              { text: item.valorAnterior || '-', style: 'tableBody' },
              { text: item.valorNuevo || '-', style: 'tableBody' },
              { text: item.unidad || '-', style: 'tableBody' },
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 5, 0, 10],
      } : null,
    ].filter(Boolean),
    margin: [0, 0, 0, 10],
  }));

  const disclaimers = (resultado.disclaimers || [
    'El laboratorio NO EMITE OPINIONES NI DECLARACIONES con el cumplimiento o no cumplimiento de los requisitos y/o especificaciones; el laboratorio no declara conformidad.',
    'El Laboratorio no es responsable por lo datos reportados cuando la información es proporcionada por el cliente...',
    'El resultado hace referencia única y exclusivamente a la muestra indicada en este informe...',
    'El laboratorio no se responsabiliza de los perjuicios que puedan derivarse del uso inadecuado de la información...'
  ]).map(disclaimer => ({ text: disclaimer, style: 'listItem' }));
  const clarifications = (resultado.clarifications || [
    'El laboratorio prohíbe la reproducción parcial o total de este informe sin previa autorización.',
    'Algunos ensayos fueron realizados en las instalaciones del cliente.',
    'Cualquier solicitud de verificación debe realizarse en un periodo máximo de 5 días hábiles...',
    'El Laboratorio de Análisis Ambientales no subcontrata ensayos.'
  ]).map(clarification => ({ text: clarification, style: 'listItem' }));

  return {
    pageSize: 'A4',
    pageMargins: [50, 50, 50, 50],
    content: [
      {
        table: {
          widths: ['20%', '60%', '20%'],
          body: [
            [
              (logoBase64 && typeof logoBase64 === 'string' && logoBase64.startsWith('data:image'))
                ? { image: logoBase64, width: 80, alignment: 'center', margin: [0, 10, 0, 10] }
                : { text: '', alignment: 'center', margin: [0, 10, 0, 10] },
              {
                stack: [
                  { text: 'LABORATORIO DE ANÁLISIS AMBIENTALES', style: 'headerTitle', alignment: 'center', margin: [0, 4, 0, 0] },
                  { text: 'CENTRO DE TELEINFORMÁTICA Y PRODUCCIÓN INDUSTRIAL', style: 'headerSubtitle', alignment: 'center', margin: [0, 0, 0, 4] },
                  { text: 'INFORME DE RESULTADOS DE ENSAYOS', style: 'mainReportTitle', alignment: 'center', margin: [0, 0, 0, 0] },
                ],
                fillColor: '#003366',
                color: 'white',
                alignment: 'center',
                margin: [0, 0, 0, 0],
                border: [false, false, false, false],
              },
              { text: 'Código:\nLAA-F-047-03', style: 'codigo', alignment: 'center', margin: [0, 10, 0, 10], border: [true, true, true, true] },
            ],
          ],
        },
        layout: {
          hLineWidth: function () { return 1; },
          vLineWidth: function () { return 1; },
          hLineColor: function () { return '#222'; },
          vLineColor: function () { return '#222'; },
        },
        margin: [0, 0, 0, 18],
      },
      { text: 'INFORMACIÓN GENERAL', style: 'sectionBar' },
      {
        table: {
          widths: ['30%', '*'],
          body: [
            [{ text: 'ID Muestra', style: 'bold' }, resultado.idMuestra || 'N/A'],
            [{ text: 'Estado', style: 'bold' }, resultado.estado || 'N/A'],
            [{ text: 'Verificado', style: 'bold' }, resultado.verificado ? 'Sí' : 'No'],
            [{ text: 'Fecha de Recepción', style: 'bold' }, formatDate(resultado.createdAt)],
            [{ text: 'Última Actualización', style: 'bold' }, formatDate(resultado.updatedAt)],
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 15],
      },
      { text: 'INFORMACIÓN DEL CLIENTE', style: 'sectionBar' },
      {
        table: {
          widths: ['30%', '*'],
          body: [
            [{ text: 'Nombre', style: 'bold' }, resultado.cliente?.nombre || 'N/A'],
            [{ text: 'Documento', style: 'bold' }, resultado.cliente?.documento || 'N/A'],
            [{ text: 'Dirección', style: 'bold' }, resultado.cliente?.direccion || 'N/A'],
            [{ text: 'Teléfono', style: 'bold' }, resultado.cliente?.telefono || 'N/A'],
            [{ text: 'Email', style: 'bold' }, resultado.cliente?.email || 'N/A'],
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 15],
      },
      { text: 'INFORMACIÓN DE LA MUESTRA', style: 'sectionBar' },
      {
        table: {
          widths: ['30%', '*'],
          body: [
            [{ text: 'Tipo de Agua', style: 'bold' }, `${resultado.tipoDeAgua?.tipo || 'N/A'} (${resultado.tipoDeAgua?.descripcion || 'N/A'})`],
            [{ text: 'Lugar de Muestreo', style: 'bold' }, resultado.lugarMuestreo || 'N/A'],
            [{ text: 'Fecha de Muestreo', style: 'bold' }, formatDate(resultado.fechaHoraMuestreo)],
            [{ text: 'Tipo de Análisis', style: 'bold' }, Array.isArray(resultado.tipoAnalisis) ? resultado.tipoAnalisis.join(', ') : resultado.tipoAnalisis || 'N/A'],
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 15],
      },
      { text: 'RESULTADOS DE ANÁLISIS', style: 'sectionBar' },
      { text: `Realizado por: ${resultado.cambioVerificacion?.nombre || 'No disponible'} | Fecha: ${resultado.cambioVerificacion?.fechaFormateada || ''}`, margin: [0, 0, 0, 5] },
      { text: `Observaciones: ${resultado.cambioVerificacion?.observaciones || 'Sin observaciones'}`, margin: [0, 0, 0, 8] },
      {
        table: {
          widths: ['*', '*', '*', '*', '*'],
          body: [
            [
              { text: 'ANÁLISIS', style: 'tableHeader' },
              { text: 'UNIDAD', style: 'tableHeader' },
              { text: 'VALOR', style: 'tableHeader' },
              { text: 'MÉTODO', style: 'tableHeader' },
              { text: 'TIPO', style: 'tableHeader' },
            ],
            ...resultadosArray,
            resultadosArray.length === 0 ? [{ text: 'No hay resultados de análisis.', colSpan: 5, style: 'italic', alignment: 'center' }] : [],
          ],
        },
        layout: {
          hLineWidth: function (i, node) { return (i === 0 || i === node.table.body.length) ? 1 : 0.5; },
          vLineWidth: function (i, node) { return (i === 0 || i === node.table.widths.length) ? 1 : 0.5; },
          hLineColor: function (i, node) { return (i === 0 || i === node.table.body.length) ? '#222' : '#ddd'; },
          vLineColor: function (i, node) { return (i === 0 || i === node.table.widths.length) ? '#222' : '#ddd'; },
          fillColor: function (rowIndex, node, columnIndex) { return rowIndex === 0 ? '#4CAF50' : null; },
          fillOpacity: 0.7,
          textColor: function (rowIndex) { return rowIndex === 0 ? 'white' : 'black'; },
        },
        margin: [0, 0, 0, 20],
      },
      ...(historialCambiosReverso.length > 0 ? [
        { text: 'HISTORIAL DE CAMBIOS', style: 'sectionBar', pageBreak: 'before' },
        ...historialCambiosReverso.flatMap(item => item.stack)
      ] : []),
      { text: 'OBSERVACIONES', style: 'observacionesTitulo', margin: [0, 30, 0, 5], pageBreak: 'before' },
      { text: 'Agradecemos el diligenciamiento de la siguiente encuesta de satisfacción: https://forms.office.com/r/ePtNQrxCMD', style: 'observacionesContenido', margin: [0, 0, 0, 15] },
      { text: 'DESCARGO DE RESPONSABILIDAD', style: 'descargoTitulo', margin: [0, 20, 0, 5] },
      { ul: disclaimers, style: 'descargoContenido', margin: [0, 0, 0, 15] },
      { text: 'ACLARACIONES', style: 'aclaracionesTitulo', margin: [0, 20, 0, 5] },
      { ul: clarifications, style: 'aclaracionesContenido', margin: [0, 0, 0, 30] },
      {
        columns: [
          {
            stack: [
              { text: 'ELABORADO POR:', style: 'firmaLabel' },
              { text: resultado.nombreLaboratorista || 'N/A', style: 'firmaInfo' },
              { text: `Cédula: ${resultado.cedulaLaboratorista || 'N/A'}`, style: 'firmaInfo' },
              { text: 'ROL: Laboratorista', style: 'firmaInfo' },
            ],
            width: '*',
            alignment: 'center',
          },
          {
            stack: [
              { text: 'APROBADO POR:', style: 'firmaLabel' },
              { text: resultado.aprobadorNombre || 'Director Técnico', style: 'firmaInfo' },
              { text: `Cédula: ${resultado.aprobadorCedula || 'N/A'}`, style: 'firmaInfo' },
              { text: 'ROL: Administrador', style: 'firmaInfo' },
            ],
            width: '*',
            alignment: 'center',
          },
        ],
        margin: [0, 40, 0, 0],
      },
      { text: 'FIN DEL INFORME DE ENSAYO', style: 'footerTitulo', alignment: 'center', margin: [0, 40, 0, 10] },
      { text: 'LABORATORIO DE ANÁLISIS AMBIENTALES (a)\nCARRERA 9 NÚMERO 71N - 60, POPAYÁN, CAUCA\nCORREO ELECTRÓNICO: LABAMBIENTALCIP@SENA.EDU.CO\nTELÉFONO / WHATSAPP: 324 6128123', style: 'contacto', alignment: 'center', margin: [0, 10] },
    ],
    styles: {
      headerTitle: { fontSize: 14, bold: true, color: 'white', alignment: 'center', margin: [0, 2, 0, 0], letterSpacing: 1 },
      headerSubtitle: { fontSize: 11, color: 'white', alignment: 'center', margin: [0, 0, 0, 2], letterSpacing: 1 },
      mainReportTitle: { fontSize: 12, bold: true, color: 'white', alignment: 'center', margin: [0, 2, 0, 2], letterSpacing: 1 },
      sectionBar: { fontSize: 11, bold: true, color: 'white', fillColor: '#4CAF50', margin: [0, 12, 0, 4], alignment: 'left', padding: [8, 4, 0, 4], textTransform: 'uppercase', letterSpacing: 1 },
      sectionTitle: { fontSize: 14, bold: true, background: '#4CAF50', color: 'white', padding: 5, margin: [0, 15, 0, 5] },
      tableHeader: { bold: true, fontSize: 9, color: 'white', fillColor: '#4CAF50', alignment: 'center', textTransform: 'uppercase', letterSpacing: 1, margin: [0, 4, 0, 4] },
      tableBody: { fontSize: 8, color: '#222', margin: [0, 2, 0, 2] },
      bold: { bold: true },
      italic: { italics: true },
      historialCambioTitulo: { fontSize: 10, bold: true, margin: [0, 7, 0, 2], textTransform: 'uppercase' },
      historialCambioInfo: { fontSize: 8, margin: [0, 0, 0, 2] },
      firmaLabel: { fontSize: 9, bold: true, margin: [0, 12, 0, 2], alignment: 'center', textTransform: 'uppercase' },
      firmaInfo: { fontSize: 8, alignment: 'center' },
      footerTitulo: { fontSize: 11, bold: true, fillColor: '#4CAF50', color: 'white', padding: 12, alignment: 'center', margin: [0, 16, 0, 16], textTransform: 'uppercase', letterSpacing: 1 },
      contacto: { fontSize: 8, alignment: 'center', color: '#222', textTransform: 'uppercase' },
      observacionesTitulo: { fontSize: 10, bold: true, fillColor: '#4CAF50', color: 'white', padding: 10, alignment: 'left', margin: [0, 12, 0, 4], textTransform: 'uppercase', letterSpacing: 1 },
      observacionesContenido: { fontSize: 9, color: '#222', border: [true, true, true, true], borderColor: '#4CAF50', borderWidth: 1, padding: [12, 18], marginBottom: 18, alignment: 'justify' },
      descargoTitulo: { fontSize: 10, bold: true, fillColor: '#4CAF50', color: 'white', padding: 10, alignment: 'left', margin: [0, 12, 0, 4], textTransform: 'uppercase', letterSpacing: 1 },
      descargoContenido: { fontSize: 9, color: '#222', border: [true, true, true, true], borderColor: '#4CAF50', borderWidth: 1, padding: [12, 18], marginBottom: 18 },
      aclaracionesTitulo: { fontSize: 10, bold: true, fillColor: '#4CAF50', color: 'white', padding: 10, alignment: 'left', margin: [0, 12, 0, 4], textTransform: 'uppercase', letterSpacing: 1 },
      aclaracionesContenido: { fontSize: 9, color: '#222', border: [true, true, true, true], borderColor: '#4CAF50', borderWidth: 1, padding: [12, 18], marginBottom: 18 },
      listItem: { fontSize: 9, margin: [0, 0, 0, 6] },
      codigo: { fontSize: 8, alignment: 'center', color: '#003366', bold: true },
    },
    defaultStyle: {
      fontSize: 10,
      font: 'Roboto',
    },
  };
}

const generarPDFResultadosPdfMake = async (resultado, logoBase64) => {
  try {
    const documentDefinition = generarDocumentDefinition(resultado, logoBase64);
    const pdfDoc = printer.createPdfKitDocument(documentDefinition);
    const chunks = [];
    pdfDoc.on('data', (chunk) => {
      chunks.push(chunk);
    });
    return new Promise((resolve, reject) => {
      pdfDoc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });
      pdfDoc.on('error', reject);
      pdfDoc.end();
    });
  } catch (error) {
    console.error('Error al generar PDF con pdfmake:', error);
    throw error;
  }
};

// Validación extra para prevenir errores en tablas
function safeTableCell(cell) {
  if (cell === undefined || cell === null) return { text: '' };
  if (typeof cell === 'string') return { text: cell };
  if (typeof cell === 'object' && !Array.isArray(cell)) return cell;
  return { text: String(cell) };
}

module.exports = {
  generarPDF: generarPDFResultadosPdfMake
};