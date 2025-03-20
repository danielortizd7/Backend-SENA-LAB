const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

const { guardarFirma, buscarMuestra, obtenerTodasLasFirmas } = require("../controllers/firmaController");
const { generarReportePDF } = require("../controllers/pdfController");

router.get("/todas", obtenerTodasLasFirmas);
router.get("/buscar/:idMuestra", buscarMuestra);
router.post("/guardarFirma", guardarFirma);
router.get("/generar-pdf/:idMuestra", generarReportePDF);

// Modificar esta ruta para usar la carpeta public/pdfs
router.get("/pdfs/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const fileName = `muestra_${id.trim().toUpperCase()}.pdf`;
        const filePath = path.join(process.cwd(), "public", "pdfs", fileName);

        if (!fs.existsSync(filePath)) {
            console.warn(`Archivo PDF no encontrado: ${filePath}`);
            return res.status(404).json({ mensaje: "PDF no encontrado" });
        }

        console.log("Enviando PDF:", filePath);
        res.setHeader("Content-Type", "application/pdf");
        res.sendFile(filePath);
    } catch (error) {
        console.error("Error al obtener el PDF:", error);
        res.status(500).json({ mensaje: "Error interno del servidor" });
    }
});

module.exports = router;
