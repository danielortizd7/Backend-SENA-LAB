const express = require("express");
const router = express.Router();
const auditoriaController = require("../controllers/auditoriaController");
const auditoriaValidators = require("../validators/auditoriaValidators");
const { verificarToken, verificarPermiso, PERMISOS } = require("../../../shared/middleware/authMiddleware");

// Rutas protegidas
router.use(verificarToken);

// Obtener registros de auditoría
router.get(
    "/",
    verificarPermiso(PERMISOS.VER_AUDITORIA),
    auditoriaValidators.obtenerRegistros,
    auditoriaController.obtenerRegistros
);

// Obtener registro por ID
router.get(
    "/:id",
    verificarPermiso(PERMISOS.VER_AUDITORIA),
    auditoriaController.obtenerRegistroPorId
);

// Exportar registros
router.get(
    "/exportar",
    verificarPermiso(PERMISOS.EXPORTAR_AUDITORIA),
    auditoriaValidators.obtenerRegistros,
    auditoriaController.exportarRegistros
);

// Obtener muestras para auditoría
router.get(
    "/muestras",
    verificarPermiso(PERMISOS.VER_AUDITORIA),
    auditoriaController.obtenerMuestrasParaAuditoria
);

// Detectar patrones anómalos
router.get(
    "/patrones",
    verificarPermiso(PERMISOS.VER_AUDITORIA),
    auditoriaController.detectarPatronesAnomalos
);

// Exportar auditorías en Excel
router.get(
    "/exportar-excel",
    verificarPermiso(PERMISOS.EXPORTAR_AUDITORIA),
    auditoriaValidators.obtenerRegistros,
    auditoriaController.exportarExcel
);

// Visualizar auditorías en Excel (inline)
router.get(
    "/exportar-excel-visualizar",
    verificarPermiso(PERMISOS.EXPORTAR_AUDITORIA),
    auditoriaValidators.obtenerRegistros,
    auditoriaController.exportarExcelVisualizar
);

// Filtrar registros de auditoría
router.get(
    "/filtrar",
    verificarPermiso(PERMISOS.FILTRAR_AUDITORIA),
    auditoriaValidators.filtrarRegistros,
    auditoriaController.filtrarRegistros
);

// Obtener auditorías semanales
router.get(
    "/semanales",
    verificarPermiso(PERMISOS.VER_AUDITORIA),
    auditoriaController.obtenerAuditoriasSemanales
);

// Obtener auditorías mensuales
router.get(
    "/mensuales",
    verificarPermiso(PERMISOS.VER_AUDITORIA),
    auditoriaController.obtenerAuditoriasMensuales
);

// Obtener datos iniciales de auditoría
router.get(
    "/datos",
    verificarPermiso(PERMISOS.VER_AUDITORIA),
    auditoriaController.obtenerDatosAuditoria
);

// Obtener estadísticas de auditoría
router.get(
    "/estadisticas",
    verificarPermiso(PERMISOS.VER_AUDITORIA),
    auditoriaController.obtenerEstadisticas
);

// Obtener alertas de auditoría
router.get(
    "/alertas",
    verificarPermiso(PERMISOS.VER_AUDITORIA),
    auditoriaController.obtenerAlertas
);

// Estadísticas de análisis más utilizados
router.get(
    "/estadisticas-analisis",
    verificarPermiso(PERMISOS.VER_AUDITORIA),
    auditoriaController.obtenerEstadisticasAnalisis
);

// Registrar nueva acción de auditoría
router.post(
    "/registrar",
    verificarPermiso(PERMISOS.REGISTRAR_AUDITORIA),
    auditoriaController.registrarAccion
);

module.exports = router;
