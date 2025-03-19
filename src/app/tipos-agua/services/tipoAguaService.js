const { TipoAgua, Muestra } = require("../../../shared/models/muestrasModel");

class TipoAguaService {
    static async asignarAMuestra(idMuestra, datos) {
        try {
            if (!datos.tipoDeAgua) {
                throw new Error("El tipo de agua es obligatorio.");
            }

            let tipoAgua;

            if (datos.tipoDeAgua === "otra") {
                if (!datos.tipoPersonalizado || !datos.descripcion) {
                    throw new Error("Para tipo 'otra', se requiere tipo personalizado y descripción.");
                }
                tipoAgua = new TipoAgua({
                    tipoDeAgua: datos.tipoDeAgua,
                    tipoPersonalizado: datos.tipoPersonalizado.trim(),
                    descripcion: datos.descripcion
                });
                await tipoAgua.save();
            } else {
                tipoAgua = await TipoAgua.findOne({ tipoDeAgua: datos.tipoDeAgua });
                if (!tipoAgua) {
                    throw new Error("Tipo de agua no encontrado.");
                }
            }

            const muestra = await Muestra.findOneAndUpdate(
                { id_muestra: idMuestra },
                { tipoDeAgua: tipoAgua._id },
                { new: true }
            ).populate('tipoDeAgua');

            if (!muestra) {
                throw new Error("Muestra no encontrada.");
            }

            return {
                mensaje: "Tipo de agua asignado correctamente",
                muestra
            };

        } catch (error) {
            console.error("Error en asignarTipoAgua:", error);
            throw new Error(`Error al asignar tipo de agua: ${error.message}`);
        }
    }

    static async actualizarTipoAguaMuestra(idMuestra, datos) {
        try {
            if (!datos.tipoDeAgua) {
                throw new Error("El tipo de agua es obligatorio.");
            }

            let tipoAgua;

            if (datos.tipoDeAgua === "otra") {
                if (!datos.tipoPersonalizado || !datos.descripcion) {
                    throw new Error("Para tipo 'otra', se requiere tipo personalizado y descripción.");
                }
                tipoAgua = new TipoAgua({
                    tipoDeAgua: datos.tipoDeAgua,
                    tipoPersonalizado: datos.tipoPersonalizado.trim(),
                    descripcion: datos.descripcion
                });
                await tipoAgua.save();
            } else {
                tipoAgua = await TipoAgua.findOne({ tipoDeAgua: datos.tipoDeAgua });
                if (!tipoAgua) {
                    throw new Error("Tipo de agua no encontrado.");
                }
            }

            const muestra = await Muestra.findOneAndUpdate(
                { id_muestra: idMuestra },
                { tipoDeAgua: tipoAgua._id },
                { new: true }
            ).populate('tipoDeAgua');

            if (!muestra) {
                throw new Error("Muestra no encontrada.");
            }

            return {
                mensaje: "Tipo de agua actualizado correctamente",
                muestra
            };

        } catch (error) {
            console.error("Error en actualizarTipoAgua:", error);
            throw new Error(`Error al actualizar tipo de agua: ${error.message}`);
        }
    }
}

module.exports = TipoAguaService;