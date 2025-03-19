const express = require("express");
const router = express.Router();
const resultadoController = require("../controllers/resultadoController");
const authMiddleware = require("../../../shared/middleware/authMiddleware");

// Manejador de errores async
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.put(
  "/editar/:idMuestra",
  authMiddleware,
  asyncHandler(resultadoController.editarResultado)
);
router.post(
  "/verificar/:idMuestra",
  authMiddleware,
  asyncHandler(resultadoController.verificarResultado)
);
router.post(
  "/registrar",
  authMiddleware,
  asyncHandler(resultadoController.registrarResultado)
);

router.get("/resultados", asyncHandler(resultadoController.obtenerResultados));


module.exports = router;
