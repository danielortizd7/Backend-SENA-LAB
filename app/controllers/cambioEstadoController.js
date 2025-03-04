const { cambiarEstadoMuestra } = require("../services/cambiarEstadoService");

const actualizarEstado = async (req, res) => {
  try {
    const { cedula, idMuestra, estado } = req.body;

    if (!cedula || !idMuestra || !estado) {
      return res.status(400).json({ error: "Cédula, código de muestra y nuevo estado son requeridos." });
    }

    const estadosPermitidos = ["Recibida", "En análisis", "Pendiente de resultados", "Finalizada", "Rechazada"];
    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({ error: `Estado inválido. Solo se permiten: ${estadosPermitidos.join(", ")}` });
    }

    console.log("Datos recibidos:", { cedula, idMuestra, estado });

    const muestra = await cambiarEstadoMuestra(cedula, idMuestra, estado);

    if (!muestra) {
      return res.status(404).json({ error: "No se encontró la muestra o no se pudo actualizar." });
    }

    if (estado === "Finalizada" && !muestra.resultado) {
      return res.json({
        mensaje: "Estado actualizado con éxito, pero no se encontró resultado.",
        muestra,
      });
    }

    
    res.json({ mensaje: "Estado actualizado con éxito", muestra });

  } catch (error) {
    console.error("Error al actualizar estado:", error);
    res.status(500).json({ error: "Error interno del servidor", detalle: error.message });
  }
};

module.exports = { actualizarEstado };
