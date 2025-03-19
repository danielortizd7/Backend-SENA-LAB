const { cambiarEstadoMuestra } = require("../services/cambiarEstadoService");
const { Muestra, estadosValidos } = require("../../../shared/models/muestrasModel");

// Función para asignar estado
const asignarEstado = async (req, res) => {
  try {
    const { cedula, estado } = req.body;
    const { idMuestra } = req.params; // ID de la muestra desde la URL

    if (!cedula || !idMuestra || !estado) {
      return res.status(400).json({ error: "Cédula, ID de muestra y estado son requeridos." });
    }

    console.log("Asignando estado:", { cedula, idMuestra, estado });

    const muestra = await cambiarEstadoMuestra(cedula, idMuestra, estado);

    if (!muestra) {
      return res.status(404).json({ error: "No se encontró la muestra o no se pudo asignar el estado." });
    }

    res.status(200).json({ mensaje: "Estado asignado con éxito", muestra });

  } catch (error) {
    console.error("Error al asignar estado:", error);
    res.status(500).json({ error: "Error interno del servidor", detalle: error.message });
  }
};

//Función para actualizar estado
const actualizarEstado = async (req, res) => {
  try {
    const { cedula, estado } = req.body;
    const { idMuestra } = req.params; // ID de la muestra desde la URL

    if (!cedula || !idMuestra || !estado) {
      return res.status(400).json({ error: "Cédula, ID de muestra y estado son requeridos." });
    }

    console.log("Actualizando estado:", { cedula, idMuestra, estado });

    const muestra = await cambiarEstadoMuestra(cedula, idMuestra, estado);

    if (!muestra) {
      return res.status(404).json({ error: "No se encontró la muestra o no se pudo actualizar." });
    }

    if (estado === "Finalizada" && !muestra.resultado) {
      return res.status(200).json({
        mensaje: "Estado actualizado con éxito, pero no se encontró resultado.",
        muestra,
      });
    }

    res.status(200).json({ mensaje: "Estado actualizado con éxito", muestra });

  } catch (error) {
    console.error("Error al actualizar estado:", error);
    res.status(500).json({ error: "Error interno del servidor", detalle: error.message });
  }
};

module.exports = { asignarEstado, actualizarEstado };
