import express from 'express';
import { 
    obtenerMuestras, 
    obtenerMuestraPorId,  //  Se importa la nueva función
    registrarMuestra, 
    actualizarMuestra, 
    eliminarMuestra 
} from '../controllers/muestrasController.js';
import { verificarToken, verificarAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', obtenerMuestras); // Obtener todas las muestras
router.get('/:id', obtenerMuestraPorId); //  Nueva ruta para obtener una muestra por ID
router.post('/registrar',verificarToken, verificarAdmin, registrarMuestra);
router.put('/:id', actualizarMuestra);
router.delete('/:id',verificarToken, verificarAdmin, eliminarMuestra);

export default router;
