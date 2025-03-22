const express = require('express');
const router = express.Router();
const muestrasController = require('../controllers/muestrasController');

// Ruta para crear una nueva muestra
router.post('/muestras', muestrasController.crearMuestra);

// Ruta para obtener todas las muestras
router.get('/muestras', muestrasController.obtenerMuestras);

// Ruta para obtener muestras por tipo
router.get('/muestras/tipo/:tipo', muestrasController.obtenerMuestrasPorTipo);

// Ruta para obtener muestras por estado
router.get('/muestras/estado/:estado', muestrasController.obtenerMuestrasPorEstado);

// Ruta para obtener una muestra específica
router.get('/muestras/:id', muestrasController.obtenerMuestra);

// Ruta para actualizar una muestra
router.put('/muestras/:id', muestrasController.actualizarMuestra);

module.exports = router; 