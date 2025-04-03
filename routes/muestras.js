import express from 'express';
import { 
    obtenerMuestras, 
    obtenerMuestraPorId,  
    registrarMuestra, 
    actualizarMuestra, 
    eliminarMuestra 
} from '../controllers/muestrasController.js';
import { verificarToken, verificarAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', obtenerMuestras); 
router.get('/:id', obtenerMuestraPorId);
router.post('/registrar',verificarToken, verificarAdmin, registrarMuestra);
router.put('/:id',verificarToken, verificarAdmin, actualizarMuestra);
router.delete('/:idUsuario/:idMuestra', eliminarMuestra);

export default router;
