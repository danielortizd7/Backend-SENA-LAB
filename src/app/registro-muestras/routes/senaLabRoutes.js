const express = require('express');
const router = express.Router();
const { verificarToken, verificarAdmin, verificarLaboratorista } = require('../../../shared/middleware/authMiddleware');
const { senaLabValidators } = require('../../../shared/validators');
const { ResponseHandler } = require('../../../shared/utils/responseHandler');
const { ValidationError } = require('../../../shared/errors/AppError');

// Importar controladores
const muestrasController = require('../controllers/muestrasController');

// Rutas protegidas con autenticación y validación
router.get('/muestras', verificarToken, muestrasController.obtenerMuestras);
router.get('/muestras/tipo/:tipo', verificarToken, muestrasController.obtenerMuestrasPorTipo);
router.get('/muestras/estado/:estado', verificarToken, muestrasController.obtenerMuestrasPorEstado);
router.get('/muestras/:id', verificarToken, muestrasController.obtenerMuestra);

// Rutas que requieren rol de laboratorista
router.post('/muestras', verificarToken, verificarLaboratorista, senaLabValidators.crearMuestra, muestrasController.crearMuestra);
router.put('/muestras/:id', verificarToken, verificarLaboratorista, senaLabValidators.actualizarMuestra, muestrasController.actualizarMuestra);

// Rutas que requieren rol de administrador
router.delete('/muestras/:id', verificarToken, verificarAdmin, muestrasController.eliminarMuestra);

module.exports = router; 