const { Auditoria } = require('../../../shared/models/auditoriaModel');
const { ResponseHandler } = require('../../../shared/utils/responseHandler');

class AuditoriaService {
    static async registrarAccion(datosAuditoria) {
        try {
            const registro = new Auditoria({
                usuario: datosAuditoria.usuario,
                accion: datosAuditoria.accion,
                detalles: datosAuditoria.detalles,
                fecha: datosAuditoria.fecha
            });

            await registro.save();
            return registro;
        } catch (error) {
            console.error('Error registrando auditoría:', error);
            throw error;
        }
    }

    static async obtenerRegistros(filtros = {}) {
        try {
            return await Auditoria.find(filtros)
                .sort({ fecha: -1 })
                .lean();
        } catch (error) {
            console.error('Error obteniendo registros de auditoría:', error);
            throw error;
        }
    }
}

module.exports = AuditoriaService;
