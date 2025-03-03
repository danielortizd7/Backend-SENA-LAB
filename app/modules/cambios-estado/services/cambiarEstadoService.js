const CambioEstado = require("../models/cambioEstado"); // Modelo correcto

const estadosValidos = [
  "Recibida",
  "En análisis",
  "Pendiente de resultados",
  "Finalizada",
  "Rechazada",
];

const cambiarEstadoMuestra = async (cedula, idMuestra, estado) => {
  try {
    // Verificar que el estado sea válido
    if (!estadosValidos.includes(estado)) {
      throw new Error("⚠️ Estado inválido. Los estados permitidos son: " + estadosValidos.join(", "));
    }

    // Buscar la muestra
    const muestra = await CambioEstado.findOne({ idMuestra: String(idMuestra) });

    if (!muestra) {
      throw new Error("❌ Muestra no encontrada.");
    }

    // Actualizar estado
    muestra.estado = estado;
    muestra.fechaCambio = new Date();
    muestra.cedulaLaboratorista = cedula;

    await muestra.save();

    return muestra;
  } catch (error) {
    console.error("❌ Error al cambiar el estado:", error.message);
    throw new Error(error.message);
  }
};

module.exports = { cambiarEstadoMuestra };
