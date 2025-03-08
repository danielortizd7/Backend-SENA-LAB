const TipoAgua = require("../models/tipoAgua");

let tiposAguaInicializados = false; 

// inicializar los tipos de agua una sola vez
async function inicializarTiposAgua() {
  if (tiposAguaInicializados) return;
  console.log("Inicializando tipos de agua...");
  const tiposPredefinidos = [
    { tipoDeAgua: "potable", descripcion: "Agua apta para el consumo humano" },
    { tipoDeAgua: "natural", descripcion: "Agua natural de ríos o fuentes" },
    { tipoDeAgua: "residual", descripcion: "Agua contaminada después de uso" },
  ];

  for (const tipo of tiposPredefinidos) {
    const existe = await TipoAgua.findOne({ tipoDeAgua: tipo.tipoDeAgua });
    if (!existe) {
      await new TipoAgua({ ...tipo, esPredefinido: true }).save();
      console.log(`Tipo de agua ${tipo.tipoDeAgua} creado`);
    }
  }
  tiposAguaInicializados = true; 
}

// Obtener todos los tipos de agua
exports.obtenerTiposAgua = async (req, res) => {
  try {
    await inicializarTiposAgua(); // Solo se ejecuta la primera vez

    const filtro = req.query.predefinidos ? { tipoDeAgua: { $ne: "otra" } } : {};

    const tiposAgua = await TipoAgua.find(filtro, { _id: 1, tipoDeAgua: 1, tipoPersonalizado: 1, descripcion: 1 });

    if (!tiposAgua.length) {
      return res.status(404).json({ error: "No se encontraron tipos de agua" });
    }

    const respuestaFormateada = tiposAgua.map((tipo) => ({
      id: tipo._id,
      "Tipo de agua": tipo.tipoDeAgua === "otra" && tipo.tipoPersonalizado ? tipo.tipoPersonalizado : tipo.tipoDeAgua,
      Descripcion: tipo.descripcion,
    }));

    res.status(200).json(respuestaFormateada);
  } catch (error) {
    console.error("Error al obtener los tipos de agua:", error);
    res.status(500).json({ error: "Error al obtener los tipos de agua", detalle: error.message });
  }
};

// Crear un nuevo tipo de agua
exports.crearTipoAgua = async (req, res) => {
  try {
    const { tipoDeAgua, tipoPersonalizado, descripcion } = req.body;

    if (!tipoDeAgua || !descripcion) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    if (tipoDeAgua === "otra" && (!tipoPersonalizado || tipoPersonalizado.trim() === "")) {
      return res.status(400).json({ error: "Si el tipo de agua es 'otra', debes especificar un tipo personalizado" });
    }

    const nuevoTipoAgua = new TipoAgua({
      tipoDeAgua,
      descripcion,
      tipoPersonalizado: tipoDeAgua === "otra" ? tipoPersonalizado.trim() : null,
    });

    await nuevoTipoAgua.save();

    res.status(201).json({ mensaje: "Tipo de agua registrado con éxito", data: nuevoTipoAgua });
  } catch (error) {
    console.error("Error al registrar tipo de agua:", error);
    res.status(500).json({ error: "Error al registrar tipo de agua", detalle: error.message });
  }
};

// Actualizar un tipo de agua existente
exports.actualizarTipoAgua = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipoDeAgua, tipoPersonalizado, descripcion } = req.body;

    if (!tipoDeAgua || !descripcion) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    if (tipoDeAgua === "otra" && (!tipoPersonalizado || tipoPersonalizado.trim() === "")) {
      return res.status(400).json({ error: "Si el tipo de agua es 'otra', debes especificar un tipo personalizado" });
    }

    const tipoActualizado = await TipoAgua.findByIdAndUpdate(
      id,
      {
        tipoDeAgua,
        descripcion,
        tipoPersonalizado: tipoDeAgua === "otra" ? tipoPersonalizado.trim() : null,
      },
      { new: true }
    );

    if (!tipoActualizado) {
      return res.status(404).json({ error: "Tipo de agua no encontrado" });
    }

    res.status(200).json({ mensaje: "Tipo de agua actualizado con éxito", data: tipoActualizado });
  } catch (error) {
    console.error("Error al actualizar tipo de agua:", error);
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

    res.status(200).json({ mensaje: "Tipo de agua eliminado con éxito" });
  } catch (error) {
    console.error("Error al eliminar tipo de agua:", error);
    res.status(500).json({ error: "Error al eliminar tipo de agua", detalle: error.message });
  }
};