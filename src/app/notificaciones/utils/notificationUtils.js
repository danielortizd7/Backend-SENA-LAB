const { Muestra } = require('../../shared/models/muestrasModel');
const DeviceToken = require('../notificaciones/models/deviceTokenModel');

class NotificationUtils {
    
    /**
     * Verificar que una muestra tenga información completa del cliente para notificaciones
     * @param {string} muestraId - ID de la muestra (id_muestra o _id)
     * @returns {Object} Información del cliente y estado de tokens
     */
    static async verificarClienteParaNotificaciones(muestraId) {
        try {
            // Buscar muestra por id_muestra o _id
            let muestra;
            if (muestraId.match(/^[0-9a-fA-F]{24}$/)) {
                muestra = await Muestra.findById(muestraId);
            } else {
                muestra = await Muestra.findOne({ id_muestra: muestraId });
            }

            if (!muestra) {
                return {
                    success: false,
                    error: 'Muestra no encontrada'
                };
            }

            // Verificar información del cliente
            if (!muestra.cliente || !muestra.cliente._id) {
                return {
                    success: false,
                    error: 'La muestra no tiene información del cliente',
                    muestra: {
                        id_muestra: muestra.id_muestra,
                        cliente: muestra.cliente
                    }
                };
            }

            // Buscar tokens activos del cliente
            const tokensActivos = await DeviceToken.find({
                clienteId: muestra.cliente._id,
                isActive: true
            });

            return {
                success: true,
                cliente: {
                    _id: muestra.cliente._id,
                    documento: muestra.cliente.documento,
                    nombre: muestra.cliente.nombre,
                    email: muestra.cliente.email
                },
                muestra: {
                    id_muestra: muestra.id_muestra,
                    estado: muestra.estado
                },
                tokens: {
                    total: tokensActivos.length,
                    plataformas: tokensActivos.map(t => t.platform),
                    dispositivos: tokensActivos.map(t => ({
                        platform: t.platform,
                        lastUsed: t.lastUsed,
                        tokenPreview: t.deviceToken.substring(0, 20) + '...'
                    }))
                },
                puedeRecibirNotificaciones: tokensActivos.length > 0
            };

        } catch (error) {
            console.error('Error verificando cliente para notificaciones:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Buscar todos los clientes que tienen tokens activos
     * @returns {Array} Lista de clientes con tokens activos
     */
    static async obtenerClientesConTokensActivos() {
        try {
            const clientesConTokens = await DeviceToken.aggregate([
                { $match: { isActive: true } },
                {
                    $group: {
                        _id: '$clienteId',
                        documento: { $first: '$clienteDocumento' },
                        totalTokens: { $sum: 1 },
                        plataformas: { $addToSet: '$platform' },
                        ultimoUso: { $max: '$lastUsed' }
                    }
                },
                { $sort: { ultimoUso: -1 } }
            ]);

            return clientesConTokens;
        } catch (error) {
            console.error('Error obteniendo clientes con tokens activos:', error);
            return [];
        }
    }

    /**
     * Limpiar tokens inactivos antiguos
     * @param {number} diasInactividad - Días de inactividad para considerar token obsoleto
     */
    static async limpiarTokensAntiguos(diasInactividad = 30) {
        try {
            const fechaLimite = new Date();
            fechaLimite.setDate(fechaLimite.getDate() - diasInactividad);

            const resultado = await DeviceToken.deleteMany({
                $or: [
                    { isActive: false },
                    { lastUsed: { $lt: fechaLimite } }
                ]
            });

            console.log(`🧹 Limpieza de tokens: ${resultado.deletedCount} tokens eliminados`);
            return resultado.deletedCount;
        } catch (error) {
            console.error('Error limpiando tokens antiguos:', error);
            return 0;
        }
    }

    /**
     * Obtener estadísticas de notificaciones
     */
    static async obtenerEstadisticasNotificaciones() {
        try {
            const [
                totalTokensActivos,
                clientesConTokens,
                distribucionPlataformas
            ] = await Promise.all([
                DeviceToken.countDocuments({ isActive: true }),
                DeviceToken.distinct('clienteId', { isActive: true }),
                DeviceToken.aggregate([
                    { $match: { isActive: true } },
                    { $group: { _id: '$platform', count: { $sum: 1 } } }
                ])
            ]);

            return {
                totalTokensActivos,
                totalClientesConTokens: clientesConTokens.length,
                distribucionPlataformas: distribucionPlataformas.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {})
            };
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            return null;
        }
    }
}

module.exports = NotificationUtils;
