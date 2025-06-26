const { Muestra, estadosValidos } = require('../../../shared/models/muestrasModel');
const Resultado = require('../../ingreso-resultados/models/resultadoModel');
const mongoose = require('mongoose');
const AuditoriaService = require('../../auditoria/services/auditoriaService');
const NotificationService = require('../../notificaciones/services/notificationService');

async function cambiarEstadoMuestra(idMuestra, nuevoEstado, usuario) {
    try {
        // Validar que el estado sea válido
        if (!estadosValidos.includes(nuevoEstado)) {
            throw new Error('Estado no válido');
        }

        // Obtener la muestra (buscar por _id o por id_muestra)
        let muestra;
        
        // Primero intentar buscar por _id (ObjectId)
        if (idMuestra.match(/^[0-9a-fA-F]{24}$/)) {
            muestra = await Muestra.findById(idMuestra);
        } else {
            // Si no es un ObjectId válido, buscar por id_muestra
            muestra = await Muestra.findOne({ id_muestra: idMuestra });
        }
        
        if (!muestra) {
            throw new Error('Muestra no encontrada');
        }

        const estadoAnterior = muestra.estado;        // Validaciones específicas según el estado
        switch (nuevoEstado) {
            case 'En análisis':
                if (estadoAnterior !== 'Recibida') {
                    throw new Error('La muestra debe estar en estado Recibida para pasar a En análisis');
                }
                break;
            case 'Finalizada':
                const resultados = await Resultado.find({ idMuestra: idMuestra });
                if (resultados.length === 0) {
                    throw new Error('No se puede finalizar una muestra sin resultados');
                }
                if (estadoAnterior !== 'En análisis') {
                    throw new Error('La muestra debe estar en análisis para ser finalizada');
                }
                break;
            case 'En Cotizacion':
                if (!muestra.analisisSeleccionados || muestra.analisisSeleccionados.length === 0) {
                    throw new Error('No se puede cotizar una muestra sin análisis seleccionados');
                }
                break;
            case 'Aceptada':
                if (estadoAnterior !== 'En Cotizacion') {
                    throw new Error('Solo se pueden aceptar muestras que estén en cotización');
                }
                break;
            case 'Recibida':
                // Permitir cambio a Recibida desde Aceptada (flujo de cotización)
                if (estadoAnterior === 'Aceptada') {
                    // Este es el flujo normal después de aceptar una cotización
                } else if (estadoAnterior !== 'Pendiente') {
                    throw new Error('Solo se puede cambiar a Recibida desde Pendiente o Aceptada');
                }
                break;
            case 'Rechazada':
                // No necesita validaciones específicas, cualquier muestra puede ser rechazada
                break;
            default:
                throw new Error(`Estado no válido: ${nuevoEstado}`);
        }

        // Actualizar el historial de estados
        muestra.historialEstados.push({
            estado: nuevoEstado,
            estadoAnterior,
            fecha: new Date(),
            usuario: usuario._id,
            observaciones: usuario.observaciones || `Cambio de estado de ${estadoAnterior} a ${nuevoEstado}`
        });

        // Actualizar el estado actual
        muestra.estado = nuevoEstado;

        // Si la muestra es rechazada, actualizar el campo de rechazo
        if (nuevoEstado === 'Rechazada') {
            muestra.rechazoMuestra = {
                rechazada: true,
                motivo: usuario.observaciones || 'Muestra rechazada',
                fechaRechazo: new Date()
            };
        }        // Guardar los cambios
        await muestra.save();        // Registrar en auditoría y enviar notificación
        setImmediate(async () => {
            try {
                // Registrar auditoría
                await AuditoriaService.registrarAccion({
                    usuario: {
                        _id: usuario._id,
                        documento: usuario.documento || 'N/A',
                        nombre: usuario.nombre || 'Usuario',
                        email: usuario.email || 'N/A'
                    },
                    accion: {
                        descripcion: `cambio de estado de ${estadoAnterior} a ${nuevoEstado}`,
                        tipo: 'PUT',
                        modulo: 'cambios-estado',
                        criticidad: nuevoEstado === 'Rechazada' ? 'alta' : 'media'
                    },
                    detalles: {
                        id_muestra: muestra.id_muestra,
                        estadoAnterior: estadoAnterior,
                        estadoNuevo: nuevoEstado,
                        observaciones: usuario.observaciones,
                        muestra: {
                            _id: muestra._id,
                            cliente: muestra.cliente,
                            estado: nuevoEstado,
                            tipoDeAgua: muestra.tipoDeAgua,
                            lugarMuestreo: muestra.lugarMuestreo,
                            fechaHoraMuestreo: muestra.fechaHoraMuestreo
                        }
                    },
                    transicionEstado: {
                        estadoAnterior: estadoAnterior,
                        estadoNuevo: nuevoEstado
                    },
                    fecha: new Date()
                });                // Enviar notificación al cliente si hay información del cliente
                if (muestra.cliente && (muestra.cliente.documento || muestra.cliente._id)) {
                    console.log(`📨 Enviando notificación de cambio de estado:`);
                    console.log(`   - Cliente Documento: ${muestra.cliente.documento}`);
                    console.log(`   - Cliente ID: ${muestra.cliente._id}`);
                    console.log(`   - Cliente: ${muestra.cliente.nombre} (${muestra.cliente.documento})`);
                    console.log(`   - Muestra: ${muestra.id_muestra}`);
                    console.log(`   - Cambio: ${estadoAnterior} → ${nuevoEstado}`);
                    // Usar cliente.documento si existe, si no, fallback a _id
                    const identificadorCliente = muestra.cliente.documento || muestra.cliente._id;
                    await NotificationService.enviarNotificacionCambioEstado(
                        identificadorCliente,
                        muestra.id_muestra,
                        estadoAnterior,
                        nuevoEstado,
                        usuario.observaciones || ''
                    );
                } else {
                    console.warn(`⚠️ No se puede enviar notificación: información de cliente incompleta`);
                    console.log(`   - Cliente en muestra:`, muestra.cliente);
                }
                
            } catch (auditoriaError) {
                console.error('Error al registrar auditoría del cambio de estado:', auditoriaError);
            }
        });

        return {
            success: true,
            message: 'Estado actualizado correctamente',
            muestra
        };
    } catch (error) {
        return {
            success: false,
            message: error.message || 'Error al cambiar el estado de la muestra'
        };
    }
}

