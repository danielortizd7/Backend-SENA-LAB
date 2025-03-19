const express = require('express');
const { 
    obtenerTiposAgua,
    crearTipoAgua,
    actualizarTipoAgua,
    eliminarTipoAgua
} = require('../controllers/tipoAguaController.js');
const { verificarToken, verificarAdmin } = require('../../shared/middlewares/authMiddleware.js');

const router = express.Router();

router.get('/', obtenerTiposAgua);
router.post('/', verificarToken, verificarAdmin, crearTipoAgua);
router.put('/:id', verificarToken, verificarAdmin, actualizarTipoAgua);
router.delete('/:id', verificarToken, verificarAdmin, eliminarTipoAgua);

module.exports = router;