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

// Validar que los valores numéricos sean válidos
const validarValoresNumericos = (datos) => {
  const campos = ['pH', 'turbidez', 'oxigenoDisuelto', 'nitratos', 'fosfatos'];
  campos.forEach(campo => {
    if (datos[campo] !== undefined) {
      const valor = Number(datos[campo]);
      if (isNaN(valor)) {
        throw new ValidationError(`El valor de ${campo} debe ser numérico`);
      }
      // Validaciones específicas para cada campo
      switch (campo) {
        case 'pH':
          if (valor < 0 || valor > 14) {
            throw new ValidationError('El pH debe estar entre 0 y 14');
          }
          break;
        case 'turbidez':
        case 'oxigenoDisuelto':
        case 'nitratos':
        case 'fosfatos':
          if (valor < 0) {
            throw new ValidationError(`El valor de ${campo} no puede ser negativo`);
          }
          break;
      }
    }
  });
};

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
      observaciones,
    } = req.body;

    // Validar valores numéricos
    validarValoresNumericos(req.body);

    // Verificar que la muestra existe
    const muestraEncontrada = await Muestra.findOne({
      id_muestra: idMuestra.trim(),
    }).collation({ locale: "es", strength: 2 });

    if (!muestraEncontrada) {
      throw new NotFoundError("Muestra no encontrada");
    }

    // Verificar que la muestra no tenga resultados ya registrados
    const resultadoExistente = await Resultado.findOne({ idMuestra: idMuestra.trim() });
    if (resultadoExistente) {
      throw new ValidationError("Esta muestra ya tiene resultados registrados");
    }

    // Usar la información del laboratorista del middleware
    const laboratorista = req.laboratorista;

    const resultadoOrdenado = {
      idMuestra: idMuestra.trim(),
      documento: muestraEncontrada.documento,
      fechaHora: muestraEncontrada.fechaHora,
      tipoMuestreo: muestraEncontrada.tipoMuestreo,
      pH: pH !== undefined ? Number(pH) : undefined,
      turbidez: turbidez !== undefined ? Number(turbidez) : undefined,
      oxigenoDisuelto: oxigenoDisuelto !== undefined ? Number(oxigenoDisuelto) : undefined,
      nitratos: nitratos !== undefined ? Number(nitratos) : undefined,
      fosfatos: fosfatos !== undefined ? Number(fosfatos) : undefined,
      cedulaLaboratorista: laboratorista.documento,
      nombreLaboratorista: laboratorista.nombre,
      observaciones,
      historialCambios: [
        {
          accion: "Registrado",
          nombre: laboratorista.nombre,
          cedula: laboratorista.documento,
          fecha: new Date(),
        },
      ],
    };

    const nuevoResultado = await Resultado.create(resultadoOrdenado);

    return ResponseHandler.success(
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
    const { observacion, ...datosEditados } = req.body;

    // Validar valores numéricos de los datos editados
    validarValoresNumericos(datosEditados);

    const resultado = await Resultado.findOne({ idMuestra: idMuestra.trim() })
      .collation({ locale: "es", strength: 2 });

    if (!resultado) {
      throw new NotFoundError("Resultado no encontrado");
    }

    if (resultado.verificado) {
      throw new ValidationError("Este resultado ya fue verificado, no se puede editar");
    }

    const laboratorista = req.laboratorista;
    if (resultado.cedulaLaboratorista !== laboratorista.documento) {
      throw new AuthorizationError("No autorizado para modificar este resultado");
    }

    const cambios = {};

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

    resultado.historialCambios.push({
      accion: "Editado",
      nombre: laboratorista.nombre,
      cedula: laboratorista.documento,
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
    const laboratorista = req.laboratorista;

    const resultado = await Resultado.findOne({ idMuestra: idMuestra.trim() });

    if (!resultado) {
      throw new NotFoundError("Resultado no encontrado");
    }

    if (resultado.verificado) {
      throw new ValidationError("Este resultado ya fue verificado");
    }

    if (resultado.cedulaLaboratorista === laboratorista.documento) {
      throw new ValidationError("No puedes verificar tus propios resultados");
    }

    resultado.verificado = true;
    resultado.verificadoPor = {
      nombre: laboratorista.nombre,
      cedula: laboratorista.documento,
      fecha: new Date(),
    };

    resultado.historialCambios.push({
      accion: "Verificado",
      nombre: laboratorista.nombre,
      cedula: laboratorista.documento,
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
