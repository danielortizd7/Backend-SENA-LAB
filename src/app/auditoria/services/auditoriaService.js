const mongoose = require('mongoose');
const Auditoria = require('../models/auditoriaModel');
const { ResponseHandler } = require('../../../shared/utils/responseHandler');
const AuditoriaMuestras = require('../models/auditoriaModelMuestras');

class AuditoriaService {
    static async registrarAccion(datosAuditoria) {
        try {
            const registro = new Auditoria({
                usuario: datosAuditoria.usuario,
                accion: datosAuditoria.accion,
                detalles: {
                    ...datosAuditoria.detalles,
                    idMuestra: datosAuditoria.detalles.idMuestra || null
                },
                fecha: datosAuditoria.fecha
            });

            await registro.save();
            return registro;
        } catch (error) {
            console.error('Error registrando auditoría:', error);
            throw error;
        }
    }

    static async registrarAccionMuestra(datosAuditoria) {
        try {
            const auditoriaData = {
                usuario: datosAuditoria.usuario,
                accion: {
                    tipo: datosAuditoria.metodo,
                   // ruta: datosAuditoria.ruta,
                    descripcion: datosAuditoria.descripcion
                },
                muestra: {
                    id: datosAuditoria.idMuestra,
                    tipo: datosAuditoria.tipoMuestra,
                    estado: datosAuditoria.estadoMuestra,
                    datosCompletos: datosAuditoria.datosCompletos
                },
               /* cambios: datosAuditoria.cambios,
                metadata: {
                    ip: datosAuditoria.ip,
                    userAgent: datosAuditoria.userAgent
                }*/
            };

            return await AuditoriaMuestras.create(auditoriaData);
        } catch (error) {
            console.error('Error registrando auditoría de muestra:', error);
            // Fallback al sistema general si falla
            return await Auditoria.create({
                ...datosAuditoria,
                tipo: 'MUESTRA_FALLBACK'
            });
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

    static async obtenerRegistroAuditoria(id) {
        try {
            if (!id || !mongoose.Types.ObjectId.isValid(id)) {
                throw new Error(`ID de auditoría inválido: ${id}. Debe ser un ObjectId válido de 24 caracteres hexadecimales`);
            }
            return await Auditoria.findById(id).lean();
        } catch (error) {
            console.error('Error obteniendo registro de auditoría:', error);
            throw error;
        }
    }

    static async filtrarRegistros(filtros = {}) {
        // Limpiar objeto de filtros de valores undefined
        const filtrosLimpios = Object.fromEntries(
            Object.entries(filtros).filter(([_, v]) => v !== undefined)
        );
        try {
            const query = {};
            
            if (filtros.fechaInicio && filtros.fechaFin) {
                query.fecha = {
                    $gte: new Date(filtros.fechaInicio),
                    $lte: new Date(filtros.fechaFin)
                };
            }

            if (filtros.usuario) {
                query['usuario.documento'] = filtros.usuario;
            }

            if (filtros.accion) {
                query['accion.tipo'] = filtros.accion;
            }

            return await this.obtenerRegistros(query);
        } catch (error) {
            console.error('Error filtrando registros de auditoría:', error);
            throw error;
        }
    }
}

module.exports = AuditoriaService;
