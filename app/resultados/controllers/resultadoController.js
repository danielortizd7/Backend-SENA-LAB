const Resultado = require('../models/Resultado.js');
const mongoose = require("mongoose");
const ResultadoService = require('../services/resultadoService.js');

const dbExterna = mongoose.connection.useDb("test");

const muestraSchema = new mongoose.Schema({
  documento: String,
  fechaHora: Date,
  tipoMuestreo: String,
  analisisSeleccionados: Array,
  id_muestra: String,
});

const Muestra = dbExterna.model("Muestra", muestraSchema, "muestras");

// Registrar resultados de una muestra
const registrarResultados = async (req, res) => {
    try {
        const { idMuestra } = req.params;
        const resultados = await ResultadoService.registrarResultados(idMuestra, req.body);
        res.status(201).json({
            mensaje: "Resultados registrados con éxito",
            resultados
        });
    } catch (error) {
        res.status(400).json({
            mensaje: "Error al registrar resultados",
            error: error.message
        });
    }
};

// Obtener resultados de una muestra
const obtenerResultados = async (req, res) => {
    try {
        const { idMuestra } = req.params;
        const resultados = await ResultadoService.obtenerResultados(idMuestra);
        res.json(resultados);
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al obtener resultados",
            error: error.message
        });
    }
};

// Actualizar resultados de una muestra
const actualizarResultados = async (req, res) => {
    try {
        const { idMuestra } = req.params;
        const resultados = await ResultadoService.actualizarResultados(idMuestra, req.body);
        res.json({
            mensaje: "Resultados actualizados con éxito",
            resultados
        });
    } catch (error) {
        res.status(400).json({
            mensaje: "Error al actualizar resultados",
            error: error.message
        });
    }
};

// Eliminar resultados de una muestra
const eliminarResultados = async (req, res) => {
    try {
        const { idMuestra } = req.params;
        await ResultadoService.eliminarResultados(idMuestra);
        res.json({
            mensaje: "Resultados eliminados con éxito"
        });
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al eliminar resultados",
            error: error.message
        });
    }
};

// Verificar resultados de una muestra
const verificarResultados = async (req, res) => {
    try {
        const { idMuestra } = req.params;
        const { cedulaLaboratorista, nombreLaboratorista } = req.body;

        if (!cedulaLaboratorista || !nombreLaboratorista) {
            return res.status(400).json({
                mensaje: "La cédula y nombre del laboratorista son obligatorios",
            });
        }

        const resultado = await Resultado.findOne({ idMuestra: idMuestra.trim() });

        if (!resultado) {
            return res.status(404).json({ mensaje: "Resultado no encontrado" });
        }

        if (resultado.verificado) {
            return res.status(400).json({ mensaje: "Este resultado ya fue verificado" });
        }

        resultado.verificado = true;
        resultado.verificadoPor = {
            nombre: nombreLaboratorista,
            cedula: cedulaLaboratorista,
            fecha: new Date(),
        };

        resultado.observacion = `${resultado.observacion} | RESULTADO VERIFICADO Y FINALIZADO`;

        await resultado.save();

        res.status(200).json({
            mensaje: "Resultado verificado correctamente",
            resultado,
        });
    } catch (error) {
        console.error("Error al verificar resultado:", error);
        res.status(500).json({
            mensaje: "Error interno del servidor",
            error: error.message,
        });
    }
};

module.exports = {
    registrarResultados,
    obtenerResultados,
    actualizarResultados,
    eliminarResultados,
    verificarResultados
};