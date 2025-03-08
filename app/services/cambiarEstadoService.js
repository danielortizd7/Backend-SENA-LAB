const CambioEstado = require("../models/cambioEstado");
const Resultado = require("../models/resultadoModel"); 

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

    
    muestra.historial.push(nuevoCambio);

    
    if (estado === "Finalizada") {
      const resultado = await Resultado.findOne({ idMuestra }); // Buscar resultado por ID de muestra
      if (resultado) {
        muestra.resultado = resultado; 
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
