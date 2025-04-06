const express = require('express');
const router = express.Router();
const { 
    obtenerResultados, 
    obtenerResultado, 
    registrarResultado, 
    editarResultado, 
    eliminarResultado 
} = require('../controllers/resultadoController');
const { paginationMiddleware } = require('../../../shared/middleware/paginationMiddleware');

// Obtener todos los resultados con paginación
router.get('/', paginationMiddleware, obtenerResultados);

// Obtener un resultado específico
router.get('/:id', obtenerResultado);

// Registrar resultados para una muestra
router.post('/registrar/:id', registrarResultado);

// Actualizar resultados
router.put('/editar/:id', editarResultado);

// Eliminar resultados
router.delete('/:id', eliminarResultado);

module.exports = router; 