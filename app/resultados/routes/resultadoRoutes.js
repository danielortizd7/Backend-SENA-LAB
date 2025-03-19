const express = require('express');
const { 
    registrarResultados,
    obtenerResultados,
    actualizarResultados,
    eliminarResultados,
    verificarResultados
} = require('../controllers/resultadoController.js');
const { verificarToken, verificarAdmin } = require('../../shared/middlewares/authMiddleware.js');

const router = express.Router();

router.post('/:idMuestra', verificarToken, registrarResultados);
router.get('/:idMuestra', obtenerResultados);
router.put('/:idMuestra', verificarToken, actualizarResultados);
router.delete('/:idMuestra', verificarToken, verificarAdmin, eliminarResultados);
router.post('/:idMuestra/verificar', verificarToken, verificarAdmin, verificarResultados);

module.exports = router;