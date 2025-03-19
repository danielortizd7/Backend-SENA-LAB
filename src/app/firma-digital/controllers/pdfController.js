const generarPDF = require("../../../shared/utils/generarPDF");
const { Muestra } = require("../../../shared/models/muestrasModel");

const generarReportePDF = async (req, res) => {
  try {
    const { idMuestra } = req.params;

    if (!idMuestra) {
      return res.status(400).json({
        error: "El ID de la muestra es obligatorio",
      });
    }

    const muestra = await Muestra.findOne({ id_muestra: idMuestra.trim() })
      .collation({ locale: "es", strength: 2 });

    if (!muestra) {
      return res.status(404).json({ error: "Muestra no encontrada" });
    }

    if (!muestra.firmas) {
      return res.status(400).json({
        error: "La muestra no tiene firmas registradas",
      });
    }

    const { 
      cedulaCliente, 
      firmaCliente, 
      cedulaLaboratorista, 
      firmaLaboratorista 
    } = muestra.firmas;

    const rutaPDF = await generarPDF(
      muestra, 
      cedulaCliente, 
      firmaCliente, 
      cedulaLaboratorista, 
      firmaLaboratorista
    );

    res.status(200).json({
      message: "PDF generado correctamente",
      rutaPDF,
    });
  } catch (error) {
    console.error("Error al generar el PDF:", error);
    res.status(500).json({ error: "Error al generar el PDF" });
  }
};

module.exports = { generarReportePDF };