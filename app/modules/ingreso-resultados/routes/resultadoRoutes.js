const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const resultadoController = require("../controllers/resultadoController");
const Resultado = require("../models/resultadoModel");

// Conectar a la base de datos externa (de tu compañero)
const MONGO_URI = "mongodb+srv://Daniel_Backend:danielortiz@muestraregistro.mmezl.mongodb.net/MuestraRegistro?retryWrites=true&w=majority";
const conexionExterna = mongoose.createConnection(MONGO_URI);

// Definir el modelo de Muestra en la conexión externa
const muestraSchema = new mongoose.Schema({
    documento: String,
    fechaHora: Date,
    tipoMuestreo: String,
    analisisSeleccionados: Array,
    id_muestra: String,
});
const Muestra = conexionExterna.model("Muestra", muestraSchema, "muestras");

// Middleware para manejar errores en rutas asíncronas
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 🔹 Obtener todos los resultados
router.get("/resultados", asyncHandler(resultadoController.obtenerResultados));

// 🔹 Registrar un resultado
router.post("/registrar", asyncHandler(resultadoController.registrarResultado));

// 🔹 Obtener nombre del laboratorista por cédula
router.get("/laboratorista/:cedula", asyncHandler(resultadoController.obtenerLaboratoristaPorCedula));

module.exports = router;

