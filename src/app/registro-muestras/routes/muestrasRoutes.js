const express = require('express');
const router = express.Router();
const { verificarDocumento, verificarToken, verificarRolAdministrador, verificarLaboratorista } = require('../../../shared/middleware/authMiddleware');
const { senaLabValidators } = require('../../../shared/validators');
const muestrasController = require('../controllers/muestrasController');

// ===== RUTAS PÚBLICAS (verificarDocumento) =====
// Rutas de Análisis
router.get('/public/analisis', verificarDocumento, muestrasController.obtenerAnalisis);
router.get('/public/analisis/tipo', verificarDocumento, muestrasController.obtenerAnalisisPorTipoAgua);

// Ruta para validar usuario
router.get('/public/validar-usuario', verificarDocumento, muestrasController.validarUsuarioController);

// ===== RUTAS PROTEGIDAS (verificarToken) =====
// Rutas de Análisis
router.get('/analisis', verificarToken, muestrasController.obtenerAnalisis);
router.get('/analisis/tipo', verificarToken, muestrasController.obtenerAnalisisPorTipoAgua);

// Rutas de Tipos de Agua (solo administradores)
router.get('/tipos-agua', verificarToken, verificarRolAdministrador, muestrasController.obtenerTiposAgua);
router.post('/tipos-agua', verificarToken, verificarRolAdministrador, muestrasController.crearTipoAgua);
router.put('/tipos-agua/:id', verificarToken, verificarRolAdministrador, muestrasController.actualizarTipoAgua);

// Rutas de Muestras
router.post('/muestras', verificarToken, muestrasController.registrarMuestra);
router.get('/muestras', verificarToken, muestrasController.obtenerMuestras);
router.get('/muestras/:id', verificarToken, muestrasController.obtenerMuestra);
router.put('/muestras/:id', verificarToken, muestrasController.actualizarMuestra);
router.delete('/muestras/:id', verificarToken, verificarRolAdministrador, muestrasController.eliminarMuestra);

// ===== RUTAS DE LABORATORIO (verificarLaboratorista) =====
// Rutas específicas para laboratoristas
router.get('/lab/muestras', verificarToken, verificarLaboratorista, muestrasController.obtenerMuestras);
router.get('/lab/muestras/:id', verificarToken, verificarLaboratorista, muestrasController.obtenerMuestra);

module.exports = router; 