import TablaParametrica from "../models/TablaParametrica.js";
import Auditoria from "../models/auditoria.js";

// Obtener todas las tablas paramétricas
export const obtenerTablasParametricas = async (req, res) => {
    try {
        const tablas = await TablaParametrica.find();
        res.json(tablas);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener tablas paramétricas", error: error.message });
    }
};

// Actualizar una tabla paramétrica
export const actualizarTablaParametrica = async (req, res) => {
    try {
        const { id } = req.params;
        const nuevosDatos = req.body;

        const tablaActualizada = await TablaParametrica.findByIdAndUpdate(id, nuevosDatos, { new: true });

        if (!tablaActualizada) {
            return res.status(404).json({ mensaje: "Tabla paramétrica no encontrada" });
        }

        // Registrar en auditoría
        await Auditoria.create({
            usuario: req.usuario.id,
            accion: "Actualización",
            tabla: tablaActualizada.nombre,
            cambios: nuevosDatos
        });

        res.json({ mensaje: "Tabla paramétrica actualizada con éxito", data: tablaActualizada });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al actualizar la tabla paramétrica", error: error.message });
    }
};
