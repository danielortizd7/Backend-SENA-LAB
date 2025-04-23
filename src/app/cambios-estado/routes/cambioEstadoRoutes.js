const express = require("express");
const router = express.Router();
const { cambiarEstado } = require("../controllers/cambioEstadoController");

// Ruta para cambiar el estado de una muestra
router.put("/:id", cambiarEstado);

module.exports = router;

