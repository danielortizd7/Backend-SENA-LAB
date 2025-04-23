const express = require('express');
const router = express.Router();
const { verificarDocumento, verificarToken, verificarRolAdministrador, verificarLaboratorista } = require('../../../shared/middleware/authMiddleware');
const { senaLabValidators } = require('../../../shared/validators');
const muestrasController = require('../controllers/muestrasController');
const { paginationMiddleware } = require('../../../shared/middleware/paginationMiddleware');

// ===== RUTAS PÚBLICAS (verificarDocumento) =====
// Ruta para validar usuario
router.get('/public/validar-usuario', verificarDocumento, muestrasController.validarUsuarioController);

// ===== RUTAS PROTEGIDAS (verificarToken) =====
// Rutas de Tipos de Agua (solo administradores)
router.get('/tipos-agua', verificarToken, verificarRolAdministrador, muestrasController.obtenerTiposAgua);
router.post('/tipos-agua', verificarToken, verificarRolAdministrador, muestrasController.crearTipoAgua);
router.put('/tipos-agua/:id', verificarToken, verificarRolAdministrador, muestrasController.actualizarTipoAgua);

// Rutas específicas de muestras
router.get('/cliente/:identificador', verificarToken, muestrasController.obtenerMuestrasPorCliente);
router.get('/tipo/:tipo', verificarToken, muestrasController.obtenerMuestrasPorTipoEstado);

// ===== RUTAS DE LABORATORIO (verificarLaboratorista) =====
router.get('/lab', verificarToken, verificarLaboratorista, muestrasController.obtenerMuestras);
router.get('/lab/:id', verificarToken, verificarLaboratorista, muestrasController.obtenerMuestra);

// Rutas generales de muestras
router.post('/', verificarToken, verificarRolAdministrador, muestrasController.registrarMuestra);
router.get('/', paginationMiddleware, muestrasController.obtenerMuestras);
router.get('/:id', muestrasController.obtenerMuestra);
router.put('/:id', verificarToken, muestrasController.actualizarMuestra);
router.delete('/:id', verificarToken, verificarRolAdministrador, muestrasController.eliminarMuestra);
router.put('/:id/estado', verificarToken, verificarRolAdministrador, muestrasController.actualizarEstadoMuestra);

module.exports = router; 