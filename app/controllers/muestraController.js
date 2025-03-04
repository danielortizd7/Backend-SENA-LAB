const { cambiarEstadoMuestra } = require("../services/cambiarEstadoService");

const actualizarEstado = async (req, res) => {
  try {
    const { cedula, idMuestra, estado } = req.body;

    // 🔹 Validar que todos los campos requeridos estén presentes
    if (!cedula || !idMuestra || !estado) {
      return res.status(400).json({ error: "Cédula, código de muestra y nuevo estado son requeridos." });
    }

    // 🔹 Validar formato de cédula (solo números, longitud mínima)
    if (!/^\d{6,10}$/.test(cedula)) {
      return res.status(400).json({ error: "Cédula inválida. Debe contener solo números y tener entre 6 y 10 dígitos." });
    }

    // 🔹 Validar que idMuestra sea un string no vacío
    if (typeof idMuestra !== "string" || idMuestra.trim() === "") {
      return res.status(400).json({ error: "El código de muestra debe ser un string válido." });
    }

    // 🔹 Validar que el estado sea un valor permitido
    const estadosPermitidos = ["Pendiente", "En proceso", "Finalizado"];
    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({ error: `Estado inválido. Valores permitidos: ${estadosPermitidos.join(", ")}` });
    }

    console.log("Datos recibidos para actualización:", { cedula, idMuestra, estado });

    // 🔹 Intentar actualizar el estado de la muestra
    const muestraActualizada = await cambiarEstadoMuestra(cedula, idMuestra, estado);
    
    if (!muestraActualizada) {
      return res.status(404).json({ error: "No se encontró la muestra o no se pudo actualizar el estado." });
    }

    res.json({ mensaje: "Estado actualizado con éxito", muestra: muestraActualizada });

  } catch (error) {
    console.error("Error al actualizar el estado:", error);
    res.status(500).json({ error: "Error interno del servidor", detalle: error.message });
  }
};

module.exports = { actualizarEstado };
