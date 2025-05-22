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

  // Transformar el objeto de resultados a un array
  const resultadosArray = Object.entries(resultado.resultados || {}).map(([nombre, datos]) => ({
    nombreFormateado: nombre,
    unidad: datos.unidad,
    valor: datos.valor,
    metodo: datos.metodo,
    tipo: datos.tipo
  }));

  // Preparar el historial de cambios con la transformación de resultados
  const historialCambiosReverso = (resultado.historialCambios || []).map((cambio, idx) => {
    const cambiosResultadosArray = Object.entries(cambio.cambiosRealizados?.resultados || {}).map(([parametro, detalles]) => ({
      parametro: parametro,
      valorAnterior: detalles.valorAnterior,
      valorNuevo: detalles.valorNuevo,
      unidad: detalles.unidad
    }));

    return {
      stack: [
        { text: `CAMBIO #${idx + 1}`, style: 'historialCambioTitulo' },
        { text: `Realizado por: ${cambio.nombre || 'No disponible'} | Fecha: ${cambio.fechaFormateada || formatDate(cambio.fecha)}`, style: 'historialCambioInfo' },
        { text: `Observaciones: ${cambio.observaciones || 'Sin observaciones'}`, style: 'historialCambioInfo' },
        cambiosResultadosArray && cambiosResultadosArray.length > 0 ? {
          table: {
            widths: ['*', '*', '*', '*'],
            body: [
              [
                { text: 'Análisis', style: 'tableHeader' },
                { text: 'Valor Anterior', style: 'tableHeader' },
                { text: 'Valor Nuevo', style: 'tableHeader' },
                { text: 'Unidad', style: 'tableHeader' },
              ],
              ...cambiosResultadosArray.map(item => [
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
    };
  }).reverse(); // Invertir el orden para mostrar el historial del más reciente al más antiguo

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

  // Intentar obtener la información del verificador del último historial de cambios
  const ultimoCambioVerificacion = resultado.historialCambios?.slice(-1)[0];
  const realizadoPorNombre = ultimoCambioVerificacion?.nombre || resultado.nombreLaboratorista || 'No disponible';
  const realizadoPorFecha = ultimoCambioVerificacion?.fechaFormateada || formatDate(ultimoCambioVerificacion?.fecha) || '';
  const realizadoPorObservaciones = ultimoCambioVerificacion?.observaciones || resultado.observaciones || 'Sin observaciones';

  // Obtener el verificador del último historial de cambios
  let verificadorNombre = 'N/A';
  let verificadorCedula = 'N/A';
  if (resultado.historialCambios && resultado.historialCambios.length > 0) {
    const ultimoCambio = resultado.historialCambios[resultado.historialCambios.length - 1];
    if (ultimoCambio && ultimoCambio.nombre) verificadorNombre = ultimoCambio.nombre;
    if (ultimoCambio && ultimoCambio.cedula) verificadorCedula = ultimoCambio.cedula;
  }

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
                          ? { image: logoBase64, width: 50, alignment: 'center', margin: [5, 5, 5, 5] } // Aumento de margen vertical
                          : { text: '', alignment: 'center', margin: [5, 5, 5, 5] }, // Aumento de margen vertical
                      {
                          stack: [
                              { text: 'LABORATORIO DE ANÁLISIS AMBIENTALES', style: 'headerTitle', alignment: 'center', margin: [0, 4, 0, 0] },
                              { text: 'CENTRO DE TELEINFORMÁTICA Y PRODUCCIÓN INDUSTRIAL', style: 'headerSubtitle', alignment: 'center', margin: [0, 0, 0, 4] },
                              { text: 'INFORME DE RESULTADOS DE ENSAYOS', style: 'mainReportTitle', alignment: 'center', margin: [10, 0, 10, 0] }, // Aumento de margen vertical
                          ],
                          fillColor: '#003366',
                          color: 'white',
                          alignment: 'center',
                          margin: [5, 0, 5, 0], // Aumento de margen vertical
                          border: [false, false, false, false],
                      },
                      { text: 'Código:\nLAA-F-047-03', style: 'codigo', alignment: 'center', margin: [17, 17, 17, 17], border: [true, true, true, true] }, // Aumento de margen vertical
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
      {
        table: {
          widths: ['*'],
          body: [
            [ { text: 'INFORMACIÓN GENERAL', style: 'sectionHeader' } ]
          ]
        },
        layout: 'noBorders',
        width: '70%',
        alignment: 'center',
        margin: [0, 18, 0, 10]
      },
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
      {
        table: {
          widths: ['*'],
          body: [
            [ { text: 'INFORMACIÓN DEL CLIENTE', style: 'sectionHeader' } ]
          ]
        },
        layout: 'noBorders',
        width: '70%',
        alignment: 'center',
        margin: [0, 18, 0, 10]
      },
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
      {
        table: {
          widths: ['*'],
          body: [
            [ { text: 'INFORMACIÓN DE LA MUESTRA', style: 'sectionHeader' } ]
          ]
        },
        layout: 'noBorders',
        width: '70%',
        alignment: 'center',
        margin: [0, 18, 0, 10]
      },
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
      {
        table: {
          widths: ['*'],
          body: [
            [ { text: 'RESULTADOS DE ANÁLISIS', style: 'sectionHeader' } ]
          ]
        },
        layout: 'noBorders',
        width: '70%',
        alignment: 'center',
        margin: [0, 18, 0, 10],
        pageBreak: 'before'
      },
      { text: `Verificado por: ${realizadoPorNombre} | Fecha: ${realizadoPorFecha}`, margin: [0, 0, 0, 5], pageBreak: undefined },
      { text: `Observaciones: ${realizadoPorObservaciones}`, margin: [0, 0, 0, 8], pageBreak: undefined },
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
            ...(resultadosArray.length > 0
                ? resultadosArray.map(item => [
                    { text: item.nombreFormateado || '', style: 'tableBody' },
                    { text: item.unidad || '', style: 'tableBody' },
                    { text: item.valor || '', style: 'tableBody' },
                    { text: item.metodo || '', style: 'tableBody' },
                    { text: item.tipo || '', style: 'tableBody' },
                ])
                : [[{ text: 'No hay resultados de análisis.', colSpan: 5, style: 'italic', alignment: 'center' }, '', '', '', '']]
            ),
          ],
        },
        layout: {
          hLineWidth: function (i, node) { return (i === 0 || i === node.table.body.length) ? 1 : 0.5; },
          vLineWidth: function (i, node) { return (i === 0 || i === node.table.widths.length) ? 1 : 0.5; },
          hLineColor: function (i, node) { return (i === 0 || i === node.table.body.length) ? '#222' : '#ddd'; },
          vLineColor: function (i, node) { return (i === 0 || i === node.table.widths.length) ? '#222' : '#ddd'; },
          fillColor: function (rowIndex, node, columnIndex) { return rowIndex === 0 ? '#003366' : null; },
          fillOpacity: 0.7,
          textColor: function (rowIndex) { return rowIndex === 0 ? 'white' : 'black'; },
        },
        margin: [0, 0, 0, 20],
        pageBreak: undefined
      },
      {
        table: {
          widths: ['*'],
          body: [
            [ { text: 'OBSERVACIONES', style: 'sectionHeader' } ]
          ]
        },
        layout: 'noBorders',
        width: '70%',
        alignment: 'center',
        margin: [0, 30, 0, 10],
        pageBreak: 'before'
      },
      {
        stack: [
          {
            table: {
              widths: ['*'],
              body: [
                [ { text: 'Agradecemos el diligenciamiento de la siguiente encuesta de satisfacción: https://forms.office.com/r/ePtNQrxCMD', style: 'sectionBoxContent', link: 'https://forms.office.com/r/ePtNQrxCMD' } ]
              ]
            },
            layout: {
              fillColor: function () { return 'white'; },
              hLineColor: function () { return '#4CAF50'; },
              vLineColor: function () { return '#4CAF50'; },
              hLineWidth: function () { return 1; },
              vLineWidth: function () { return 1; }
            },
            margin: [0, 10, 0, 10]
          },
          {
            table: {
              widths: ['*'],
              body: [
                [ { text: 'DESCARGO DE RESPONSABILIDAD', style: 'sectionHeader' } ]
              ]
            },
            layout: 'noBorders',
            width: '70%',
            alignment: 'center',
            margin: [0, 30, 0, 10]
          },
          {
            table: {
              widths: ['*'],
              body: [
                [ { ul: disclaimers, style: 'sectionBoxContent' } ]
              ]
            },
            layout: {
              fillColor: function () { return 'white'; },
              hLineColor: function () { return '#4CAF50'; },
              vLineColor: function () { return '#4CAF50'; },
              hLineWidth: function () { return 1; },
              vLineWidth: function () { return 1; }
            },
            margin: [0, 10, 0, 10]
          },
          {
            table: {
              widths: ['*'],
              body: [
                [ { text: 'ACLARACIONES', style: 'sectionHeader' } ]
              ]
            },
            layout: {
              fillColor: function () { return 'white'; },
              hLineColor: function () { return '#4CAF50'; },
              vLineColor: function () { return '#4CAF50'; },
              hLineWidth: function () { return 1; },
              vLineWidth: function () { return 1; }
            },
            margin: [0, 5, 0, 5]
          },
          {
            table: {
              widths: ['*'],
              body: [
                [ { ul: clarifications, style: 'sectionBoxContent' } ]
              ]
            },
            layout: {
              fillColor: function () { return 'white'; },
              hLineColor: function () { return '#4CAF50'; },
              vLineColor: function () { return '#4CAF50'; },
              hLineWidth: function () { return 1; },
              vLineWidth: function () { return 1; }
            },
            margin: [0, 10, 0, 10]
          }
        ]
      },
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
              { text: verificadorNombre, style: 'firmaInfo' },
              { text: `Cédula: ${verificadorCedula}`, style: 'firmaInfo' },
              { text: 'ROL: Administrador', style: 'firmaInfo' },
            ],
            width: '*',
            alignment: 'center',
          },
        ],
        margin: [0, 10, 0, 0],
      },
      { text: 'FIN DEL INFORME DE ENSAYO', style: 'greenFooterTitle', alignment: 'center', margin: [0, 10, 0, 0] },
      { text: 'LABORATORIO DE ANÁLISIS AMBIENTALES (a)\nCARRERA 9 NÚMERO 71N - 60, POPAYÁN, CAUCA\nCORREO ELECTRÓNICO: LABAMBIENTALCIP@SENA.EDU.CO\nTELÉFONO / WHATSAPP: 324 6128123', style: 'contacto', alignment: 'center', margin: [0, 8] },
    ],
    styles: {
      headerTitle: { fontSize: 14, bold: true, color: 'white', alignment: 'center', margin: [0, 2, 0, 0], letterSpacing: 1 },
      headerSubtitle: { fontSize: 11, color: 'white', alignment: 'center', margin: [0, 0, 0, 2], letterSpacing: 1 },
      mainReportTitle: { fontSize: 12, bold: true, color: 'white', alignment: 'center', margin: [0, 2, 0, 2], letterSpacing: 1 },
      sectionBar: { fontSize: 11, bold: true, color: 'white', fillColor: '#4CAF50', margin: [0, 12, 0, 4], alignment: 'left', padding: [8, 4, 0, 4], textTransform: 'uppercase', letterSpacing: 1 },
      sectionTitle: { fontSize: 14, bold: true, background: '#4CAF50', color: 'white', padding: 5, margin: [0, 15, 0, 5] },
      tableHeader: { bold: true, fontSize: 8, color: 'white', alignment: 'center', textTransform: 'uppercase', letterSpacing: 1, margin: [0, 4, 0, 4] },
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
      greenSectionTitle: { fontSize: 12, bold: true, color: 'white', fillColor: '#4CAF50', alignment: 'center', margin: [0, 0, 0, 0], textTransform: 'uppercase', letterSpacing: 1, padding: [0, 6, 0, 6] },
      sectionBoxContent: { fontSize: 10, color: '#222', margin: [0, 8, 0, 8], alignment: 'left' },
      greenFooterTitle: { fontSize: 12, bold: true, color: 'white', fillColor: '#4CAF50', alignment: 'center', margin: [0, 0, 0, 0], textTransform: 'uppercase', letterSpacing: 1, padding: [0, 6, 0, 6] },
      sectionHeader: { bold: true, fontSize: 11, color: 'white', fillColor: '#4CAF50', alignment: 'center', textTransform: 'uppercase', letterSpacing: 1, margin: [0, 4, 0, 1], padding: [0, 3, 0, 3] },
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

// Helper to load logo as base64
function loadLogoAsBase64(logoPath) {
  try {
    const imageBuffer = fs.readFileSync(logoPath);
    const ext = logoPath.split('.').pop().toLowerCase();
    const mimeType = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
    return `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
  } catch (err) {
    console.error('No se pudo cargar el logo:', err);
    return null;
  }
}

module.exports = {
  generarPDF: generarPDFResultadosPdfMake,
  loadLogoAsBase64
};