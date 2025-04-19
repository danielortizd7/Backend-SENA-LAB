const generarPDF = require("../../../shared/utils/generarPDF");
const { Muestra } = require("../../../shared/models/muestrasModel");
const ResponseHandler = require("../../../shared/utils/responseHandler");
const path = require("path");
const fs = require("fs");

const generarReportePDF = async (req, res) => {
    try {
        const { idMuestra } = req.params;
        console.log("Generando PDF para muestra:", idMuestra);

        // Buscar la muestra con sus firmas
        const muestra = await Muestra.findOne({ id_muestra: idMuestra.trim() })
            .collation({ locale: "es", strength: 2 });

        if (!muestra) {
            return ResponseHandler.error(res, { 
                message: "Muestra no encontrada",
                status: 404 
            });
        }

        console.log("Muestra encontrada:", {
            id: muestra.id_muestra,
            tiene_firma_admin: !!muestra.firmas?.administrador?.firmaAdministrador,
            tiene_firma_cliente: !!muestra.firmas?.cliente?.firmaCliente
        });

        // Generar el PDF con la muestra completa
        const rutaPDF = await generarPDF(muestra);

        // Construir la ruta completa del archivo
        const filePath = path.join(process.cwd(), "public", rutaPDF);

        // Verificar si el archivo existe
        if (!fs.existsSync(filePath)) {
            console.error("Archivo PDF no encontrado:", filePath);
            return ResponseHandler.error(res, { 
                message: "PDF no encontrado",
                status: 404 
            });
        }

        // Enviar el archivo PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=muestra_${idMuestra}.pdf`);
        
        // Log de éxito
        console.log("PDF generado y enviado exitosamente:", rutaPDF);
        
        return res.sendFile(filePath);

    } catch (error) {
        console.error("Error al generar el PDF:", error);
        return ResponseHandler.error(res, {
            message: "Error al generar el PDF",
            error: error.message,
            status: 500
        });
    }
};

module.exports = { generarReportePDF };