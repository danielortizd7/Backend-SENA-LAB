const express = require("express");
const router = express.Router();
const resultadoController = require("../controllers/resultadoController");
const { verificarLaboratorista } = require("../../../shared/middleware/authMiddleware");
const { resultadoValidators } = require("../../../shared/validators");

// Rutas protegidas - requieren autenticación como laboratorista
router.use(verificarLaboratorista);

// Registrar resultados de una muestra
router.post("/registrar/:idMuestra", 
  resultadoValidators.guardarResultado,
  resultadoController.registrarResultado
);

// Obtener resultados de una muestra específica
router.get("/muestra/:idMuestra", 
  resultadoController.obtenerResultados
);

// Editar resultados de una muestra
router.put("/editar/:idMuestra",
  resultadoValidators.editarResultado,
  resultadoController.editarResultado
);

// Verificar resultados de una muestra
router.post("/verificar/:idMuestra",
  resultadoController.verificarResultado
);

module.exports = router;
