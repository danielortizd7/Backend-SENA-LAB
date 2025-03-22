const { validationResult } = require('express-validator');
const { cambiarEstadoMuestra } = require("../services/cambiarEstadoService");
const { Muestra, estadosValidos } = require("../../../shared/models/muestrasModel");
const ResponseHandler = require("../../../shared/utils/responseHandler");
const { NotFoundError, ValidationError } = require("../../../shared/errors/AppError");

// Función para asignar estado
const asignarEstado = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new ValidationError('Datos inválidos', errors.array());
        }

        const { cedula, estado } = req.body;
        const { idMuestra } = req.params;

        console.log("Asignando estado:", { cedula, idMuestra, estado });

        const muestra = await cambiarEstadoMuestra(cedula, idMuestra, estado);

        if (!muestra) {
            throw new NotFoundError("No se encontró la muestra o no se pudo asignar el estado.");
        }

        return ResponseHandler.success(
            res, 
            { muestra }, 
            "Estado asignado con éxito"
        );

    } catch (error) {
        console.error("Error al asignar estado:", error);
        return ResponseHandler.error(res, error);
    }
};

// Función para actualizar estado
const actualizarEstado = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new ValidationError('Datos inválidos', errors.array());
        }

        const { cedula, estado } = req.body;
        const { idMuestra } = req.params;

        console.log("Actualizando estado:", { cedula, idMuestra, estado });

        const muestra = await cambiarEstadoMuestra(cedula, idMuestra, estado);

        if (!muestra) {
            throw new NotFoundError("No se encontró la muestra o no se pudo actualizar.");
        }

        if (estado === "Finalizada" && !muestra.resultado) {
            return ResponseHandler.success(
                res,
                { muestra },
                "Estado actualizado con éxito, pero no se encontró resultado"
            );
        }

        return ResponseHandler.success(
            res,
            { muestra },
            "Estado actualizado con éxito"
        );

    } catch (error) {
        console.error("Error al actualizar estado:", error);
        return ResponseHandler.error(res, error);
    }
};

module.exports = { asignarEstado, actualizarEstado };
