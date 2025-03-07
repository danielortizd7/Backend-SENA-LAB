import Muestra from '../models/Muestra.js';

// 1️ Obtiene todas las muestras con filtros
export const obtenerMuestras = async (req, res) => {
    try {
        let filtros = {};

        if (req.query.documento) filtros.documento = req.query.documento;
        if (req.query.id_muestra) filtros.id_muestra = req.query.id_muestra;
        if (req.query.tipoMuestra) filtros.tipoMuestra = req.query.tipoMuestra; // Filtro por tipo de muestra
        if (req.query.tipoMuestreo) {
            filtros.tipoMuestreo = { $in: req.query.tipoMuestreo.split(",") };
        }

        if (req.query.analisisSeleccionados) {
            filtros.analisisSeleccionados = { $in: [req.query.analisisSeleccionados] };
        }

        if (req.query.fechaInicio && req.query.fechaFin) {
            filtros.fechaHora = { 
                $gte: new Date(req.query.fechaInicio),
                $lte: new Date(req.query.fechaFin) 
            };
        }

        const muestras = await Muestra.find(filtros).sort({ fechaHora: -1 });
        res.status(200).json(muestras);
    } catch (err) {
        res.status(500).json({ mensaje: "Error al obtener muestras", error: err.message });
    }
};

// 2️ Registrar una nueva muestra
export const registrarMuestra = async (req, res) => {
    try {
        let { tipoMuestra, tipoMuestreo, analisisSeleccionados, ...restoDatos } = req.body;
         // Validar que tipoMuestra sea "agua" o "suelo"
         if (!["agua", "suelo"].includes(tipoMuestra)) {
            return res.status(400).json({ mensaje: "El tipo de muestra debe ser 'agua' o 'suelo'." });
        }
        // Si tipoMuestreo es una cadena, conviértela en un array de strings
        if (typeof tipoMuestreo === 'string') {
            tipoMuestreo = tipoMuestreo.split(',').map(item => item.trim());
        }

        // Asegúrate de que todos los elementos de tipoMuestreo sean strings
        if (Array.isArray(tipoMuestreo)) {
            tipoMuestreo = tipoMuestreo.map(item => String(item)); // Convierte cada elemento a string
        }

        // Validar que tipoMuestreo sea un array
        if (!Array.isArray(tipoMuestreo) || tipoMuestreo.length === 0) {
            return res.status(400).json({ mensaje: "tipoMuestreo debe ser un array con al menos un valor." });
        }

        // Validar que analisisSeleccionados sea un array
        if (!Array.isArray(analisisSeleccionados) || analisisSeleccionados.length === 0) {
            return res.status(400).json({ mensaje: "analisisSeleccionados debe ser un array con al menos un valor." });
        }

        // Crear la nueva muestra con los datos transformados
        const nuevaMuestra = new Muestra({tipoMuestra, tipoMuestreo, analisisSeleccionados, ...restoDatos });
        await nuevaMuestra.save();
        res.status(201).json({ mensaje: "Muestra registrada exitosamente", data: nuevaMuestra });
    } catch (err) {
        res.status(400).json({ mensaje: "Error al registrar muestra", error: err.message });
    }
};

// 3️ Obtener una muestra por su ID
export const obtenerMuestraPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const muestra = await Muestra.findById(id);

        if (!muestra) {
            return res.status(404).json({ mensaje: "Muestra no encontrada" });
        }

        res.status(200).json(muestra);
    } catch (error) {
        res.status(500).json({ mensaje: "Error al obtener la muestra", error: error.message });
    }
};

// 4️ Actualizar una muestra existente
export const actualizarMuestra = async (req, res) => {
    try {
        const { id } = req.params;
        const { tipoMuestreo, analisisSeleccionados, ...restoDatos } = req.body;

        if (tipoMuestreo && (!Array.isArray(tipoMuestreo) || tipoMuestreo.length === 0)) {
            return res.status(400).json({ mensaje: "tipoMuestreo debe ser un array con al menos un valor." });
        }

        if (analisisSeleccionados && (!Array.isArray(analisisSeleccionados) || analisisSeleccionados.length === 0)) {
            return res.status(400).json({ mensaje: "analisisSeleccionados debe ser un array con al menos un valor." });
        }

        const muestraActualizada = await Muestra.findByIdAndUpdate(id, req.body, { new: true });

        if (!muestraActualizada) {
            return res.status(404).json({ mensaje: "Muestra no encontrada" });
        }

        res.json({ mensaje: "Muestra actualizada exitosamente", data: muestraActualizada });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al actualizar la muestra", error: error.message });
    }
};

// 5️ Eliminar una muestra
export const eliminarMuestra = async (req, res) => {
    try {
        const { id } = req.params;
        const muestraEliminada = await Muestra.findByIdAndDelete(id);

        if (!muestraEliminada) {
            return res.status(404).json({ mensaje: "Muestra no encontrada" });
        }

        res.json({ mensaje: "Muestra eliminada exitosamente" });
    } catch (error) {
        res.status(500).json({ mensaje: "Error al eliminar la muestra", error: error.message });
    }
};