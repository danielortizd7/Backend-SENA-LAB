const { TipoAgua } = require('../../shared/models/modelMuestras.js');

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
}

module.exports = TipoAguaService;