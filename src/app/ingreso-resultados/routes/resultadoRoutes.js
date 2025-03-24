const express = require("express");
const router = express.Router();
const resultadoController = require("../controllers/resultadoController");
const { resultadoValidators } = require("../../../shared/validators");
const { verificarDocumento, verificarLaboratorista } = require("../../../shared/middleware/authMiddleware");

// Manejador de errores async
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Ruta para registrar resultados (solo laboratorista)
router.post(
  "/registrar",
  verificarDocumento,
  verificarLaboratorista,
  resultadoValidators.guardarResultado,
  resultadoController.registrarResultado
);

// Ruta para editar resultados (solo laboratorista)
router.put(
  "/editar/:idMuestra",
  verificarDocumento,
  verificarLaboratorista,
  resultadoValidators.editarResultado,
  resultadoController.editarResultado
);

// Ruta para verificar resultados (solo laboratorista)
router.post(
  "/verificar/:idMuestra",
  verificarDocumento,
  verificarLaboratorista,
  resultadoValidators.verificarResultado,
  resultadoController.verificarResultado
);

// Ruta para obtener resultados (todos los usuarios autenticados)
router.get(
  "/resultados",
  verificarDocumento,
  resultadoController.obtenerResultados
);

module.exports = router;
