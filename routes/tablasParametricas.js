import express from "express";
import { obtenerTablasParametricas, actualizarTablaParametrica } from "../controllers/tablasParametricasController.js";
import { verificarAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", obtenerTablasParametricas);  // Accesible para todos
router.put("/:id", verificarAdmin, actualizarTablaParametrica);  // Solo admin
router.get("/auditorias", verificarAdmin, async (req, res) => {
    try {
        const auditorias = await Auditoria.find().populate("usuario", "nombre email");
        
        // Formatear la respuesta para que sea más clara
        const auditoriaFormateada = auditorias.map(audit => ({
            administrador: audit.usuario.nombre,  // Nombre del administrador
            accion: audit.accion,                // Acción realizada (actualización, eliminación, etc.)
            tabla_modificada: audit.tabla,       // Tabla en la que se realizó la acción
            cambios: audit.cambios,              // Detalles de los cambios realizados
            fecha_modificacion: audit.fecha      // Fecha en la que se realizó la acción
        }));

        res.json(auditoriaFormateada);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener auditorías", error: error.message });
    }
});


export default router;
