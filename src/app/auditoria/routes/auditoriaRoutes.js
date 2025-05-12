const express = require("express");
const router = express.Router();
const auditoriaController = require("../controllers/auditoriaController");
const auditoriaValidators = require("../validators/auditoriaValidators");
const { verificarToken, verificarPermiso, PERMISOS } = require("../../../shared/middleware/authMiddleware");

// Rutas protegidas
router.use(verificarToken);

// Obtener registros de auditoría
router.get(
    "/registros",
    verificarPermiso(PERMISOS.VER_AUDITORIA),
    auditoriaValidators.obtenerRegistros,
    auditoriaController.obtenerRegistros
);

// Exportar registros de auditoría
router.get(
    "/exportar",
    verificarPermiso(PERMISOS.EXPORTAR_AUDITORIA),
    auditoriaValidators.obtenerRegistros,
    auditoriaController.exportarRegistros
);

// Filtrar registros de auditoría
router.get(
    "/filtrar",
    verificarPermiso(PERMISOS.FILTRAR_AUDITORIA),
    auditoriaValidators.filtrarRegistros,
    auditoriaController.filtrarRegistros
);

// Nueva ruta para obtener auditorías semanales
router.get(
    "/semanales",
    verificarPermiso(PERMISOS.VER_AUDITORIA),
    auditoriaController.obtenerAuditoriasSemanales
);

// Nueva ruta para obtener auditorías mensuales
router.get(
    "/mensuales",
    verificarPermiso(PERMISOS.VER_AUDITORIA),
    auditoriaController.obtenerAuditoriasMensuales
);

// Nueva ruta para generar PDF de un registro de auditoría
router.get(
    "/registros/:id/pdf",
    verificarPermiso(PERMISOS.VER_AUDITORIA),
    auditoriaController.generarPDFRegistro
);

module.exports = router;
