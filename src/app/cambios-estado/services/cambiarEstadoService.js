const { Muestra, estadosValidos } = require('../../../shared/models/muestrasModel');
const Resultado = require('../../ingreso-resultados/models/resultadoModel');

async function cambiarEstadoMuestra(idMuestra, nuevoEstado, usuario) {
    try {
        // Validar que el estado sea válido
        if (!estadosValidos.includes(nuevoEstado)) {
            throw new Error('Estado no válido');
        }

        // Obtener la muestra
        const muestra = await Muestra.findById(idMuestra);
        if (!muestra) {
            throw new Error('Muestra no encontrada');
        }

        const estadoAnterior = muestra.estado;

        // Validaciones específicas según el estado
        switch (nuevoEstado) {
            case 'En Proceso':
                if (estadoAnterior !== 'Recibida') {
                    throw new Error('La muestra debe estar en estado Recibida para pasar a En Proceso');
                }
                break;
            case 'Finalizada':
                const resultados = await Resultado.find({ idMuestra: idMuestra });
                if (resultados.length === 0) {
                    throw new Error('No se puede finalizar una muestra sin resultados');
                }
                if (estadoAnterior !== 'En Proceso') {
                    throw new Error('La muestra debe estar en proceso para ser finalizada');
                }
                break;
            case 'Cotizada':
                if (!muestra.analisisSeleccionados || muestra.analisisSeleccionados.length === 0) {
                    throw new Error('No se puede cotizar una muestra sin análisis seleccionados');
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
        }

        // Guardar los cambios
        await muestra.save();

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

module.exports = {
    cambiarEstadoMuestra
};
