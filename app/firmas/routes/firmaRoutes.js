const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

const { 
    guardarFirma, 
    buscarMuestra, 
    obtenerTodasLasFirmas
} = require("../controllers/firmaController");

const {
    generarPDFConFirma,
    obtenerPDF,
    eliminarPDF
} = require("../controllers/pdfController");

const { verificarToken, verificarAdmin } = require("../../shared/middlewares/authMiddleware.js");

// Rutas de consulta
router.get("/todas", obtenerTodasLasFirmas);
router.get("/buscar/:idMuestra", buscarMuestra);

// Rutas de firmas
router.post("/guardar", guardarFirma);

// Rutas de PDFs
router.post("/pdf/:idMuestra", verificarToken, generarPDFConFirma);
router.get("/pdf/:idMuestra", obtenerPDF);
router.delete("/pdf/:idMuestra", verificarToken, verificarAdmin, eliminarPDF);

module.exports = router;
