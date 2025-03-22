const express = require("express");
const router = express.Router();
const tipoAguaController = require("../controllers/tipoAguaController");
const { tipoAguaValidators } = require("../../../shared/validators");
const { verificarToken, verificarLaboratorista } = require("../../../shared/middleware/authMiddleware");

router.post(
  "/asignar/:idMuestra",
  verificarToken,
  verificarLaboratorista,
  tipoAguaValidators.asignarTipoAgua,
  tipoAguaController.asignarTipoAgua
);

router.put(
  "/actualizar/:idMuestra",
  verificarToken,
  verificarLaboratorista,
  tipoAguaValidators.actualizarTipoAgua,
  tipoAguaController.actualizarTipoAgua
);

module.exports = router;
