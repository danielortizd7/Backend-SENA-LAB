const express = require("express");
const router = express.Router();
const tipoAguaController = require("../controllers/tipoAguaController");

router.post("/asignar/:idMuestra", tipoAguaController.asignarTipoAgua);
router.put("/actualizar/:idMuestra", tipoAguaController.actualizarTipoAgua);

module.exports = router;
