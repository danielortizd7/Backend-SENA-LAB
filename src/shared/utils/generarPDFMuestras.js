const jsreport = require('jsreport');
const path = require('path');
const fs = require('fs');

// Instancia única de jsreport y promesa de inicialización
let jsreportInstance = null;
let jsreportInitPromise = null;

const initializeJsReport = async () => {
    if (!jsreportInstance) {
        jsreportInstance = jsreport({
            extensions: {
                'chrome-pdf': {
                    launchOptions: {
                        args: ['--no-sandbox']
                    }
                }
            },
            logger: {
                file: { transport: 'file', level: 'off' },
                error: { transport: 'file', level: 'off' },
                console: { transport: 'console', level: 'off' },
                debug: { transport: 'console', level: 'off' },
                info: { transport: 'console', level: 'off' },
                warn: { transport: 'console', level: 'off' }
            },
            loadConfig: false,
            rootDirectory: process.cwd(),
            tempDirectory: path.join(process.cwd(), 'temp'),
            store: {
                provider: 'fs'
            }
        });
        jsreportInitPromise = jsreportInstance.init();
        await jsreportInitPromise;
    } else if (jsreportInitPromise) {
        await jsreportInitPromise;
    }
    return jsreportInstance;
};


// Función para formatear fechas
const formatearFecha = (fechaObj) => {
    if (fechaObj?.fecha && fechaObj?.hora) {
        return `${fechaObj.fecha} ${fechaObj.hora}`;
    }
    if (fechaObj) {
        return new Date(fechaObj).toLocaleString();
    }
    return 'N/A';
};

// Función para validar y procesar base64
const procesarBase64 = (base64String) => {
    if (!base64String) return null;
    try {
        const base64Limpio = base64String.trim().replace(/[\n\r]/g, '');
        if (base64Limpio.startsWith('data:image/')) {
            const [, contenido] = base64Limpio.split(',');
            if (!contenido || !contenido.trim()) {
                return null;
            }
            return base64Limpio;
        }
        if (!/^[A-Za-z0-9+/=]+$/.test(base64Limpio)) {
            return null;
        }
        return `data:image/png;base64,${base64Limpio}`;
    } catch (error) {
        return null;
    }
};

const generarPDF = async (muestra) => {
    try {
        const jsreport = await initializeJsReport();
        const nombreArchivo = `muestra_${muestra.id_muestra}.pdf`;
        const rutaArchivo = path.join(process.cwd(), "public", "pdfs", nombreArchivo);
        if (!fs.existsSync(path.dirname(rutaArchivo))) {
            fs.mkdirSync(path.dirname(rutaArchivo), { recursive: true });
        }
        const logoPath = path.resolve(process.cwd(), "public", "assets", "logoSena.png");
        let logoBase64 = null;
        if (fs.existsSync(logoPath)) {
            const logoBuffer = fs.readFileSync(logoPath);
            logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
        }
        const datos = {
            idMuestra: muestra.id_muestra || muestra.id_muestrea || muestra._id || 'N/A',
            documento: muestra.cliente?.documento || muestra.documento || 'N/A',
            nombreCliente: muestra.cliente?.nombre || muestra.nombreCliente || 'N/A',
            tipoAnalisis: muestra.tipoAnalisis || 'N/A',
            tipoMuestreo: muestra.tipoMuestreo || 'N/A',
            fechaHoraMuestreo: formatearFecha(muestra.fechaHoraMuestreo),
            lugarMuestreo: muestra.lugarMuestreo || 'N/A',
            identificacionMuestra: muestra.identificacionMuestra || 'N/A',
            planMuestreo: muestra.planMuestreo || 'N/A',
            condicionesAmbientales: muestra.condicionesAmbientales || 'N/A',
            preservacionMuestra: muestra.preservacionMuestra || 'N/A',
            tipoDeAgua: muestra.tipoDeAgua?.descripcionCompleta || muestra.tipoDeAgua?.tipo || 'N/A',
            observaciones: muestra.observaciones || 'N/A',
            estado: muestra.estado || 'N/A',
            analisisSeleccionados: muestra.analisisSeleccionados || [],
            precioTotal: muestra.precioTotal ? `$${muestra.precioTotal.toLocaleString('es-CO')}` : 'N/A',
            firmaAdministrador: procesarBase64(muestra.firmas?.firmaAdministrador?.firma),
            nombreAdministrador: muestra.firmas?.firmaAdministrador?.nombre || 'N/A',
            documentoAdministrador: muestra.firmas?.firmaAdministrador?.documento || 'N/A',
            firmaCliente: procesarBase64(muestra.firmas?.firmaCliente?.firma),
            nombreClienteFirma: muestra.firmas?.firmaCliente?.nombre || muestra.cliente?.nombre || 'N/A',
            documentoClienteFirma: muestra.firmas?.firmaCliente?.documento || muestra.cliente?.documento || 'N/A',
            logo: logoBase64
        };
        // Convierte a objeto plano serializable
        const datosPlanos = JSON.parse(JSON.stringify(datos));
        const response = await jsreport.render({
            template: {
                content: fs.readFileSync(path.join(__dirname, '../templates/muestras.html'), 'utf8'),
                engine: 'handlebars',
                recipe: 'chrome-pdf'
            },
            data: datosPlanos
        });
        fs.writeFileSync(rutaArchivo, response.content);
        return `/pdfs/${nombreArchivo}`;
    } catch (error) {
        throw error;
    }
};

module.exports = generarPDF;