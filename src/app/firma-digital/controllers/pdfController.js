const generarPDF = require("../../../shared/utils/generarPDFMuestras");
const { Muestra } = require("../../../shared/models/muestrasModel");
const path = require("path");
const fs = require("fs");

const generarReportePDF = async (req, res) => {
    try {
        const { idMuestra } = req.params;

        // Buscar la muestra con sus firmas
        const muestra = await Muestra.findOne({ id_muestra: idMuestra.trim() })
            .collation({ locale: "es", strength: 2 });

        if (!muestra) {
            return res.status(404).json({
                success: false,
                message: "Muestra no encontrada"
            });
        }

        // Generar el PDF con la muestra completa
        const nombreArchivo = await generarPDF(muestra);

        // Construir la ruta completa del archivo en /tmp
        const filePath = path.resolve('/tmp', nombreArchivo);

        // Verificar si el archivo existe
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: "PDF no encontrado"
            });
        }

        // Enviar el archivo PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=muestra_${idMuestra}.pdf`);
        
        return res.sendFile(filePath);

    } catch (error) {
        console.error('Error al generar PDF de muestra:', error, error.stack);
        return res.status(500).json({
            success: false,
            message: "Error al generar el PDF",
            error: error.message
        });
    }
};

module.exports = { generarReportePDF };