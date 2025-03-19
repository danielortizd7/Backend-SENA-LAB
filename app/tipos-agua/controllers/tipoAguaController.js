const TipoAguaService = require('../services/tipoAguaService.js');

// Obtener todos los tipos de agua
const obtenerTiposAgua = async (req, res) => {
    try {
        const tiposAgua = await TipoAguaService.obtenerTiposAgua();
        res.json(tiposAgua);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener tipos de agua", error: error.message });
    }
};

// Crear un nuevo tipo de agua
const crearTipoAgua = async (req, res) => {
    try {
        const nuevoTipoAgua = await TipoAguaService.crearTipoAgua(req.body);
        res.status(201).json({ mensaje: "Tipo de agua creado con éxito", tipoAgua: nuevoTipoAgua });
    } catch (error) {
        res.status(400).json({ mensaje: "Error al crear tipo de agua", error: error.message });
    }
};

// Actualizar un tipo de agua existente
const actualizarTipoAgua = async (req, res) => {
    try {
        const tipoAgua = await TipoAguaService.actualizarTipoAgua(req.params.id, req.body);
        if (!tipoAgua) {
            return res.status(404).json({ mensaje: "Tipo de agua no encontrado" });
        }
        res.json({ mensaje: "Tipo de agua actualizado con éxito", tipoAgua });
    } catch (error) {
        res.status(400).json({ mensaje: "Error al actualizar tipo de agua", error: error.message });
    }
};

// Eliminar un tipo de agua
const eliminarTipoAgua = async (req, res) => {
    try {
        const resultado = await TipoAguaService.eliminarTipoAgua(req.params.id);
        if (!resultado) {
            return res.status(404).json({ mensaje: "Tipo de agua no encontrado" });
        }
        res.json({ mensaje: "Tipo de agua eliminado con éxito" });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al eliminar tipo de agua", error: error.message });
    }
};

// Asignar tipo de agua a una muestra
const asignarTipoAgua = async (req, res) => {
    try {
        const { idMuestra } = req.params;
        const { idTipoAgua } = req.body;
        
        const resultado = await TipoAguaService.asignarTipoAgua(idMuestra, idTipoAgua);
        res.json({ mensaje: "Tipo de agua asignado con éxito", resultado });
    } catch (error) {
        res.status(400).json({ mensaje: "Error al asignar tipo de agua", error: error.message });
    }
};

module.exports = {
    obtenerTiposAgua,
    crearTipoAgua,
    actualizarTipoAgua,
    eliminarTipoAgua,
    asignarTipoAgua
};