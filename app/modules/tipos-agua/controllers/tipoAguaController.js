const TipoAgua = require("../models/tipoAgua");

// Obtener todos los tipos de agua
exports.obtenerTiposAgua = async (req, res) => {
  try {
    // Si se envía ?predefinidos=true en la URL, solo devuelve los tipos predefinidos
    const filtro = req.query.predefinidos ? { tipoDeAgua: { $ne: "otra" } } : {};

    // Buscar los tipos de agua en la base de datos, seleccionando solo los campos necesarios
    const tiposAgua = await TipoAgua.find(filtro, { _id: 1, tipoDeAgua: 1, tipoPersonalizado: 1, descripcion: 1 });

    // Formatear la respuesta según el tipo de agua
    const respuestaFormateada = tiposAgua.map(tipo => ({
      id: tipo._id, // ID personalizado
      "Tipo de agua": tipo.tipoDeAgua === "otra" && tipo.tipoPersonalizado ? tipo.tipoPersonalizado : tipo.tipoDeAgua,
      Descripcion: tipo.descripcion
    }));

    res.status(200).json(respuestaFormateada);
  } catch (error) {
    console.error("❌ Error al obtener los tipos de agua:", error);
    res.status(500).json({ error: "Error al obtener los tipos de agua", detalle: error.message });
  }
};

// Crear un nuevo tipo de agua
exports.crearTipoAgua = async (req, res) => {
  try {
    const { tipoDeAgua, tipoPersonalizado, descripcion } = req.body;

    // Validaciones
    if (!tipoDeAgua || !descripcion) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    if (tipoDeAgua === "otra" && !tipoPersonalizado) {
      return res.status(400).json({ error: "Si el tipo de agua es 'otra', debes especificar un tipo personalizado" });
    }

    // Crear el nuevo tipo de agua
    const nuevoTipoAgua = new TipoAgua({
      tipoDeAgua,
      descripcion,
      tipoPersonalizado: tipoDeAgua === "otra" ? tipoPersonalizado : null, // Solo guarda si es "otra"
    });

    await nuevoTipoAgua.save();

    res.status(201).json({ mensaje: "Tipo de agua registrado con éxito", data: nuevoTipoAgua });
  } catch (error) {
    res.status(500).json({ error: "Error al registrar tipo de agua", detalle: error.message });
  }
};

// Actualizar un tipo de agua existente
exports.actualizarTipoAgua = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipoDeAgua, tipoPersonalizado, descripcion } = req.body;

    // Validación: Si tipoDeAgua es "otra", tipoPersonalizado debe estar presente
    if (tipoDeAgua === "otra" && !tipoPersonalizado) {
      return res.status(400).json({ error: "Si el tipo de agua es 'otra', debes especificar un tipo personalizado" });
    }

    const tipoActualizado = await TipoAgua.findByIdAndUpdate(
      id,
      {
        tipoDeAgua,
        descripcion,
        tipoPersonalizado: tipoDeAgua === "otra" ? tipoPersonalizado : null,
      },
      { new: true }
    );

    if (!tipoActualizado) {
      return res.status(404).json({ error: "Tipo de agua no encontrado" });
    }

    res.status(200).json({ mensaje: "Tipo de agua actualizado", data: tipoActualizado });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar tipo de agua", detalle: error.message });
  }
};

// Eliminar un tipo de agua
exports.eliminarTipoAgua = async (req, res) => {
  try {
    const { id } = req.params;

    const tipoEliminado = await TipoAgua.findByIdAndDelete(id);

    if (!tipoEliminado) {
      return res.status(404).json({ error: "Tipo de agua no encontrado" });
    }

    res.status(200).json({ mensaje: "Tipo de agua eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar tipo de agua", detalle: error.message });
  }
};
