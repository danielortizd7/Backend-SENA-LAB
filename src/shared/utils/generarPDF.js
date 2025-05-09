const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

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
        // Limpiar espacios y saltos de línea
        const base64Limpio = base64String.trim().replace(/[\n\r]/g, '');
        
        // Si ya tiene el prefijo data:image, extraer solo el contenido
        if (base64Limpio.startsWith('data:image/')) {
            const [, contenido] = base64Limpio.split(',');
            if (!contenido || !contenido.trim()) {
                console.error('Base64 inválido: contenido vacío');
                return null;
            }
            return Buffer.from(contenido, 'base64');
        }
        
        // Si es contenido base64 directo, verificar que sea válido
        if (!/^[A-Za-z0-9+/=]+$/.test(base64Limpio)) {
            console.error('Base64 inválido: caracteres no permitidos');
            return null;
        }
        
        return Buffer.from(base64Limpio, 'base64');
    } catch (error) {
        console.error('Error al procesar base64:', error);
        return null;
    }
};

const generarPDF = async (muestra) => {
    return new Promise((resolve, reject) => {
        try {
            console.log("Iniciando generación de PDF para:", muestra.id_muestra);
            
            const doc = new PDFDocument({ 
                size: 'A4',
                margin: 50,
                info: {
                    Title: `Reporte de Muestra ${muestra.id_muestra}`,
                    Author: 'Sistema SENA',
                    Subject: 'Reporte de Muestra de Análisis',
                }
            });

            const nombreArchivo = `muestra_${muestra.id_muestra}.pdf`;
            const rutaArchivo = path.join(process.cwd(), "public", "pdfs", nombreArchivo);

            // Crear directorio si no existe
            if (!fs.existsSync(path.dirname(rutaArchivo))) {
                fs.mkdirSync(path.dirname(rutaArchivo), { recursive: true });
            }

            const stream = fs.createWriteStream(rutaArchivo);
            doc.pipe(stream);

            // Logo SENA - Ahora en el lado derecho
            const logoPath = path.resolve(process.cwd(), "public", "assets", "logoSena.png");
            console.log("Intentando cargar logo desde:", logoPath);
            console.log("¿El archivo existe?", fs.existsSync(logoPath));

            try {
                if (fs.existsSync(logoPath)) {
                    const logoStats = fs.statSync(logoPath);
                    console.log("Tamaño del archivo logo:", logoStats.size, "bytes");
                    
                    if (logoStats.size > 0) {
                        doc.image(logoPath, doc.page.width - 130, 20, { 
                            width: 80,
                            align: 'right'
                        });
                        console.log("Logo cargado exitosamente");
                    } else {
                        console.error("El archivo del logo está vacío");
                    }
                } else {
                    console.error("No se encontró el archivo del logo en:", logoPath);
                    // Intentar con ruta alternativa
                    const rutaAlternativa = path.join(__dirname, "..", "..", "public", "assets", "logoSena.png");
                    console.log("Intentando ruta alternativa:", rutaAlternativa);
                    if (fs.existsSync(rutaAlternativa)) {
                        doc.image(rutaAlternativa, doc.page.width - 130, 20, { 
                            width: 80,
                            align: 'right'
                        });
                        console.log("Logo cargado exitosamente desde ruta alternativa");
                    }
                }
            } catch (error) {
                console.error("Error al cargar el logo:", error);
            }

            // Título con fondo azul marino
            doc.rect(0, 80, doc.page.width, 25).fill('#002D4D');
            doc.fillColor('white').fontSize(14).text('Detalles de la Muestra', 0, 85, { align: 'center' });

            // Tabla de datos
            const startY = 120;
            const colWidth = (doc.page.width - 100) / 2;
            
            // Encabezados de la tabla
            doc.rect(50, startY, colWidth, 20).fill('#39A900');
            doc.rect(50 + colWidth, startY, colWidth, 20).fill('#39A900');
            doc.fillColor('white')
               .fontSize(10)
               .text('Campo', 60, startY + 5)
               .text('Valor', 60 + colWidth, startY + 5);

            // Datos de la tabla
            let currentY = startY + 20;
            const rowHeight = 20;
            const detalles = [
                ['ID Muestra', muestra.id_muestra || muestra.id_muestrea || muestra._id || 'N/A'],
                ['Documento', muestra.cliente?.documento || muestra.documento || 'N/A'],
                ['Nombre del Cliente', muestra.cliente?.nombre || muestra.nombreCliente || 'N/A'],
                ['Tipo de Análisis', muestra.tipoAnalisis || 'N/A'],
                ['Tipo de Muestreo', muestra.tipoMuestreo || 'N/A'],
                ['Fecha y Hora de Muestreo', formatearFecha(muestra.fechaHoraMuestreo)],
                ['Lugar de Muestreo', muestra.lugarMuestreo || 'N/A'],
                ['Identificación de Muestra', muestra.identificacionMuestra || 'N/A'],
                ['Plan de Muestreo', muestra.planMuestreo || 'N/A'],
                ['Condiciones Ambientales', muestra.condicionesAmbientales || 'N/A'],
                ['Preservación de Muestra', muestra.preservacionMuestra || 'N/A'],
                ['Tipo de Agua', muestra.tipoDeAgua?.descripcionCompleta || muestra.tipoDeAgua?.tipo || 'N/A']
            ];

            // Agregar análisis seleccionados con sus precios
            if (Array.isArray(muestra.analisisSeleccionados) && muestra.analisisSeleccionados.length > 0) {
                detalles.push(['Análisis Seleccionados:', '']);
                muestra.analisisSeleccionados.forEach(analisis => {
                    detalles.push([
                        `   ${analisis.nombre} (${analisis.unidad})`,
                        `$${analisis.precio.toLocaleString('es-CO')}`
                    ]);
                });
                // Agregar precio total
                detalles.push(['Precio Total', `$${muestra.precioTotal.toLocaleString('es-CO')}`]);
            } else {
                detalles.push(['Análisis Seleccionados', 'Ninguno']);
            }

            detalles.push(
                ['Observaciones', muestra.observaciones || 'N/A'],
                ['Estado', muestra.estado || 'N/A']
            );

            if (muestra.historial?.length > 0) {
                const ultimoCambio = muestra.historial[muestra.historial.length - 1];
                detalles.push(
                    ['Último cambio por', ultimoCambio.administrador?.nombre || 'N/A'],
                    ['Fecha de cambio', formatearFecha(ultimoCambio.fechaCambio)],
                    ['Observaciones Hist.', ultimoCambio.observaciones || 'N/A']
                );
            }

            detalles.forEach((row, index) => {
                const y = currentY + (index * rowHeight);
                // Fondo de la fila
                doc.rect(50, y, colWidth * 2, rowHeight)
                   .fillAndStroke(index % 2 === 0 ? '#f9f9f9' : 'white', '#e0e0e0');
                // Texto
                doc.fillColor('black')
                   .fontSize(9)
                   .text(row[0], 60, y + 5)
                   .text(row[1], 60 + colWidth, y + 5);
            });

            // Calcular la posición Y final de la tabla
            const finalTableY = currentY + (detalles.length * rowHeight);

            // Agregar espacio después de la tabla
            currentY = finalTableY + 50;  // Espacio después de la tabla

            // Sección de firmas
            doc.fontSize(12).text('Firmas', 50, currentY, { align: 'left' });

            const signatureY = currentY + 20;  // Reducido de 30 a 20
            const signatureWidth = (doc.page.width - 150) / 2;

            // Firma del Administrador
            const firmaAdmin = muestra.firmas?.firmaAdministrador?.firma;
            const nombreAdmin = muestra.firmas?.firmaAdministrador?.nombre || 'N/A';
            const documentoAdmin = muestra.firmas?.firmaAdministrador?.documento || 'N/A';
            const firmaAdminBuffer = procesarBase64(firmaAdmin);

            if (firmaAdminBuffer) {
                doc.image(firmaAdminBuffer, 50, signatureY, {
                    fit: [signatureWidth, 50],
                    align: 'center'
                });
            }
            doc.fontSize(10)
               .text('Administrador', 50, signatureY + 55, { width: signatureWidth, align: 'center' })
               .text(nombreAdmin, 50, signatureY + 70, { width: signatureWidth, align: 'center' })
               .text(documentoAdmin, 50, signatureY + 85, { width: signatureWidth, align: 'center' });

            // Firma del Cliente
            const firmaCliente = muestra.firmas?.firmaCliente?.firma;
            const nombreCliente = muestra.firmas?.firmaCliente?.nombre || muestra.cliente?.nombre || 'N/A';
            const documentoCliente = muestra.firmas?.firmaCliente?.documento || muestra.cliente?.documento || 'N/A';
            const firmaClienteBuffer = procesarBase64(firmaCliente);

            if (firmaClienteBuffer) {
                doc.image(firmaClienteBuffer, doc.page.width - 50 - signatureWidth, signatureY, {
                    fit: [signatureWidth, 50],
                    align: 'center'
                });
            }
            doc.fontSize(10)
               .text('Cliente', doc.page.width - 50 - signatureWidth, signatureY + 55,
                    { width: signatureWidth, align: 'center' })
               .text(nombreCliente, doc.page.width - 50 - signatureWidth, signatureY + 70,
                    { width: signatureWidth, align: 'center' })
               .text(documentoCliente, doc.page.width - 50 - signatureWidth, signatureY + 85,
                    { width: signatureWidth, align: 'center' });

            // Finalizar documento
            doc.end();

            stream.on("finish", () => {
                console.log("PDF generado exitosamente:", rutaArchivo);
                resolve(`/pdfs/${nombreArchivo}`);
            });

            stream.on("error", (error) => {
                console.error("Error al escribir el PDF:", error);
                reject(error);
            });

        } catch (error) {
            console.error("Error al generar PDF:", error);
            reject(error);
        }
    });
};

module.exports = generarPDF; // estado bien