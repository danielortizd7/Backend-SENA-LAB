const express = require('express');
const { 
    obtenerMuestras, 
    obtenerMuestraPorId,
    registrarMuestra, 
    actualizarMuestra, 
    eliminarMuestra 
} = require('../controllers/muestrasController.js');
const { verificarToken, verificarAdmin } = require('../../shared/middlewares/authMiddleware.js');

const router = express.Router();

router.get('/', obtenerMuestras); // Obtener todas las muestras
router.get('/:id', obtenerMuestraPorId); // Obtener una muestra por ID
router.post('/registrar', verificarToken, verificarAdmin, registrarMuestra);
router.put('/:id', actualizarMuestra);
router.delete('/:id', verificarToken, verificarAdmin, eliminarMuestra);

module.exports = router;
