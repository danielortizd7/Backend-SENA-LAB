const express = require("express");
const router = express.Router();
const resultadoController = require("../controllers/resultadoController");
const mongoose = require("mongoose");

//Conexión a la coleccion externa con .useDb()
const dbExterna = mongoose.connection.useDb("MuestraRegistro");

const muestraSchema = new mongoose.Schema({
  documento: String,
  fechaHora: Date,
  tipoMuestreo: String,
  analisisSeleccionados: Array,
  id_muestra: String,
});

const Muestra = dbExterna.model("Muestra", muestraSchema, "muestras");

// Middleware para manejar errores en rutas asíncronas
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Obtener todos los resultados
router.get("/resultados", asyncHandler(resultadoController.obtenerResultados));

// Registrar un resultado
router.post("/registrar", asyncHandler(resultadoController.registrarResultado));

// Obtener nombre del laboratorista por cédula
router.get("/laboratorista/:cedula", asyncHandler(resultadoController.obtenerLaboratoristaPorCedula));

module.exports = router;
