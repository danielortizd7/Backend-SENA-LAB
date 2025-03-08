const Resultado = require("../models/resultadoModel");
const mongoose = require("mongoose");

const dbExterna = mongoose.connection.useDb("test");

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
      observaciones,
    } = req.body;

    if (!idMuestra || !cedulaLaboratorista) {
      return res.status(400).json({
        error: "idMuestra y cedulaLaboratorista son obligatorios",
      });
    }

    const muestraEncontrada = await Muestra.findOne({
      id_muestra: idMuestra.trim(),
    }).collation({ locale: "es", strength: 2 });

    if (!muestraEncontrada) {
      return res.status(404).json({
        error: "Muestra no encontrada",
      });
    }

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
      nombreLaboratorista: req.nombreLaboratorista,
      observaciones,
      historialCambios: [
        {
          accion: "Registrado",
          nombre: req.nombreLaboratorista,
          fecha: new Date(),
        },
      ],
    };

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

exports.obtenerResultados = async (req, res) => {
  try {
    const resultados = await Resultado.find()
      .sort({ createdAt: -1 })
      .select("-__v"); // Oculta el campo __v

    res.status(200).json({
      mensaje: "Lista de resultados",
      resultados,
    });
  } catch (error) {
    console.error("Error al obtener resultados:", error);
    res.status(500).json({
      mensaje: "Error interno del servidor",
      error: error.message,
    });
  }
};


exports.editarResultado = async (req, res) => {
  try {
    const { idMuestra } = req.params; // Viene desde la URL
    const { cedulaLaboratorista, observacion, ...datosEditados } = req.body;

    if (!cedulaLaboratorista) {
      return res.status(400).json({
        mensaje: "La cédula del laboratorista es obligatoria",
      });
    }

    const resultado = await Resultado.findOne({ idMuestra: idMuestra.trim() }).collation({ locale: "es", strength: 2 });

    if (!resultado) {
      return res.status(404).json({
        mensaje: "Resultado no encontrado",
      });
    }

    // Bloquear si ya está verificado
    if (resultado.verificado) {
      return res.status(403).json({
        mensaje: "Este resultado ya fue verificado, no se puede editar",
      });
    }

    // Solo el laboratorista que lo registró puede editar
    if (resultado.cedulaLaboratorista !== cedulaLaboratorista) {
      return res.status(403).json({
        mensaje: "No autorizado para modificar este resultado",
      });
    }

    const cambios = {};

    // Actualizamos los datos que cambien
    Object.keys(datosEditados).forEach((campo) => {
      if (datosEditados[campo] !== undefined && resultado[campo] !== datosEditados[campo]) {
        cambios[campo] = datosEditados[campo];
        resultado[campo] = datosEditados[campo];
      }
    });

    if (observacion) {
      resultado.observaciones = observacion;
      cambios.observacion = observacion;
    }

    if (Object.keys(cambios).length === 0) {
      return res.status(400).json({ mensaje: "No se realizaron cambios" });
    }

    // Guardamos en el historial
    resultado.historialCambios.push({
      accion: "Editado",
      nombre: req.nombreLaboratorista,
      cedula: cedulaLaboratorista,
      cambios,
      fecha: new Date(),
    });

    await resultado.save();

    res.status(200).json({
      mensaje: "Resultado actualizado correctamente",
      resultado,
    });
  } catch (error) {
    console.error("Error al editar resultado:", error);
    res.status(500).json({
      mensaje: "Error interno del servidor",
      error: error.message,
    });
  }
};

exports.verificarResultado = async (req, res) => {
  try {
    const { idMuestra } = req.params;
    const { cedulaLaboratorista } = req.body;

    if (!cedulaLaboratorista) {
      return res.status(400).json({
        mensaje: "La cédula del laboratorista es obligatoria",
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
      nombre: req.nombreLaboratorista,
      cedula: cedulaLaboratorista,
      fecha: new Date(),
    };

    resultado.historialCambios.push({
      accion: "Verificado",
      nombre: req.nombreLaboratorista,
      cedula: cedulaLaboratorista,
      fecha: new Date(),
    });

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
