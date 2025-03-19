const express = require('express');
const { 
    obtenerTiposAgua,
    crearTipoAgua,
    actualizarTipoAgua,
    eliminarTipoAgua,
    asignarTipoAgua
} = require('../controllers/tipoAguaController.js');
const { verificarToken, verificarAdmin } = require('../../shared/middlewares/authMiddleware.js');

const router = express.Router();

router.get('/', obtenerTiposAgua);
router.post('/', verificarToken, verificarAdmin, crearTipoAgua);
router.put('/:id', verificarToken, verificarAdmin, actualizarTipoAgua);
router.delete('/:id', verificarToken, verificarAdmin, eliminarTipoAgua);
router.post('/asignar/:idMuestra', verificarToken, verificarAdmin, asignarTipoAgua);

module.exports = router;