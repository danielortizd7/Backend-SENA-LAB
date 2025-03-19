const path = require("path");
const fs = require("fs");
const { Muestra } = require("../../../shared/models/muestrasModel");
const generarPDF = require("../../../shared/utils/generarPDF");

// Función para limpiar Base64 y asegurarse de que tenga el prefijo correcto
const formatearBase64 = (firma) => {
    if (!firma.startsWith("data:image/png;base64,")) {
        return `data:image/png;base64,${firma}`;
    }
    return firma;
};

// Buscar muestra por ID
const buscarMuestra = async (req, res) => {
    try {
        console.log("Buscando muestra con ID:", req.params.idMuestra);
        const { idMuestra } = req.params;

        const muestra = await Muestra.findOne({ id_muestra: idMuestra.trim() })
            .collation({ locale: "es", strength: 2 });

        if (!muestra) {
            console.warn(`No se encontró la muestra con ID: ${idMuestra}`);
            return res.status(404).json({ error: "Muestra no encontrada" });
        }

        console.log("Muestra encontrada:", muestra.id_muestra);
        res.status(200).json(muestra);
    } catch (error) {
        console.error("Error al buscar la muestra:", error);
        res.status(500).json({ error: "Error al buscar la muestra" });
    }
};

// Guardar firmas en la base de datos
const guardarFirma = async (req, res) => {
    try {
        console.log("Recibiendo datos de firma:", req.body);

        const { id_muestra, cedulaLaboratorista, firmaLaboratorista, cedulaCliente, firmaCliente } = req.body;

        if (!id_muestra || !cedulaLaboratorista || !firmaLaboratorista) {
            console.warn("Datos incompletos:", req.body);
            return res.status(400).json({ error: "El ID de muestra, la cédula del laboratorista y su firma son obligatorios." });
        }

        const muestra = await Muestra.findOne({ id_muestra: id_muestra.trim() })
            .collation({ locale: "es", strength: 2 });

        if (!muestra) {
            console.warn(`Muestra no encontrada con ID: ${id_muestra}`);
            return res.status(404).json({ error: "Muestra no encontrada" });
        }

        console.log("Muestra encontrada:", muestra.id_muestra);

        // Asegurar que existe el objeto firmas
        const nuevasFirmas = { ...muestra.firmas || {} };

        if (!nuevasFirmas.firmaLaboratorista) {
            nuevasFirmas.cedulaLaboratorista = cedulaLaboratorista;
            nuevasFirmas.firmaLaboratorista = formatearBase64(firmaLaboratorista);
            console.log("Firma del laboratorista agregada.");
        }

        if (cedulaCliente && firmaCliente) {
            nuevasFirmas.cedulaCliente = cedulaCliente;
            nuevasFirmas.firmaCliente = formatearBase64(firmaCliente);
            console.log("Firma del cliente agregada.");
        }

        // Actualizar la muestra en la base de datos
        const muestraActualizada = await Muestra.findByIdAndUpdate(
            muestra._id,
            { $set: { firmas: nuevasFirmas } },
            { new: true }
        );

        console.log("Muestra actualizada con las firmas.");

        let rutaPDF = null;
        if (nuevasFirmas.cedulaCliente && nuevasFirmas.firmaCliente) {
            console.log("Generando PDF...");
            rutaPDF = await generarPDF(
                muestraActualizada,
                nuevasFirmas.cedulaCliente,
                nuevasFirmas.firmaCliente,
                nuevasFirmas.cedulaLaboratorista,
                nuevasFirmas.firmaLaboratorista
            );
            console.log("PDF generado:", rutaPDF);
        }

        res.status(200).json({
            message: "Firmas guardadas correctamente",
            muestra: muestraActualizada,
            rutaPDF,
        });

    } catch (error) {
        console.error("Error al guardar las firmas:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

// Obtener todas las firmas de la base de datos
const obtenerTodasLasFirmas = async (req, res) => {
    try {
        console.log("Obteniendo todas las firmas...");
        const firmas = await Muestra.find({}, "id_muestra firmas");
        console.log("Firmas obtenidas:", firmas.length);

        res.status(200).json({
            mensaje: "Lista de todas las firmas",
            firmas,
        });
    } catch (error) {
        console.error("Error al obtener todas las firmas:", error);
        res.status(500).json({ error: "Error al obtener las firmas" });
    }
};

module.exports = { buscarMuestra, obtenerTodasLasFirmas, guardarFirma };
