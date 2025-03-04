const express = require("express");
const router = express.Router();
const { actualizarEstado } = require("../controllers/cambioEstadoController");

router.put("/cambiar-estado", actualizarEstado);

module.exports = router;
