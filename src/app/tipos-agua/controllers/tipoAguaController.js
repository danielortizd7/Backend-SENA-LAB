const { validationResult } = require('express-validator');
const { Muestra } = require("../../../shared/models/muestrasModel");
const ResponseHandler = require("../../../shared/utils/responseHandler");
const { NotFoundError, ValidationError } = require("../../../shared/errors/AppError");

// Asignar tipo de agua a una muestra
exports.asignarTipoAgua = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Datos inválidos', errors.array());
    }

    const { idMuestra } = req.params;
    const { tipoDeAgua, tipoPersonalizado, descripcion } = req.body;

    // Validación específica para tipo personalizado
    if (tipoDeAgua === "otra" && !tipoPersonalizado) {
      throw new ValidationError("Para tipo 'otra', debe proporcionar un tipo personalizado");
    }

    // Preparar datos del tipo de agua
    const tipoAguaData = {
      tipo: tipoDeAgua,
      descripcion: descripcion
    };

    // Añadir tipo personalizado si es necesario
    if (tipoDeAgua === "otra") {
      tipoAguaData.tipoPersonalizado = tipoPersonalizado;
    }

    // Buscar y actualizar la muestra
    const muestra = await Muestra.findOneAndUpdate(
      { id_muestra: idMuestra },
      { tipoDeAgua: tipoAguaData },
      { new: true }
    );

    if (!muestra) {
      throw new NotFoundError("Muestra no encontrada");
    }

    return ResponseHandler.success(
      res,
      { muestra },
      "Tipo de agua asignado correctamente"
    );

  } catch (error) {
    console.error("Error al asignar tipo de agua:", error);
    return ResponseHandler.error(res, error);
  }
};

// Actualizar tipo de agua de una muestra
exports.actualizarTipoAgua = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Datos inválidos', errors.array());
    }

    const { idMuestra } = req.params;
    const { tipoDeAgua, tipoPersonalizado, descripcion } = req.body;

    // Validación específica para tipo personalizado
    if (tipoDeAgua === "otra" && !tipoPersonalizado) {
      throw new ValidationError("Para tipo 'otra', debe proporcionar un tipo personalizado");
    }

    // Preparar datos del tipo de agua
    const tipoAguaData = {
      tipo: tipoDeAgua,
      descripcion: descripcion
    };

    // Añadir tipo personalizado si es necesario
    if (tipoDeAgua === "otra") {
      tipoAguaData.tipoPersonalizado = tipoPersonalizado;
    }

    // Buscar y actualizar la muestra
    const muestra = await Muestra.findOneAndUpdate(
      { id_muestra: idMuestra },
      { tipoDeAgua: tipoAguaData },
      { new: true }
    );

    if (!muestra) {
      throw new NotFoundError("Muestra no encontrada");
    }

    return ResponseHandler.success(
      res,
      { muestra },
      "Tipo de agua actualizado correctamente"
    );

  } catch (error) {
    console.error("Error al actualizar tipo de agua:", error);
    return ResponseHandler.error(res, error);
  }
};