const Muestra = require("../models/muestrasFirmaModel");
const generarPDF = require("../utils/generarPDF");

const guardarFirma = async (req, res) => {
  try {
    const { id_muestra, cedulaLaboratorista, firmaLaboratorista, cedulaCliente, firmaCliente } = req.body;

    if (!id_muestra || !cedulaLaboratorista || !firmaLaboratorista || !cedulaCliente || !firmaCliente) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    const muestra = await Muestra.findOne({ id_muestra: id_muestra.trim() }).collation({ locale: "es", strength: 2 });

    if (!muestra) {
      return res.status(404).json({ error: "Muestra no encontrada" });
    }

    const firmas = {
      cedulaLaboratorista,
      firmaLaboratorista,
      cedulaCliente,
      firmaCliente,
    };

    const muestraActualizada = await Muestra.findByIdAndUpdate(
      muestra._id,
      { $set: { firmas } },
      { new: true }
    );

    // Generar PDF Automático
    const rutaPDF = await generarPDF(
      muestraActualizada,
      cedulaCliente,
      firmaCliente,
      cedulaLaboratorista,
      firmaLaboratorista
    );

    res.status(200).json({
      message: "Firmas guardadas correctamente",
      muestra: muestraActualizada,
      rutaPDF,
    });
  } catch (error) {
    console.error("Error al guardar las firmas:", error);
    res.status(500).json({ error: "Error al guardar las firmas" });
  }
};

const buscarMuestra = async (req, res) => {
  try {
    const { idMuestra } = req.params;

    const muestra = await Muestra.findOne({ id_muestra: idMuestra.trim() }).collation({ locale: "es", strength: 2 });

    if (!muestra) {
      return res.status(404).json({ error: "Muestra no encontrada" });
    }

    res.status(200).json(muestra);
  } catch (error) {
    console.error("Error al buscar la muestra:", error);
    res.status(500).json({ error: "Error al buscar la muestra" });
  }
};

module.exports = { guardarFirma, buscarMuestra };
