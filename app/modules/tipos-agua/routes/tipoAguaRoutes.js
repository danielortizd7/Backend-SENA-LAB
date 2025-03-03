const express = require("express");
const router = express.Router();
const {
  obtenerTiposAgua,
  crearTipoAgua,
  actualizarTipoAgua,
  eliminarTipoAgua
} = require("../controllers/tipoAguaController"); // ✅ Verifica que el path es correcto

// Definir rutas
router.get("/", obtenerTiposAgua);
router.post("/crear", crearTipoAgua);
router.put("/actualizar/:id", actualizarTipoAgua);
router.delete("/eliminar/:id", eliminarTipoAgua);

module.exports = router;
