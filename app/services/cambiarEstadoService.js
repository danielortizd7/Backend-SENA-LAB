const CambioEstado = require("../models/cambioEstado");
const Resultado = require("../models/resultadoModel"); // Aquí importas la colección de resultados

const estadosValidos = [
  "Recibida",
  "En análisis",
  "Pendiente de resultados",
  "Finalizada",
  "Rechazada",
];

const cambiarEstadoMuestra = async (cedula, idMuestra, estado) => {
  try {
    if (!estadosValidos.includes(estado)) {
      throw new Error("Estado inválido.");
    }

    let muestra = await CambioEstado.findOne({ idMuestra });

    if (!muestra) {
      // Si no existe la muestra, se crea con el primer cambio
      muestra = new CambioEstado({ idMuestra, historial: [] });
    }

    const nuevoCambio = {
      estado,
      cedulaLaboratorista: cedula,
    };

    //Guardar en el historial el cambio
    muestra.historial.push(nuevoCambio);

    //Aquí va lo que me preguntaste
    if (estado === "Finalizada") {
      const resultado = await Resultado.findOne({ idMuestra }); // Busca el resultado con el ID de la muestra
      if (resultado) {
        muestra.resultado = resultado; // Puedes guardar todo el objeto o solo su ID
      }
    }

    await muestra.save();

    return muestra;
  } catch (error) {
    console.error("Error al cambiar estado:", error.message);
    throw new Error(error.message);
  }
};

module.exports = { cambiarEstadoMuestra };
