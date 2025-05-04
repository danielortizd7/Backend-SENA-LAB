const report = require('jsreport');
const path = require('path');
const fs = require('fs');
const Handlebars = require('handlebars');

// Helper global para saltos de línea
Handlebars.registerHelper('newlineToBr', function(text) {
  if (!text) return '';
  return new Handlebars.SafeString(text.replace(/\n/g, '<br>'));
});

// Instancia única de jsreport
let jsreportInstance = null;
let jsreportInitPromise = null;

const initializeJsReport = async () => {
  if (!jsreportInstance) {
    jsreportInstance = report({
      extensions: {
        express: { enabled: false }
      },
      logger: {
        file: { transport: 'file', level: 'off' },
        error: { transport: 'file', level: 'off' },
        console: { transport: 'console', level: 'off' }
      }
    });
    jsreportInitPromise = jsreportInstance.init();
    await jsreportInitPromise;
  } else if (jsreportInitPromise) {
    await jsreportInitPromise;
  }
  return jsreportInstance;
};

// Formateo de fecha
const formatearFecha = (fechaObj) => {
  if (fechaObj?.fecha && fechaObj?.hora) {
    return `${fechaObj.fecha} ${fechaObj.hora}`;
  }
  if (fechaObj) {
    return new Date(fechaObj).toLocaleString();
  }
  return 'N/A';
};

const generarPDFResultados = async (resultado, outputPath = null) => {
  if (!resultado || typeof resultado !== 'object') {
    throw new Error('Datos de resultado inválidos');
  }

  const jsreport = await initializeJsReport();

  const templatePath = path.join(__dirname, '../templates/resultados.html');
  const templateContent = fs.readFileSync(templatePath, 'utf8');

  let aprobadorNombre = '';
  let aprobadorCedula = '';
  if (Array.isArray(resultado.historialCambios)) {
    const verificacion = resultado.historialCambios.find(
      cambio => cambio.cambiosRealizados?.verificacion?.nuevo === true
    );
    if (verificacion) {
      aprobadorNombre = verificacion.nombre || '';
      aprobadorCedula = verificacion.cedula || '';
    }
  }

  const logoBuffer = fs.readFileSync(path.join(__dirname, '../../../public/assets/logoSena.png'));
  const logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;

  const resultadosArray = resultado.resultados instanceof Map
    ? Array.from(resultado.resultados.entries()).map(([nombre, datos]) => ({
        nombre,
        nombreFormateado: { ph: 'PH', conductividad: 'CONDUCTIVIDAD' }[nombre] || nombre.toUpperCase(),
        unidad: datos.unidad || '#N/D',
        valor: datos.valor || '#N/D',
        metodo: datos.metodo || '#N/D',
        tipo: datos.tipo?.toUpperCase() || '#N/D'
      }))
    : Object.entries(resultado.resultados).map(([nombre, datos]) => ({
        nombre,
        nombreFormateado: { ph: 'PH', conductividad: 'CONDUCTIVIDAD' }[nombre] || nombre.toUpperCase(),
        unidad: datos.unidad || '#N/D',
        valor: datos.valor || '#N/D',
        metodo: datos.metodo || '#N/D',
        tipo: datos.tipo?.toUpperCase() || '#N/D'
      }));

  // Separar historial de cambios: verificación y previos
  let cambioVerificacion = null;
  let historialPrevioVerificacion = [];
  if (Array.isArray(resultado.historialCambios)) {
    const idxVerif = resultado.historialCambios.findIndex(c => c.cambiosRealizados?.verificacion?.nuevo === true);
    if (idxVerif !== -1) {
      cambioVerificacion = resultado.historialCambios[idxVerif];
      historialPrevioVerificacion = resultado.historialCambios.slice(0, idxVerif);
    } else {
      historialPrevioVerificacion = resultado.historialCambios;
    }
  }

  const historialCambiosReverso = [...(historialPrevioVerificacion || [])]
    .reverse()
    .map(cambio => ({
      ...cambio,
      fechaFormateada: cambio.fecha?.fecha && cambio.fecha?.hora
        ? `${cambio.fecha.fecha} ${cambio.fecha.hora}`
        : formatearFecha(cambio.fecha),
      cambiosResultadosArray: Object.entries(cambio.cambiosRealizados?.resultados || {}).map(
        ([parametro, datos]) => ({
          parametro,
          valorAnterior: datos.valorAnterior || '-',
          valorNuevo: datos.valorNuevo || '-',
          unidad: datos.unidad || '-'
        })
      )
    }));

  const dataParaReporte = {
    resultado: {
      ...resultado,
      fechaRecepcion: formatearFecha(resultado.createdAt),
      ultimaActualizacion: formatearFecha(resultado.updatedAt),
      fechaMuestreo: formatearFecha(resultado.fechaHoraMuestreo),
      tipoAnalisisStr: Array.isArray(resultado.tipoAnalisis)
        ? resultado.tipoAnalisis.join(', ')
        : resultado.tipoAnalisis,
      resultadosArray,
      historialCambiosReverso,
      cambioVerificacion: cambioVerificacion ? {
        ...cambioVerificacion,
        fechaFormateada: cambioVerificacion.fecha?.fecha && cambioVerificacion.fecha?.hora
          ? `${cambioVerificacion.fecha.fecha} ${cambioVerificacion.fecha.hora}`
          : formatearFecha(cambioVerificacion.fecha)
      } : null
    },
    aprobadorNombre,
    aprobadorCedula,
    logoPath: logoBase64,
    disclaimers: [
      'El laboratorio NO EMITE OPINIONES NI DECLARACIONES con el cumplimiento o no cumplimiento de los requisitos y/o especificaciones; el laboratorio no declara conformidad.',
      'El Laboratorio no es responsable por lo datos reportados cuando la información es proporcionada por el cliente...',
      'El resultado hace referencia única y exclusivamente a la muestra indicada en este informe...',
      'El laboratorio no se responsabiliza de los perjuicios que puedan derivarse del uso inadecuado de la información...'
    ],
    clarifications: [
      'El laboratorio prohíbe la reproducción parcial o total de este informe sin previa autorización.',
      'Algunos ensayos fueron realizados en las instalaciones del cliente.',
      'Cualquier solicitud de verificación debe realizarse en un periodo máximo de 5 días hábiles...',
      'El Laboratorio de Análisis Ambientales no subcontrata ensayos.'
    ]
  };

  const helpers = `
    function newlineToBr(text) {
      if (!text) return '';
      return text.replace(/\\n/g, '<br>');
    }
  `;

  const response = await jsreport.render({
    template: {
      content: templateContent,
      engine: 'handlebars',
      recipe: 'chrome-pdf',
      helpers
    },
    data: dataParaReporte
  });

  if (outputPath) {
    fs.writeFileSync(outputPath, response.content);
    return outputPath;
  }

  return response.content;
};

module.exports = generarPDFResultados;
