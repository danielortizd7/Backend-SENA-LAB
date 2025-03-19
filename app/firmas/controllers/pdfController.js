const path = require('path');
const fs = require('fs');
const generarPDF = require('../../shared/utils/generarPDF.js');
const { Muestra } = require('../../shared/models/modelMuestras.js');

// Generar PDF con firma
const generarPDFConFirma = async (req, res) => {
    try {
        const { idMuestra } = req.params;
        const { cedulaCliente, firmaCliente, cedulaLaboratorista, firmaLaboratorista } = req.body;

        // Validar que la muestra existe
        const muestra = await Muestra.findOne({ id_muestra: idMuestra });
        if (!muestra) {
            return res.status(404).json({ mensaje: "Muestra no encontrada" });
        }

        console.log("Muestra encontrada:", idMuestra);

        // Generar el PDF
        console.log("Generando PDF...");
        const pdfPath = await generarPDF(muestra, cedulaCliente, firmaCliente, cedulaLaboratorista, firmaLaboratorista);
        console.log("PDF generado:", pdfPath);

        // Actualizar la muestra con la ruta del PDF
        const relativePdfPath = path.relative(
            path.join(__dirname, '../../../public'),
            pdfPath
        ).replace(/\\/g, '/');

        muestra.pdfPath = relativePdfPath;
        await muestra.save();

        res.status(200).json({
            mensaje: "PDF generado con éxito",
            pdfUrl: `/pdfs/${path.basename(pdfPath)}`
        });

    } catch (error) {
        console.error("Error al generar PDF:", error);
        res.status(500).json({
            mensaje: "Error al generar el PDF",
            error: error.message
        });
    }
};

// Obtener PDF por ID de muestra
const obtenerPDF = async (req, res) => {
    try {
        const { idMuestra } = req.params;
        const nombreArchivo = `muestra_${idMuestra}.pdf`;
        const pdfPath = path.join(__dirname, '../../../public/pdfs', nombreArchivo);

        if (!fs.existsSync(pdfPath)) {
            return res.status(404).json({ mensaje: "Archivo PDF no encontrado" });
        }

        res.sendFile(pdfPath);

    } catch (error) {
        console.error("Error al obtener PDF:", error);
        res.status(500).json({
            mensaje: "Error al obtener el PDF",
            error: error.message
        });
    }
};

// Eliminar PDF
const eliminarPDF = async (req, res) => {
    try {
        const { idMuestra } = req.params;
        const nombreArchivo = `muestra_${idMuestra}.pdf`;
        const pdfPath = path.join(__dirname, '../../../public/pdfs', nombreArchivo);
        
        if (fs.existsSync(pdfPath)) {
            fs.unlinkSync(pdfPath);
        }

        const muestra = await Muestra.findOne({ id_muestra: idMuestra });
        if (muestra) {
            muestra.pdfPath = undefined;
            await muestra.save();
        }

        res.json({ mensaje: "PDF eliminado con éxito" });

    } catch (error) {
        console.error("Error al eliminar PDF:", error);
        res.status(500).json({
            mensaje: "Error al eliminar el PDF",
            error: error.message
        });
    }
};

module.exports = {
    generarPDFConFirma,
    obtenerPDF,
    eliminarPDF
};
