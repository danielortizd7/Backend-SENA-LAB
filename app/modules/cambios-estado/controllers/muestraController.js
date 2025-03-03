const { cambiarEstadoMuestra } = require("../services/cambiarEstadoService");

const actualizarEstado = async (req, res) => {
  try {
    const { cedula, idMuestra, estado } = req.body;

    if (!cedula || !idMuestra || !estado) {
      return res.status(400).json({ error: "Cédula, código de muestra y nuevo estado son requeridos." });
    }

    console.log("📥 Datos recibidos:", req.body);

    const muestraActualizada = await cambiarEstadoMuestra(cedula, idMuestra, estado);
    res.json({ mensaje: "✅ Estado actualizado con éxito", muestra: muestraActualizada });

  } catch (error) {
    console.error("❌ Error al actualizar el estado:", error);
    res.status(400).json({ error: error.message });
  }
};

module.exports = { actualizarEstado };
