const express = require("express");
const router = express.Router();
const cambioEstadoController = require("../controllers/cambioEstadoController");
const { cambioEstadoValidators } = require("../../../shared/validators");
const { verificarToken, verificarLaboratorista } = require("../../../shared/middleware/authMiddleware");

// Ruta para asignar estado
router.post(
  "/asignar/:idMuestra",
  verificarToken,
  verificarLaboratorista,
  cambioEstadoValidators.cambiarEstado,
  cambioEstadoController.asignarEstado
);

// Ruta para actualizar estado
router.put(
  "/actualizar/:idMuestra",
  verificarToken,
  verificarLaboratorista,
  cambioEstadoValidators.cambiarEstado,
  cambioEstadoController.actualizarEstado
);

module.exports = router;

