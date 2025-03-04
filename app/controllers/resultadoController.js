const Resultado = require("../models/resultadoModel");
const mongoose = require("mongoose");

//Conexión a la base de datos externa
const dbExterna = mongoose.connection.useDb("test");

//Modelo Muestra
const muestraSchema = new mongoose.Schema({
  documento: String,
  fechaHora: Date,
  tipoMuestreo: String,
  analisisSeleccionados: Array,
  id_muestra: String,
});
const Muestra = dbExterna.model("Muestra", muestraSchema, "muestras");

exports.registrarResultado = async (req, res) => {
  try {
    const {
      idMuestra,
      pH,
      turbidez,
      oxigenoDisuelto,
      nitratos,
      fosfatos,
      cedulaLaboratorista,
      nombreLaboratorista,
    } = req.body;

    if (!idMuestra || !cedulaLaboratorista || !nombreLaboratorista) {
      return res.status(400).json({
        error: "idMuestra, cedulaLaboratorista y nombreLaboratorista son obligatorios",
      });
    }

    //Buscar la muestra 
    const muestraEncontrada = await Muestra.findOne({
      id_muestra: idMuestra.trim(),
    }).collation({ locale: "es", strength: 2 });

    if (!muestraEncontrada) {
      return res.status(404).json({
        error: "Muestra no encontrada en la base de datos",
      });
    }

    // Crear objeto con el orden específico
    const resultadoOrdenado = {
      idMuestra: idMuestra.trim(),
      documento: muestraEncontrada.documento,
      fechaHora: muestraEncontrada.fechaHora,
      tipoMuestreo: muestraEncontrada.tipoMuestreo,
      pH: Number(pH),
      turbidez: Number(turbidez),
      oxigenoDisuelto: Number(oxigenoDisuelto),
      nitratos: Number(nitratos),
      fosfatos: Number(fosfatos),
      cedulaLaboratorista: cedulaLaboratorista.trim(),
      nombreLaboratorista: nombreLaboratorista.trim(),
    };

    // Crear y guardar el resultado
    const nuevoResultado = await Resultado.create(resultadoOrdenado);

    res.status(201).json({
      mensaje: "Resultado registrado exitosamente",
      resultado: nuevoResultado,
    });
  } catch (error) {
    console.error("Error registrando el resultado:", error);
    res.status(500).json({
      error: "Error interno del servidor",
      detalle: error.message,
    });
  }
};
