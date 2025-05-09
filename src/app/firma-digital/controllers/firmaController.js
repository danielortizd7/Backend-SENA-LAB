const path = require("path");
const fs = require("fs");
const { validationResult } = require('express-validator');
const { Muestra } = require("../../../shared/models/muestrasModel");
const generarPDF = require("../../../shared/utils/generarPDF");
const ResponseHandler = require("../../../shared/utils/responseHandler");
const { NotFoundError, ValidationError } = require("../../../shared/errors/AppError");

// Función para limpiar Base64 y asegurarse de que tenga el prefijo correcto
const formatearBase64 = (firma) => {
    if (!firma) return '';
    
    try {
        // Limpiar espacios en blanco y saltos de línea
        let firmaLimpia = firma.trim().replace(/[\n\r]/g, '');
        
        // Si ya tiene el prefijo correcto, verificar que sea válido
        if (firmaLimpia.startsWith('data:image/')) {
            const [header, contenido] = firmaLimpia.split(',');
            if (!contenido || !contenido.trim()) {
                console.error('Base64 inválido: contenido vacío');
                return '';
            }
            return firmaLimpia;
        }
        
        // Verificar que el contenido sea base64 válido
        if (!/^[A-Za-z0-9+/=]+$/.test(firmaLimpia)) {
            console.error('Base64 inválido: caracteres no permitidos');
            return '';
        }
        
        return `data:image/png;base64,${firmaLimpia}`;
    } catch (error) {
        console.error('Error al formatear base64:', error);
        return '';
    }
};

// Buscar muestra por ID
const buscarMuestra = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new ValidationError('Datos inválidos', errors.array());
        }

        console.log("Buscando muestra con ID:", req.params.idMuestra);
        const { idMuestra } = req.params;

        const muestra = await Muestra.findOne({ id_muestra: idMuestra.trim() })
            .collation({ locale: "es", strength: 2 });

        if (!muestra) {
            throw new NotFoundError(`No se encontró la muestra con ID: ${idMuestra}`);
        }

        console.log("Muestra encontrada:", muestra.id_muestra);
        return ResponseHandler.success(res, { muestra });

    } catch (error) {
        console.error("Error al buscar la muestra:", error);
        return ResponseHandler.error(res, error);
    }
};

// Guardar firmas en la base de datos
const guardarFirma = async (req, res) => {
    try {
        const { idMuestra, firmaAdministrador, firmaCliente } = req.body;

        const muestra = await Muestra.findById(idMuestra);
        if (!muestra) {
            return res.status(404).json({ error: 'Muestra no encontrada' });
        }

        // Actualizar las firmas
        const firmas = {};
        if (firmaAdministrador) {
            firmas.firmaAdministrador = firmaAdministrador;
        }
        if (firmaCliente) {
            firmas.firmaCliente = firmaCliente;
        }

        const muestraActualizada = await Muestra.findByIdAndUpdate(
            idMuestra,
            { firmas },
            { new: true }
        );

        console.log('Muestra actualizada:', muestraActualizada);

        // Generar PDF si ambas firmas están presentes
        if (muestraActualizada.firmas?.firmaAdministrador && muestraActualizada.firmas?.firmaCliente) {
            await generarPDF(muestraActualizada);
        }

        res.json(muestraActualizada);
    } catch (error) {
        console.error('Error al guardar firma:', error);
        res.status(500).json({ error: 'Error al guardar la firma' });
    }
};

// Obtener todas las firmas de la base de datos
const obtenerTodasLasFirmas = async (req, res) => {
    try {
        console.log("Obteniendo todas las firmas...");
        const firmas = await Muestra.find({}, "id_muestra firmas");
        console.log("Firmas obtenidas:", firmas.length);

        return ResponseHandler.success(
            res,
            { firmas },
            "Lista de todas las firmas obtenida con éxito"
        );

    } catch (error) {
        console.error("Error al obtener todas las firmas:", error);
        return ResponseHandler.error(res, error);
    }
};

module.exports = { buscarMuestra, obtenerTodasLasFirmas, guardarFirma };
