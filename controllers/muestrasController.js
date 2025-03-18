import { verificarRolUsuario } from '../services/usuariosService.js';
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
            filtros.analisisSeleccionados = { $in: req.query.analisisSeleccionados.split(",") };
        }

        if (req.query.fechaInicio && req.query.fechaFin) {
            filtros.fechaHora = { 
                $gte: new Date(req.query.fechaInicio),
                $lte: new Date(req.query.fechaFin) 
            };
        }
        if (req.query.planMuestreo) filtros.planMuestreo = req.query.planMuestreo;
        if (req.query.lugarMuestreo) filtros.lugarMuestreo = req.query.lugarMuestreo;
        if (req.query.tempMin || req.query.tempMax || req.query.humMin || req.query.humMax){
            filtros.condicionesAmbientales.temperatura = filtros.condicionesAmbientales || {};

            if (req.query.tempMin || req.query.tempMax){
                filtros["condicionesAmbientales.temperatura"] = {};
                if (req.query.tempMin)
                    filtros["condicionesAmbientales.temperatura"].$gte = parseFloat(req.query.tempMin);
               
                if (req.query.tempMax)
                    filtros["condicionesAmbientales.temperatura"].$lte = parseFloat(req.query.tempMax);
                
            }

            if (req.query.humMin || req.query.humMax) {
                filtros["condicionesAmbientales.humedad"] = {};
                if (req.query.humMin)
                    filtros["condicionesAmbientales.humedad"].$gte = parseFloat(req.query.humMin);
                
                if (req.query.humMax)
                    filtros["condicionesAmbientales.humedad"].$lte = parseFloat(req.query.humMax);
                
            }
        }

        if (req.query.preservacionMuestra) filtros.preservacionMuestra = req.query.preservacionMuestra;

        const muestras = await Muestra.find(filtros).sort({ fechaHora: -1 });
        res.status(200).json(muestras);
    } catch (err) {
        res.status(500).json({ mensaje: "Error al obtener muestras", error: err.message });
    }
};

// 2️ Registrar una nueva muestra
export const registrarMuestra = async (req, res) => {
    try {
        let { tipoMuestra,
             tipoMuestreo, 
             analisisSeleccionados,
             planMuestreo,
             lugarMuestreo,
             condicionesAmbientales,
             preservacionMuestra,
              ...restoDatos
             } = req.body;
         // Validar que tipoMuestra sea "agua" o "suelo"
         if (!["agua", "suelo"].includes(tipoMuestra)) {
            return res.status(400).json({ mensaje: "El tipo de muestra debe ser 'agua' o 'suelo'." });
        }
        // Si tipoMuestreo es una cadena, se convierte en un array de strings
        if (typeof tipoMuestreo === 'string') {
            tipoMuestreo = tipoMuestreo.split(',').map(item => item.trim());
        }

        //   todos los elementos de tipoMuestreo sean strings
        if (Array.isArray(tipoMuestreo)) {
            tipoMuestreo = tipoMuestreo.map(item => String(item)); // Convierte cada elemento a string
        }

        // Valida que tipoMuestreo sea un array
        if (!Array.isArray(tipoMuestreo) || tipoMuestreo.length === 0) {
            return res.status(400).json({ mensaje: "tipoMuestreo debe ser un array con al menos un valor." });
        }

        // Valida que analisisSeleccionados sea un array
        if (!Array.isArray(analisisSeleccionados) || analisisSeleccionados.length === 0) {
            return res.status(400).json({ mensaje: "analisisSeleccionados debe ser un array con al menos un valor." });
        }

        if (!planMuestreo || typeof planMuestreo !== 'string' || planMuestreo.trim()==='') {
            return res.status(400).json({ mensaje: "El plan de muestreo es requerido y debe ser una cadena no vacía." });
        } 
        if (!lugarMuestreo || typeof lugarMuestreo!== 'string' || lugarMuestreo.trim()==='') {
            return res.status(400).json({ mensaje: "El lugar de muestreo es requerido y debe ser una cadena no vacía." });
        }
        if  (!condicionesAmbientales || typeof condicionesAmbientales !== 'object') {
            return res.status(400).json({ mensaje: "Las condiciones ambientales deben ser un objeto." });
        } 
        if (!('temperatura' in condicionesAmbientales) || typeof condicionesAmbientales.temperatura !== 'number') {
            return res.status(400).json({ mensaje: "Las condiciones ambientales deben tener una temperatura en número." });
        }
        if (!('humedad' in condicionesAmbientales) || typeof condicionesAmbientales.humedad !== 'number') {
            return res.status(400).json({ mensaje: "Las condiciones ambientales deben tener una humedad en número." });
        }
        if (!preservacionMuestra || typeof preservacionMuestra!=='string' || preservacionMuestra.trim()==='') {
            return res.status(400).json({ mensaje: "La preservación de la muestra es requerida y debe ser una cadena no vacía." });
        }
        // Crear la nueva muestra
        const nuevaMuestra = new Muestra({tipoMuestra,
             tipoMuestreo,
              analisisSeleccionados,
              planMuestreo,
              lugarMuestreo,
              condicionesAmbientales,
              preservacionMuestra,
               ...restoDatos });
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

        if (tipoMuestreo !== undefined && (!Array.isArray(tipoMuestreo) || tipoMuestreo.length === 0)) {
            return res.status(400).json({ mensaje: "tipoMuestreo debe ser un array con al menos un valor." });
        }

        if (analisisSeleccionados !== undefined && (!Array.isArray(analisisSeleccionados) || analisisSeleccionados.length === 0)) {
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
    const { idUsuario, idMuestra } = req.params;
    try { 
        /*const muestraEliminada = await Muestra.findByIdAndDelete(idUsuario);*/
        const usuario = await verificarRolUsuario(idUsuario);
        if(usuario.rol.name == "administrador" || usuario.rol.name == "Administrador" || usuario.rol.name == "admin" || usuario.rol.name == "Admin"){
            const muestraEliminada = await Muestra.findByIdAndDelete(idMuestra);
            if(muestraEliminada){
                res.json({mensaje:"Muestra eliminada"});
            } else {
                res.json({mensaje:"No se pudo eliminar la muestra"});
            }
        }else {
            return res.status(401).json({ mensaje: "Acceso denegado. No tiene permisos para eliminar muestras." });
        }
            
    }catch (error){
        res.json({mensaje:"Error"})
    }
    
  
};