const { validationResult } = require('express-validator');


const Resultado = require("../models/resultadoModel");
const mongoose = require("mongoose");
const ResponseHandler = require("../../../shared/utils/responseHandler");
const { NotFoundError, ValidationError, AuthorizationError } = require("../../../shared/errors/AppError");

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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Datos inválidos', errors.array());
    }

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

    const muestraEncontrada = await Muestra.findOne({
      id_muestra: idMuestra.trim(),
    }).collation({ locale: "es", strength: 2 });

    if (!muestraEncontrada) {
      throw new NotFoundError("Muestra no encontrada");
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

    return ResponseHandler.created(
      res,
      { resultado: nuevoResultado },
      "Resultado registrado exitosamente"
    );

  } catch (error) {
    console.error("Error registrando el resultado:", error);
    return ResponseHandler.error(res, error);
  }
};

exports.obtenerResultados = async (req, res) => {
  try {
    const resultados = await Resultado.find()
      .sort({ createdAt: -1 })
      .select("-__v");

    return ResponseHandler.success(
      res,
      { resultados },
      "Lista de resultados obtenida con éxito"
    );

  } catch (error) {
    console.error("Error al obtener resultados:", error);
    return ResponseHandler.error(res, error);
  }
};

exports.editarResultado = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Datos inválidos', errors.array());
    }

    const { idMuestra } = req.params;
    const { cedulaLaboratorista, observacion, ...datosEditados } = req.body;

    const resultado = await Resultado.findOne({ idMuestra: idMuestra.trim() })
      .collation({ locale: "es", strength: 2 });

    if (!resultado) {
      throw new NotFoundError("Resultado no encontrado");
    }

    // Bloquear si ya está verificado
    if (resultado.verificado) {
      throw new ValidationError("Este resultado ya fue verificado, no se puede editar");
    }

    // Solo el laboratorista que lo registró puede editar
    if (resultado.cedulaLaboratorista !== cedulaLaboratorista) {
      throw new AuthorizationError("No autorizado para modificar este resultado");
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
      throw new ValidationError("No se realizaron cambios");
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

    return ResponseHandler.success(
      res,
      { resultado },
      "Resultado actualizado correctamente"
    );

  } catch (error) {
    console.error("Error al editar resultado:", error);
    return ResponseHandler.error(res, error);
  }
};

exports.verificarResultado = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Datos inválidos', errors.array());
    }

    const { idMuestra } = req.params;
    const { cedulaLaboratorista } = req.body;

    const resultado = await Resultado.findOne({ idMuestra: idMuestra.trim() });

    if (!resultado) {
      throw new NotFoundError("Resultado no encontrado");
    }

    if (resultado.verificado) {
      throw new ValidationError("Este resultado ya fue verificado");
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

    return ResponseHandler.success(
      res,
      { resultado },
      "Resultado verificado correctamente"
    );

  } catch (error) {
    console.error("Error al verificar resultado:", error);
    return ResponseHandler.error(res, error);
  }
};