/**
 * Función específica para aceptar una cotización
 * Cambia el estado de "En Cotización" -> "Aceptada" solamente
 */
async function aceptarCotizacion(idMuestra, usuario) {
    try {
        // Validar que la muestra esté en cotización
        // Buscar por id_muestra o _id según el formato
        let muestra;
        if (idMuestra.match(/^[0-9a-fA-F]{24}$/)) {
            muestra = await Muestra.findById(idMuestra);
        } else {
            muestra = await Muestra.findOne({ id_muestra: idMuestra });
        }
        
        if (!muestra) {
            throw new Error('Muestra no encontrada');
        }        if (muestra.estado !== 'En Cotizacion') {
            throw new Error('Solo se pueden aceptar muestras que estén en cotización');
        }

        // Solo cambiar a "Aceptada" - el admin decidirá luego si pasa a "Recibida"
        // Crear un ID temporal para el usuario si no tiene uno
        const usuarioConId = {
            ...usuario,
            _id: usuario._id || new mongoose.Types.ObjectId(),
            observaciones: 'Cotización aceptada por el administrador. Pendiente de pasar a recibida.'
        };

        const resultado = await cambiarEstadoMuestra(idMuestra, 'Aceptada', usuarioConId);

        if (resultado.success) {
            return {
                success: true,
                message: 'Cotización aceptada exitosamente. La muestra está en estado Aceptada y puede ser pasada a Recibida cuando esté lista.',
                muestra: resultado.muestra
            };
        } else {
            throw new Error(resultado.message);
        }
    } catch (error) {
        throw new Error(`Error al aceptar cotización: ${error.message}`);
    }
}

module.exports = {
    cambiarEstadoMuestra,
    aceptarCotizacion
};
