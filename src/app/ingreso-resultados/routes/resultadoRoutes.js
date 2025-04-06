const express = require('express');
const router = express.Router();
const { 
    registrarResultado, 
    editarResultado, 
    obtenerResultados, 
    obtenerResultado,
    obtenerResultadoPorMuestra,
    eliminarResultado 
} = require('../controllers/resultadoController');
const { verificarToken } = require('../../../shared/middleware/authMiddleware');
const { verificarLaboratorista } = require('../../../shared/middleware/authMiddleware');
const { paginationMiddleware } = require('../../../shared/middleware/paginationMiddleware');
const { resultadoValidators } = require('../../../shared/validators');

// Rutas públicas (requieren token)
router.get('/muestra/:id', verificarToken, obtenerResultadoPorMuestra);
router.get('/', [verificarToken, paginationMiddleware], obtenerResultados);
router.get('/:id', verificarToken, obtenerResultado);

// Rutas que requieren rol de laboratorista
router.post('/registrar/:id', [
    verificarToken, 
    verificarLaboratorista,
    resultadoValidators.guardarResultado
], registrarResultado);

router.put('/editar/:id', [
    verificarToken, 
    verificarLaboratorista,
    resultadoValidators.editarResultado
], editarResultado);

router.delete('/:id', [
    verificarToken, 
    verificarLaboratorista
], eliminarResultado);

module.exports = router;
