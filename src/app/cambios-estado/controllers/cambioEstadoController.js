const { validationResult } = require('express-validator');
const { cambiarEstadoMuestra } = require("../services/cambiarEstadoService");
const { Muestra, estadosValidos } = require("../../../shared/models/muestrasModel");
const ResponseHandler = require("../../../shared/utils/responseHandler");
const { NotFoundError, ValidationError } = require("../../../shared/errors/AppError");

// Función para cambiar estado (solo laboratorista)
const cambiarEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { nuevoEstado } = req.body;
        const usuario = req.usuario; // El usuario debe venir del middleware de autenticación

        if (!nuevoEstado) {
            return res.status(400).json({
                success: false,
                message: 'El nuevo estado es requerido'
            });
        }

        const resultado = await cambiarEstadoMuestra(id, nuevoEstado, usuario);

        if (!resultado.success) {
            return res.status(400).json(resultado);
        }

        return res.status(200).json(resultado);
    } catch (error) {
        console.error('Error en cambiarEstado:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al cambiar el estado de la muestra'
        });
    }
};

// Función para actualizar estado (solo laboratorista)
const actualizarEstado = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new ValidationError('Datos inválidos', errors.array());
        }

        const { cedula, estado } = req.body;
        const { idMuestra } = req.params;

        // Verificar que no sea el estado inicial
        if (estado === "Recibida") {
            throw new ValidationError("El estado 'Recibida' es asignado automáticamente al registrar la muestra");
        }

        // Validaciones específicas para el estado "En Cotización"
        if (estado === "En Cotización") {
            const muestra = await Muestra.findOne({ id_muestra: idMuestra });
            if (!muestra) {
                throw new NotFoundError("No se encontró la muestra.");
            }
            
            // Verificar que la muestra no esté ya en cotización
            if (muestra.estado === "En Cotización") {
                throw new ValidationError("La muestra ya está en estado de cotización.");
            }
            
            // Verificar que la muestra tenga análisis seleccionados
            if (!muestra.analisisSeleccionados || muestra.analisisSeleccionados.length === 0) {
                throw new ValidationError("La muestra debe tener al menos un análisis seleccionado para poder cotizar.");
            }
        }

        console.log("Actualizando estado:", { cedula, idMuestra, estado });

        const muestraActualizada = await cambiarEstadoMuestra(cedula, idMuestra, estado);

        if (!muestraActualizada) {
            throw new NotFoundError("No se encontró la muestra o no se pudo actualizar.");
        }

        if (estado === "Finalizada" && !muestraActualizada.resultado) {
            return ResponseHandler.success(
                res,
                { muestra: muestraActualizada },
                "Estado actualizado con éxito, pero no se encontró resultado"
            );
        }

        return ResponseHandler.success(
            res,
            { muestra: muestraActualizada },
            estado === "En Cotización" ? "Muestra puesta en cotización con éxito" : "Estado actualizado con éxito"
        );

    } catch (error) {
        console.error("Error al actualizar estado:", error);
        return ResponseHandler.error(res, error);
    }
};

module.exports = { cambiarEstado, actualizarEstado };
