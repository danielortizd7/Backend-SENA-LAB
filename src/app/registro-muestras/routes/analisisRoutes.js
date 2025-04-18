const express = require('express');
const router = express.Router();
const { 
    crearAnalisis, 
    obtenerAnalisis, 
    obtenerAnalisisPorId, 
    actualizarAnalisis,
    cambiarEstadoAnalisis,
    obtenerAnalisisPorTipo
} = require('../controllers/analisisController');
const { verificarToken, verificarRol } = require('../../../shared/middleware/authMiddleware');

// Función auxiliar para manejar las variantes de las rutas
const handleTipoAnalisis = (tipoBase) => (req, res) => {
    req.params.tipo = tipoBase;
    obtenerAnalisisPorTipo(req, res);
};

// Rutas para análisis
router.post('/', verificarToken, verificarRol(['administrador']), crearAnalisis);
router.get('/', verificarToken, obtenerAnalisis);

// Rutas para análisis fisicoquímicos (singular y plural)
router.get('/fisicoquimico', verificarToken, handleTipoAnalisis('fisicoquimico'));
router.get('/fisicoquimicos', verificarToken, handleTipoAnalisis('fisicoquimico'));

// Rutas para análisis microbiológicos (singular y plural)
router.get('/microbiologico', verificarToken, handleTipoAnalisis('microbiologico'));
router.get('/microbiologicos', verificarToken, handleTipoAnalisis('microbiologico'));

router.get('/:id', verificarToken, obtenerAnalisisPorId);
router.put('/:id', verificarToken, verificarRol(['administrador']), actualizarAnalisis);
router.put('/:id/estado', verificarToken, verificarRol(['administrador']), cambiarEstadoAnalisis);

module.exports = router; 