const express = require("express");
const router = express.Router();
const { actualizarEstado } = require("../controllers/muestraController");
const authMiddleware = require("../middleware/authMiddleware");

router.put("/cambiar-estado", authMiddleware, actualizarEstado);

module.exports = router;

