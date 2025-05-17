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

// Nueva ruta para exportar auditorías en Excel
router.get(
    "/exportar-excel",
    verificarPermiso(PERMISOS.EXPORTAR_AUDITORIA),
    auditoriaValidators.obtenerRegistros,
    auditoriaController.exportarExcel
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

// Nueva ruta para visualizar auditorías en Excel (inline)
router.get(
    "/exportar-excel-visualizar",
    verificarPermiso(PERMISOS.EXPORTAR_AUDITORIA),
    auditoriaValidators.obtenerRegistros,
    auditoriaController.exportarExcelVisualizar
);

// Nueva ruta para obtener datos iniciales de auditoría
router.get(
    "/datos",
    verificarPermiso(PERMISOS.VER_AUDITORIA),
    auditoriaController.obtenerDatosAuditoria
);

module.exports = router;
