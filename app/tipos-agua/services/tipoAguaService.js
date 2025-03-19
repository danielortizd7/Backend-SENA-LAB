const { TipoAgua, Muestra } = require('../../shared/models/modelMuestras.js');

class TipoAguaService {
    static async obtenerTiposAgua() {
        return await TipoAgua.find().sort({ nombre: 1 });
    }

    static async crearTipoAgua(datos) {
        const tipoAgua = new TipoAgua(datos);
        return await tipoAgua.save();
    }

    static async actualizarTipoAgua(id, datos) {
        return await TipoAgua.findByIdAndUpdate(id, datos, { new: true });
    }

    static async eliminarTipoAgua(id) {
        return await TipoAgua.findByIdAndDelete(id);
    }

    static async obtenerTipoAguaPorId(id) {
        return await TipoAgua.findById(id);
    }

    // Asignar tipo de agua a una muestra
    static async asignarTipoAgua(idMuestra, idTipoAgua) {
        const muestra = await Muestra.findOne({ id_muestra: idMuestra });
        if (!muestra) {
            throw new Error("Muestra no encontrada");
        }

        muestra.tipo_agua = idTipoAgua;
        await muestra.save();
        return muestra;
    }
}

module.exports = TipoAguaService;