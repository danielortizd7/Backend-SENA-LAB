const { Muestra } = require("../../../shared/models/muestrasModel");

// Asignar tipo de agua a una muestra
exports.asignarTipoAgua = async (req, res) => {
  try {
    const { idMuestra } = req.params;
    const { tipoDeAgua, tipoPersonalizado, descripcion } = req.body;

    // Validaciones
    if (!tipoDeAgua || !descripcion) {
      return res.status(400).json({ 
        error: "El tipo de agua y la descripción son obligatorios" 
      });
    }

    if (tipoDeAgua === "otra" && !tipoPersonalizado) {
      return res.status(400).json({ 
        error: "Para tipo 'otra', debe proporcionar un tipo personalizado" 
      });
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
      return res.status(404).json({ error: "Muestra no encontrada" });
    }

    res.status(200).json({ 
      mensaje: "Tipo de agua asignado correctamente", 
      muestra 
    });

  } catch (error) {
    console.error("Error al asignar tipo de agua:", error);
    res.status(500).json({ 
      error: "Error al asignar tipo de agua", 
      detalle: error.message 
    });
  }
};

// Actualizar tipo de agua de una muestra
exports.actualizarTipoAgua = async (req, res) => {
  try {
    const { idMuestra } = req.params;
    const { tipoDeAgua, tipoPersonalizado, descripcion } = req.body;

    // Validaciones
    if (!tipoDeAgua || !descripcion) {
      return res.status(400).json({ 
        error: "El tipo de agua y la descripción son obligatorios" 
      });
    }

    if (tipoDeAgua === "otra" && !tipoPersonalizado) {
      return res.status(400).json({ 
        error: "Para tipo 'otra', debe proporcionar un tipo personalizado" 
      });
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
      return res.status(404).json({ error: "Muestra no encontrada" });
    }

    res.status(200).json({ 
      mensaje: "Tipo de agua actualizado correctamente", 
      muestra 
    });

  } catch (error) {
    console.error("Error al actualizar tipo de agua:", error);
    res.status(500).json({ 
      error: "Error al actualizar tipo de agua", 
      detalle: error.message 
    });
  }
};