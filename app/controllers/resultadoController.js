const axios = require("axios");
const Resultado = require("../models/resultadoModel");

exports.registrarResultado = async (req, res) => {
  try {
    const { idMuestra, pH, turbidez, oxigenoDisuelto, nitratos, fosfatos, cedulaLaboratorista, nombreLaboratorista } = req.body;

    if (!idMuestra || !cedulaLaboratorista || !nombreLaboratorista) {
      return res.status(400).json({ error: "idMuestra, cedulaLaboratorista y nombreLaboratorista son obligatorios" });
    }

    // 🔹 Convertir valores numéricos y validar
    const valoresNumericos = {
      pH: Number(pH),
      turbidez: Number(turbidez),
      oxigenoDisuelto: Number(oxigenoDisuelto),
      nitratos: Number(nitratos),
      fosfatos: Number(fosfatos),
    };

    for (const key in valoresNumericos) {
      if (isNaN(valoresNumericos[key])) {
        return res.status(400).json({ error: `El valor de ${key} no es válido` });
      }
    }

    // 🔹 Obtener detalles de la muestra desde la API externa
    let muestras = [];
    try {
      const response = await axios.get("https://backendregistromuestra.onrender.com/muestras");
      muestras = response.data;
    } catch (apiError) {
      console.error("Error al obtener muestras:", apiError.message);
      return res.status(500).json({ error: "Error al obtener datos de la muestra" });
    }

    // 🔹 Validar si la muestra existe
    const muestraEncontrada = muestras.find(m => m.id_muestra === idMuestra.trim());
    if (!muestraEncontrada) {
      return res.status(404).json({ error: "Muestra no encontrada" });
    }

    // 🔹 Registrar el resultado
    const nuevoResultado = new Resultado({
      idMuestra: idMuestra.trim(),
      ...valoresNumericos,
      cedulaLaboratorista: cedulaLaboratorista.trim(),
      nombreLaboratorista: nombreLaboratorista.trim(),
    });

    await nuevoResultado.save();

    res.status(201).json({ mensaje: "Resultado registrado exitosamente", resultado: nuevoResultado });

  } catch (error) {
    console.error("Error registrando el resultado:", error);
    res.status(500).json({ error: "Error interno del servidor", detalle: error.message });
  }
};
