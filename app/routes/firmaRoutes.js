const express = require("express");
const router = express.Router();
const { guardarFirma } = require("../controllers/firmaController");
const { generarReportePDF } = require("../controllers/pdfController"); // Aquí se importa
const authMiddleware = require("../middleware/authMiddleware");
const { buscarMuestra } = require("../controllers/firmaController");

router.get("/buscar/:idMuestra", buscarMuestra);



router.post("/guardarFirma", guardarFirma);


router.get("/generar-pdf/:idMuestra", authMiddleware, generarReportePDF);

router.get("/pdf/:id", async (req, res) => {
    const { id } = req.params;
    const filePath = `./reportes/${id}.pdf`;
  
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath, { root: "." });
    } else {
      res.status(404).json({ mensaje: "PDF no encontrado" });
    }
  });
  
  
  

module.exports = router;
