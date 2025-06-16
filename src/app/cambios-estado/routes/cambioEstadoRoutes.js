const express = require("express");
const router = express.Router();
const { cambiarEstado, aceptarCotizacion } = require("../controllers/cambioEstadoController");

// Ruta para cambiar el estado de una muestra
router.put("/:id", cambiarEstado);

// Ruta específica para aceptar cotizaciones
router.put("/:id/aceptar-cotizacion", aceptarCotizacion);

module.exports = router;

