const { Muestra } = require('../../../shared/models/muestrasModel');
const { NotFoundError, DatabaseError } = require('../../../shared/errors/AppError');

// Obtener todas las muestras
const obtenerMuestras = async () => {
    try {
        const muestras = await Muestra.find()
            .sort({ fechaHora: -1 });
        return muestras;
    } catch (error) {
        throw new DatabaseError('Error al obtener las muestras', error);
    }
};

// Obtener una muestra por ID
const obtenerMuestra = async (id) => {
    try {
        const muestra = await Muestra.findOne({ id_muestra: id });
        
        if (!muestra) {
            throw new NotFoundError('Muestra no encontrada');
        }
        return muestra;
    } catch (error) {
        if (error instanceof NotFoundError) {
            throw error;
        }
        throw new DatabaseError('Error al obtener la muestra', error);
    }
};

// Crear una nueva muestra
const crearMuestra = async (datosMuestra) => {
    try {
        const muestra = new Muestra(datosMuestra);
        await muestra.save();
        return muestra;
    } catch (error) {
        throw new DatabaseError('Error al crear la muestra', error);
    }
};

// Actualizar una muestra
const actualizarMuestra = async (id, datosActualizacion) => {
    try {
        const muestra = await Muestra.findOneAndUpdate(
            { id_muestra: id },
            datosActualizacion,
            { 
                new: true, 
                runValidators: true
            }
        );

        if (!muestra) {
            throw new NotFoundError('Muestra no encontrada');
        }
        return muestra;
    } catch (error) {
        if (error instanceof NotFoundError) {
            throw error;
        }
        throw new DatabaseError('Error al actualizar la muestra', error);
    }
};

// Eliminar una muestra
const eliminarMuestra = async (id) => {
    try {
        const muestra = await Muestra.findOneAndDelete({ id_muestra: id });
        
        if (!muestra) {
            throw new NotFoundError('Muestra no encontrada');
        }
        return muestra;
    } catch (error) {
        if (error instanceof NotFoundError) {
            throw error;
        }
        throw new DatabaseError('Error al eliminar la muestra', error);
    }
};

// Obtener muestras por tipo
const obtenerMuestrasPorTipo = async (tipo) => {
    try {
        const muestras = await Muestra.find({ 'tipoDeAgua.tipo': tipo })
            .sort({ fechaHora: -1 });
        return muestras;
    } catch (error) {
        throw new DatabaseError('Error al obtener las muestras por tipo', error);
    }
};

// Obtener muestras por estado
const obtenerMuestrasPorEstado = async (estado) => {
    try {
        const muestras = await Muestra.find({ 'historial.estado': estado })
            .sort({ fechaHora: -1 });
        return muestras;
    } catch (error) {
        throw new DatabaseError('Error al obtener las muestras por estado', error);
    }
};

module.exports = {
    obtenerMuestras,
    obtenerMuestra,
    crearMuestra,
    actualizarMuestra,
    eliminarMuestra,
    obtenerMuestrasPorTipo,
    obtenerMuestrasPorEstado
}; 