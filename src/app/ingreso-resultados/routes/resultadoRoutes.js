const express = require("express");
const router = express.Router();
const resultadoController = require("../controllers/resultadoController");
const { resultadoValidators } = require("../../../shared/validators");
const { verificarToken, verificarLaboratorista } = require("../../../shared/middleware/authMiddleware");

// Manejador de errores async
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.post(
  "/registrar",
  verificarToken,
  verificarLaboratorista,
  resultadoValidators.guardarResultado,
  resultadoController.registrarResultado
);

router.put(
  "/editar/:idMuestra",
  verificarToken,
  verificarLaboratorista,
  resultadoValidators.editarResultado,
  resultadoController.editarResultado
);

router.post(
  "/verificar/:idMuestra",
  verificarToken,
  verificarLaboratorista,
  resultadoValidators.verificarResultado,
  resultadoController.verificarResultado
);

router.get(
  "/resultados",
  verificarToken,
  resultadoController.obtenerResultados
);

module.exports = router;
