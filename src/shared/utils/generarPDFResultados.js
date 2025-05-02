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

/*
Opciones de formato PDFKit:
1. Alineación de texto:
   - align: 'left' | 'center' | 'right' | 'justify'

2. Estilos de texto:
   - fontSize: número (tamaño de fuente)
   - font: nombre de la fuente
   - fillColor: color del texto
   - strokeColor: color del borde
   - lineBreak: true/false (salto de línea automático)

3. Opciones de párrafo:
   - paragraphGap: número (espacio entre párrafos)
   - indent: número (sangría)
   - lineGap: número (espacio entre líneas)

4. Opciones de texto continuo:
   - continued: true/false (continuar en la misma línea)
   - width: número (ancho máximo)
   - height: número (alto máximo)

5. Opciones de imagen:
   - fit: [ancho, alto]
   - align: 'left' | 'center' | 'right'
   - valign: 'top' | 'center' | 'bottom'
*/

const generarPDFResultados = async (resultado) => {
    try {
        // Validación detallada de datos
        if (!resultado || typeof resultado !== 'object') {
            throw new Error('Datos de resultado inválidos');
        }

        console.log("Iniciando generación de PDF para muestra:", resultado.idMuestra);

        // Crear el documento PDF con configuración específica
        const doc = new PDFDocument({ 
            size: 'A4',
            margin: 50,
            bufferPages: true, // Importante: permite manipular todas las páginas
            info: {
                Title: `Reporte de Resultados ${resultado.idMuestra}`,
                Author: 'SENA - Laboratorio Ambiental',
                Subject: 'Informe de Resultados de Ensayos',
                Keywords: 'resultados, laboratorio, análisis',
                CreationDate: new Date(),
            }
        });

        // Crear un array para almacenar los chunks del PDF
        const chunks = [];
        
        // Manejar los chunks de datos
        doc.on('data', chunk => chunks.push(chunk));
        
        // Manejar errores en la generación
        doc.on('error', err => {
            console.error('Error en la generación del PDF:', err);
            throw err;
        });

        // Logo SENA
        const logoPath = path.resolve(process.cwd(), "public", "assets", "logoSena.png");
        try {
            if (fs.existsSync(logoPath)) {
                doc.image(logoPath, doc.page.width - 130, 20, { 
                    width: 80,
                    align: 'right',
                    valign: 'top'
                });
            } else {
                console.log("Logo no encontrado en:", logoPath);
            }
        } catch (error) {
            console.error("Error al cargar el logo:", error);
        }

        // Título con fondo azul marino
        doc.rect(0, 80, doc.page.width, 25).fill('#002D4D');
        doc.fillColor('white').fontSize(14).text('Informe de Resultados de Ensayos', 0, 85, { align: 'center' });

        // Función helper para crear filas de la tabla
        const crearFilaTabla = (campo, valor, y, colorFondo = '#ffffff', esEncabezado = false) => {
            const anchoTotal = doc.page.width - 100;
            const anchoCampo = anchoTotal * 0.4;
            const anchoValor = anchoTotal * 0.6;
            
            // Fondo de la fila
            doc.rect(50, y, anchoTotal, 25)
               .fill(esEncabezado ? '#4CAF50' : colorFondo);
            
            // Borde de la fila
            doc.lineWidth(0.5)
               .rect(50, y, anchoTotal, 25)
               .stroke();

            // Texto
            doc.fontSize(10)
               .fillColor(esEncabezado ? '#ffffff' : '#000000');
            
            // Campo (columna izquierda)
            doc.text(campo, 55, y + 7, {
                width: anchoCampo - 10,
                align: 'left'
            });
            
            // Valor (columna derecha)
            doc.text(valor, 55 + anchoCampo, y + 7, {
                width: anchoValor - 10,
                align: 'left'
            });

            return y + 25; // Retorna la siguiente posición Y
        };

        // Función helper para crear filas de la tabla de resultados
        const crearFilaTablaResultados = (datos, y, esEncabezado = false) => {
            const anchoTotal = doc.page.width - 100;
            const anchos = {
                nombre: anchoTotal * 0.25,
                unidad: anchoTotal * 0.15,
                valor: anchoTotal * 0.15,
                metodo: anchoTotal * 0.25,
                tipo: anchoTotal * 0.20
            };
            
            // Fondo de la fila
            doc.rect(50, y, anchoTotal, 25)
               .fill(esEncabezado ? '#4CAF50' : '#ffffff');
            
            // Borde de la fila y líneas verticales
            doc.lineWidth(0.5);
            
            // Borde exterior
            doc.rect(50, y, anchoTotal, 25).stroke();
            
            // Texto
            doc.fontSize(10)
               .fillColor(esEncabezado ? '#ffffff' : '#000000');
            
            let xPos = 50;
            Object.entries(datos).forEach(([key, valor]) => {
                // Texto centrado verticalmente
                doc.text(valor || '#N/D', 
                    xPos + 5, 
                    y + 7,
                    {
                        width: anchos[key] - 10,
                        align: esEncabezado ? 'center' : 'left'
                    }
                );
                
                // Líneas verticales separadoras
                if (xPos < 50 + anchoTotal - anchos[Object.keys(anchos).pop()]) {
                    doc.moveTo(xPos + anchos[key], y)
                       .lineTo(xPos + anchos[key], y + 25)
                       .stroke();
                }
                
                xPos += anchos[key];
            });

            return y + 25;
        };

        // Iniciar posición Y para la tabla
        let yPos = 130;

        // Sección 1: Información General
        yPos = crearFilaTabla('Información General', '', yPos, '#4CAF50', true);
        
        const datosGenerales = [
            ['ID Muestra', resultado.idMuestra],
            ['Estado', resultado.estado],
            ['Verificado', resultado.verificado ? 'Sí' : 'No'],
            ['Fecha de Recepción', formatearFecha(resultado.createdAt)],
            ['Última Actualización', formatearFecha(resultado.updatedAt)]
        ];

        datosGenerales.forEach((fila, index) => {
            yPos = crearFilaTabla(fila[0], fila[1], yPos, index % 2 === 0 ? '#ffffff' : '#f9f9f9');
        });

        // Sección 2: Información del Cliente
        yPos += 10;
        yPos = crearFilaTabla('Información del Cliente', '', yPos, '#4CAF50', true);
        
        const datosCliente = [
            ['Nombre', resultado.cliente?.nombre],
            ['Documento', resultado.cliente?.documento],
            ['Dirección', resultado.cliente?.direccion],
            ['Teléfono', resultado.cliente?.telefono],
            ['Email', resultado.cliente?.email]
        ];

        datosCliente.forEach((fila, index) => {
            yPos = crearFilaTabla(fila[0], fila[1], yPos, index % 2 === 0 ? '#ffffff' : '#f9f9f9');
        });

        // Sección 3: Información de la Muestra
        yPos += 10;
        yPos = crearFilaTabla('Información de la Muestra', '', yPos, '#4CAF50', true);
        
        const datosMuestra = [
            ['Tipo de Agua', `${resultado.tipoDeAgua?.tipo} (${resultado.tipoDeAgua?.descripcion})`],
            ['Lugar de Muestreo', resultado.lugarMuestreo],
            ['Fecha de Muestreo', formatearFecha(resultado.fechaHoraMuestreo)],
            ['Tipo de Análisis', Array.isArray(resultado.tipoAnalisis) ? resultado.tipoAnalisis.join(', ') : resultado.tipoAnalisis]
        ];

        datosMuestra.forEach((fila, index) => {
            yPos = crearFilaTabla(fila[0], fila[1], yPos, index % 2 === 0 ? '#ffffff' : '#f9f9f9');
        });

        // Sección 4: Resultados de Análisis
        yPos += 10;

        doc.rect(50, yPos, doc.page.width - 100, 20)
        .fill('#4CAF50');
     
     doc.fontSize(10)
        .fillColor('#FFFFFF')
        .text('RESULTADOS DE ANÁLISIS', 50, yPos + 5, { 
            align: 'center',
            width: doc.page.width - 100
        });

        yPos += 30;

        
        // Encabezados de la tabla de resultados
        const encabezados = {
            nombre: 'ANÁLISIS',
            unidad: 'UNIDAD',
            valor: 'VALOR',
            metodo: 'MÉTODO',
            tipo: 'TIPO'
        };
        
        yPos = crearFilaTablaResultados(encabezados, yPos, true);

        // Mapeo de parámetros para mostrar en mayúsculas
        const nombreFormateados = {
            'ph': 'PH',
            'conductividad': 'CONDUCTIVIDAD'
        };

        // Verificar si resultados es un Map o un objeto
        const resultadosArray = resultado.resultados instanceof Map ? 
            Array.from(resultado.resultados.entries()) : 
            Object.entries(resultado.resultados);

        console.log('Procesando resultados:', resultadosArray);

        resultadosArray.forEach(([nombre, datos]) => {
            const filaResultado = {
                nombre: nombreFormateados[nombre] || nombre.toUpperCase(),
                unidad: datos.unidad || '#N/D',
                valor: datos.valor || '#N/D',
                metodo: datos.metodo || '#N/D',
                tipo: datos.tipo?.toUpperCase() || '#N/D'
            };
            yPos = crearFilaTablaResultados(filaResultado, yPos);
        });

        if (yPos > doc.page.height - 400) {
            doc.addPage();
            yPos = 30;
        }

        // Sección 5: Historial de Cambios
        
        if (resultado.historialCambios?.length > 0) {
            yPos += 30;
            doc.rect(50, yPos, doc.page.width - 100, 20)
            .fill('#4CAF50');
         
         doc.fontSize(10)
            .fillColor('#FFFFFF')
            .text('HISTORIAL DE CAMBIOS', 50, yPos + 5, { 
                align: 'center',
                width: doc.page.width - 100
            });
         
         

            // Iterar sobre los cambios en orden inverso (más reciente primero)
            [...resultado.historialCambios].reverse().forEach((cambio, index) => {
                const numeroReal = resultado.historialCambios.length - index;
                
                // Título del cambio en verde
                doc.rect(50, yPos, doc.page.width - 100, 20)
                   .fill('#4CAF50');
                
                doc.fontSize(10)
                   .fillColor('#FFFFFF')
                   .text(`CAMBIO #${numeroReal}`, 50, yPos + 5, { 
                       align: 'center',
                       width: doc.page.width - 100
                   });
                
                yPos += 30;

                // Metadata del cambio
                doc.fontSize(9)
                   .fillColor('#000000')
                   .text(
                    `Realizado por: ${cambio.nombre || 'No disponible'} | Fecha: ${cambio.fecha?.fecha && cambio.fecha?.hora 
                        ? `${cambio.fecha.fecha} ${cambio.fecha.hora}`
                        : formatearFecha(cambio.fecha)}`,
                       50,
                       yPos,
                       { width: doc.page.width - 100 }
                   );
                
                yPos += 15;

                // Observaciones
                doc.fontSize(9)
                   .fillColor('#000000')
                   .text(
                       `Observaciones: ${cambio.observaciones?.trim() || 'Sin observaciones'}`,
                       50,
                       yPos,
                       { width: doc.page.width - 100 }
                   );
                
                yPos += 25;

                if (cambio.cambiosRealizados?.resultados) {
                    // Validación de los cambios en resultados
                    console.log(`Procesando cambios en resultados para cambio #${numeroReal}:`, {
                        parametros: Object.keys(cambio.cambiosRealizados.resultados),
                        detallesCambios: cambio.cambiosRealizados.resultados
                    });

                    // Verificar que cada cambio tenga todos los campos necesarios
                    Object.entries(cambio.cambiosRealizados.resultados).forEach(([parametro, datos]) => {
                        const camposRequeridos = ['valorAnterior', 'valorNuevo', 'unidad'];
                        const camposFaltantes = camposRequeridos.filter(campo => !datos[campo]);
                        
                        if (camposFaltantes.length > 0) {
                            console.warn(`Advertencia: Campos faltantes en cambio de ${parametro}:`, camposFaltantes);
                        }
                    });

                    // Configuración de la tabla
                    const anchoTotal = doc.page.width - 100;
                    const anchos = {
                        parametro: anchoTotal * 0.25,
                        anterior: anchoTotal * 0.25,
                        nuevo: anchoTotal * 0.25,
                        unidad: anchoTotal * 0.25
                    };

                    // Fondo gris claro para el encabezado
                    doc.rect(50, yPos, anchoTotal, 25)
                       .fill('#f5f5f5');

                    // Encabezados de la tabla
                    let xPos = 50;
                    const encabezadosCambios = ['Análisis', 'Valor Anterior', 'Valor Nuevo', 'Unidad'];
                    
                    // Borde superior de la tabla
                    doc.lineWidth(0.5)
                       .moveTo(50, yPos)
                       .lineTo(50 + anchoTotal, yPos)
                       .stroke();

                    encabezadosCambios.forEach((encabezado, i) => {
                        doc.fontSize(10)
                           .fillColor('#000000')
                           .text(
                               encabezado,
                               xPos + 5,
                               yPos + 7,
                               {
                                   width: Object.values(anchos)[i] - 10,
                                   align: 'left'
                               }
                           );
                        
                        // Línea vertical
                        doc.moveTo(xPos, yPos)
                           .lineTo(xPos, yPos + 25)
                           .stroke();

                        xPos += Object.values(anchos)[i];
                    });

                    // Línea vertical final
                    doc.moveTo(xPos, yPos)
                       .lineTo(xPos, yPos + 25)
                       .stroke();

                    // Línea horizontal después de los encabezados
                    doc.moveTo(50, yPos + 25)
                       .lineTo(50 + anchoTotal, yPos + 25)
                       .stroke();

                    yPos += 25;

                    // Datos de la tabla
                    Object.entries(cambio.cambiosRealizados.resultados).forEach(([parametro, datos]) => {
                        let xPos = 50;
                        const valores = [
                            parametro,
                            datos.valorAnterior,
                            datos.valorNuevo,
                            datos.unidad
                        ];

                        // Líneas verticales y contenido
                        valores.forEach((valor, i) => {
                            // Borde izquierdo de la celda
                            doc.moveTo(xPos, yPos)
                               .lineTo(xPos, yPos + 25)
                               .stroke();

                            // Contenido
                            doc.fontSize(10)
                               .fillColor('#000000')
                               .text(
                                   valor || '-',
                                   xPos + 5,
                                   yPos + 7,
                                   {
                                       width: Object.values(anchos)[i] - 10,
                                       align: 'left'
                                   }
                               );

                            xPos += Object.values(anchos)[i];
                        });

                        // Línea vertical final de la fila
                        doc.moveTo(xPos, yPos)
                           .lineTo(xPos, yPos + 50)
                           .stroke();

                        // Línea horizontal inferior de la fila
                        doc.moveTo(50, yPos + 25)
                           .lineTo(50 + anchoTotal, yPos + 25)
                           .stroke();

                        yPos += 25;
                    });

                    yPos += 30; // Espacio después de la tabla
                }
            });
        }

        // Verificación después de procesar el historial de cambios
        console.log("Historial de cambios procesado:", resultado.historialCambios?.map(cambio => ({
            numero: cambio._id,
            realizadoPor: cambio.nombre,
            fecha: cambio.fecha,
            observaciones: cambio.observaciones,
            tiposCambios: Object.keys(cambio.cambiosRealizados || {})
        })));

        // Sección 7: Firmas y pie de página
        // Verificar si necesitamos una nueva página para la información final
        if (yPos > doc.page.height - 400) {
            doc.addPage();
            yPos = 50;
        }

        // Título de Observaciones
        doc.rect(50, yPos, doc.page.width - 100, 20)
           .fill('#4CAF50');
        
        doc.fontSize(10)
           .fillColor('#FFFFFF')
           .text('OBSERVACIONES', 50, yPos + 5, { 
               align: 'center',
               width: doc.page.width - 100
           });
        
        yPos += 30;

        // Enlace a la encuesta
        doc.fontSize(8)
           .fillColor('#000000')
           .text('Agradecemos el diligenciamiento de la siguiente encuesta de satisfacción: https://forms.office.com/r/ePtNQrxCMD', 
                 50, yPos, { align: 'center', width: doc.page.width - 100 });

        yPos += 30;

        // Línea de descargo de responsabilidad
        doc.rect(50, yPos, doc.page.width - 100, 20)
           .fill('#4CAF50');
        
        doc.fontSize(10)
           .fillColor('#FFFFFF')
           .text('DESCARGO DE RESPONSABILIDAD', 50, yPos + 5, { 
               align: 'center',
               width: doc.page.width - 100
           });
        
        yPos += 25;

        const disclaimers = [
            'El laboratorio NO EMITE OPINIONES NI DECLARACIONES con el cumplimiento o no cumplimiento de los requisitos y/o especificaciones; el laboratorio no declara conformidad.',
            'El Laboratorio no es responsable por lo datos reportados cuando la información es proporcionada por el cliente. En caso de que la muestra sea suministrada por el cliente, la validez de los resultados depende de las condiciones en que se recibió.',
            'El resultado hace referencia única y exclusivamente a la muestra indicada en este informe, de acuerdo con las condiciones en que se recibió por parte del cliente.',
            'El laboratorio no se responsabiliza de los perjuicios que puedan derivarse del uso inadecuado de la información aquí contenida y de las muestras analizadas.'
        ];

        disclaimers.forEach(text => {
            doc.fontSize(9)
               .fillColor('#000000')
               .text(text, 60, yPos, {
                   align: 'justify',
                   width: doc.page.width - 120,
                   lineGap: 2
               });
            yPos += doc.heightOfString(text, { width: doc.page.width - 120, lineGap: 2 }) + 5;
        });

        yPos += 10;

        // Sección de aclaraciones
        doc.rect(50, yPos, doc.page.width - 100, 20)
           .fill('#4CAF50');
        
        doc.fontSize(10)
           .fillColor('#FFFFFF')
           .text('ACLARACIONES', 50, yPos + 5, { 
               align: 'center',
               width: doc.page.width - 100
           });
        
        yPos += 25;

        const clarifications = [
            'El laboratorio prohíbe la reproducción parcial o total de este informe, sin previa autorización.',
            'Los ensayos alcalinidad total, conductividad eléctrica, dureza cálcica, dureza total, fosfatos, hierro, nitratos, nitritos y turbiedad fueron ejecutados en las instalaciones del laboratorio; los ensayos cloro residual, pH y temperatura fueron realizados en las instalaciones del cliente.',
            'Cualquier solicitud de verificación o repetición de los resultados de análisis debe realizarse en un periodo máximo de 5 días hábiles a partir de la fecha de emisión del informe. El laboratorio evaluará la solicitud y en caso de aceptar el proceso de repetición, este debe realizarse en la contramuestra custodiada por el laboratorio. En caso de no contar con contramuestra o que la misma no se encuentre en condiciones adecuadas para el análisis, no se podrán realizar repeticiones y el proceso de verificación se hará frente a la trazabilidad de los registros de aseguramiento de la validez del resultado.',
            'El Laboratorio de Análisis Ambientales no subcontrata ensayos.'
        ];

        clarifications.forEach(text => {
            doc.fontSize(9)
               .fillColor('#000000')
               .text(text, 60, yPos, {
                   align: 'justify',
                   width: doc.page.width - 120,
                   lineGap: 2
               });
            yPos += doc.heightOfString(text, { width: doc.page.width - 120, lineGap: 2 }) + 5;
        });

        yPos += 20;

        // Sección de firmas
        const firmaWidth = (doc.page.width - 200) / 2;

        // Elaborado por (Laboratorista)
        doc.fontSize(10)
           .fillColor('#000000')
           .text('ELABORADO POR:', 75, yPos, { align: 'center', width: firmaWidth });
        
        doc.fontSize(9)
           .text(resultado.nombreLaboratorista || 'N/A', 75, yPos + 20, { align: 'center', width: firmaWidth })
           .text(`Cédula: ${resultado.cedulaLaboratorista || 'N/A'}`, 75, yPos + 35, { align: 'center', width: firmaWidth })
           .text('ROL: Laboratorista', 75, yPos + 50, { align: 'center', width: firmaWidth });

        // Buscar la información del administrador que verificó
        const verificacionInfo = resultado.historialCambios?.find(cambio => 
            cambio.cambiosRealizados?.verificacion?.nuevo === true
        );

        // Aprobado por (Administrador)
        doc.fontSize(10)
           .fillColor('#000000')
           .text('APROBADO POR:', doc.page.width - 75 - firmaWidth, yPos, { align: 'center', width: firmaWidth });
        
        doc.fontSize(9)
           .text(verificacionInfo?.nombre || 'Director Técnico', doc.page.width - 75 - firmaWidth, yPos + 20, { align: 'center', width: firmaWidth })
           .text(`Cédula: ${verificacionInfo?.cedula || 'N/A'}`, doc.page.width - 75 - firmaWidth, yPos + 35, { align: 'center', width: firmaWidth })
           .text('ROL: Administrador', doc.page.width - 75 - firmaWidth, yPos + 50, { align: 'center', width: firmaWidth });

        yPos += 100;

        // Fin del informe
        doc.rect(50, yPos, doc.page.width - 100, 20)
           .fill('#4CAF50');
        
        doc.fontSize(10)
           .fillColor('#FFFFFF')
           .text('FIN DEL INFORME DE ENSAYO', 50, yPos + 5, { 
               align: 'center',
               width: doc.page.width - 100
           });
        
        yPos += 30;

        // Información de contacto del laboratorio
        doc.fontSize(9)
           .fillColor('#000000')
           .text([
               'LABORATORIO DE ANÁLISIS AMBIENTALES (a)',
               'CARRERA 9 NÚMERO 71N - 60, POPAYÁN, CAUCA',
               'Correo electrónico: labambientalcip@sena.edu.co',
               'Teléfono / WhatsApp: 324 6128123'
           ].join('\n'), 50, yPos, { 
               align: 'center', 
               width: doc.page.width - 100,
               lineGap: 2
           });

        // Finalizar el PDF
        doc.end();

        // Retornar el documento para que pueda ser procesado
        return doc;

    } catch (error) {
        console.error("Error al generar PDF de resultados:", error);
        throw error;
    }
};

module.exports = generarPDFResultados; 