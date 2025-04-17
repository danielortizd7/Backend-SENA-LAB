const express = require("express");
const router = express.Router();
const resultadoController = require("../controllers/resultadoController");
const { verificarLaboratorista, verificarRolAdministrador } = require("../../../shared/middleware/authMiddleware");
const { resultadoValidators } = require("../../../shared/validators");
const { paginationMiddleware } = require("../../../shared/middleware/paginationMiddleware");
const { registrarAccionResultados } = require("../../../shared/middleware/auditoriaResultadosMiddleware");

// Obtener resultados de una muestra específica
router.get("/muestra/:idMuestra", 
  resultadoController.obtenerResultadoPorMuestra
);

// Obtener todos los resultados
router.get("/resultados",
  paginationMiddleware,
  resultadoController.obtenerResultados
);

// Obtener todos los resultados (sin filtros)
router.get("/todos",
  paginationMiddleware,
  resultadoController.obtenerTodosResultados
);

// Las siguientes rutas requieren ser laboratorista
router.use([
  "/registrar/:idMuestra",
  "/editar/:idMuestra"
], verificarLaboratorista);

// Registrar resultados de una muestra
router.post("/registrar/:idMuestra", 
  resultadoValidators.guardarResultado,
  registrarAccionResultados,
  resultadoController.registrarResultado
);

// Editar resultados de una muestra
router.put("/editar/:idMuestra",
  resultadoValidators.editarResultado,
  registrarAccionResultados,
  resultadoController.editarResultado
);

// Verificar resultados de una muestra (solo administrador)
router.post("/verificar/:idMuestra",
  verificarRolAdministrador,
  registrarAccionResultados,
  resultadoController.verificarResultado
);

module.exports = router;
