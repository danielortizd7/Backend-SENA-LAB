const express = require("express");
const router = express.Router();
const { asignarEstado, actualizarEstado } = require("../controllers/cambioEstadoController");

router.post("/asignar/:idMuestra", asignarEstado);
router.put("/cambiar/:idMuestra", actualizarEstado);

module.exports = router;

