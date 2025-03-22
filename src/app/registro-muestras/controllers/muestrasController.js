const { validationResult } = require('express-validator');
const { ResponseHandler } = require('../../../shared/utils/responseHandler');
const { ValidationError, NotFoundError } = require('../../../shared/errors/AppError');
const { Muestra, estadosValidos } = require('../../../shared/models/muestrasModel');
const Usuario = require('../../../shared/models/usuarioModel');
const { generarIdMuestra } = require('../../../shared/utils/generarId');
const mongoose = require('mongoose');

// Obtener todas las muestras
const obtenerMuestras = async (req, res, next) => {
    try {
        const muestras = await Muestra.find()
            .populate('creadoPor', 'nombre email documento')
            .populate('actualizadoPor.usuario', 'nombre email documento')
            .sort({ fechaHora: -1 });
        ResponseHandler.success(res, { muestras }, 'Muestras obtenidas correctamente');
    } catch (error) {
        next(error);
    }
};

// Obtener muestras por tipo de agua
const obtenerMuestrasPorTipo = async (req, res, next) => {
    try {
        const { tipo } = req.params;
        const muestras = await Muestra.find({ 'tipoDeAgua.tipo': tipo })
            .populate('creadoPor', 'nombre email documento')
            .populate('actualizadoPor.usuario', 'nombre email documento')
            .sort({ fechaHora: -1 });
        ResponseHandler.success(res, { muestras }, `Muestras de tipo ${tipo} obtenidas correctamente`);
    } catch (error) {
        next(error);
    }
};

// Obtener muestras por estado
const obtenerMuestrasPorEstado = async (req, res, next) => {
    try {
        const { estado } = req.params;
        if (!estadosValidos.includes(estado)) {
            throw new ValidationError('Estado no válido');
        }

        const muestras = await Muestra.find({
            'historial': {
                $elemMatch: {
                    estado: estado,
                    fechaCambio: {
                        $eq: {
                            $max: '$historial.fechaCambio'
                        }
                    }
                }
            }
        })
        .populate('creadoPor', 'nombre email documento')
        .populate('actualizadoPor.usuario', 'nombre email documento')
        .sort({ fechaHora: -1 });

        ResponseHandler.success(res, { muestras }, `Muestras en estado ${estado} obtenidas correctamente`);
    } catch (error) {
        next(error);
    }
};

// Obtener una muestra por ID
const obtenerMuestra = async (req, res, next) => {
    try {
        const muestra = await Muestra.findOne({ id_muestra: req.params.id })
            .populate('creadoPor', 'nombre email documento')
            .populate('actualizadoPor.usuario', 'nombre email documento');

        if (!muestra) {
            throw new NotFoundError('Muestra no encontrada');
        }
        ResponseHandler.success(res, { muestra }, 'Muestra obtenida correctamente');
    } catch (error) {
        next(error);
    }
};

// Crear una nueva muestra
const crearMuestra = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new ValidationError('Datos inválidos', errors.array());
        }

        // Buscar el usuario en la base de datos y verificar rol
        const usuario = await Usuario.findOne({ email: req.usuario.email });
        if (!usuario) {
            throw new ValidationError('Usuario no encontrado');
        }

        // Verificar que el usuario sea administrador
        if (usuario.rol !== 'administrador') {
            throw new ValidationError('No autorizado. Solo los administradores pueden registrar muestras.');
        }

        const { tipoMuestreo, analisisSeleccionados, tipoDeAgua } = req.body;
        
        // Validaciones básicas
        if (!tipoMuestreo || !analisisSeleccionados || !tipoDeAgua || !tipoDeAgua.tipo) {
            throw new ValidationError('Faltan campos requeridos');
        }

        if (analisisSeleccionados.length === 0) {
            throw new ValidationError('Debe seleccionar al menos un análisis');
        }

        // Validar que el tipo de agua sea válido
        if (!['potable', 'natural', 'residual', 'otra'].includes(tipoDeAgua.tipo)) {
            throw new ValidationError('Tipo de agua no válido');
        }

        // Si es 'otra', debe incluir tipo personalizado
        if (tipoDeAgua.tipo === 'otra' && !tipoDeAgua.tipoPersonalizado) {
            throw new ValidationError('Debe especificar el tipo de agua personalizado');
        }

        // Generar ID automáticamente
        const id_muestra = await generarIdMuestra(Muestra);
        
        // Crear la muestra con datos del usuario autenticado
        const muestra = new Muestra({
            id_muestra,
            tipoMuestreo,
            analisisSeleccionados,
            tipoDeAgua,
            documento: usuario.documento,
            creadoPor: usuario._id,
            historial: [{
                estado: 'Recibida',
                cedulaadministrador: usuario.documento,
                nombreadministrador: usuario.nombre,
                fechaCambio: new Date(),
                observaciones: 'Muestra registrada inicialmente'
            }],
            actualizadoPor: [{
                usuario: usuario._id,
                nombre: usuario.nombre,
                fecha: new Date(),
                accion: 'creación'
            }]
        });
        
        await muestra.save();
        
        // Poblar los datos del usuario antes de enviar la respuesta
        await muestra.populate('creadoPor', 'nombre email documento');
        await muestra.populate('actualizadoPor.usuario', 'nombre email documento');
        
        ResponseHandler.created(res, { muestra }, 'Muestra creada correctamente');
    } catch (error) {
        console.error('Error al crear muestra:', error);
        next(error);
    }
};

// Actualizar una muestra
const actualizarMuestra = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new ValidationError('Datos inválidos', errors.array());
        }

        const muestraExistente = await Muestra.findOne({ id_muestra: req.params.id });
        if (!muestraExistente) {
            throw new NotFoundError('Muestra no encontrada');
        }

        // Si se está actualizando el tipo de agua, validar que sea válido
        if (req.body.tipoDeAgua && req.body.tipoDeAgua.tipo) {
            if (!['potable', 'natural', 'residual', 'otra'].includes(req.body.tipoDeAgua.tipo)) {
                throw new ValidationError('Tipo de agua no válido');
            }
            if (req.body.tipoDeAgua.tipo === 'otra' && !req.body.tipoDeAgua.tipoPersonalizado) {
                throw new ValidationError('Debe especificar el tipo de agua personalizado');
            }
        }

        // Preparar los datos de actualización
        const datosActualizacion = {
            ...req.body,
            $push: {
                actualizadoPor: {
                    usuario: req.usuario.id,
                    nombre: req.usuario.nombre,
                    fecha: new Date(),
                    accion: 'actualización'
                }
            }
        };

        // Si se está actualizando el estado, agregar al historial
        if (req.body.estado) {
            if (!estadosValidos.includes(req.body.estado)) {
                throw new ValidationError('Estado no válido');
            }

            datosActualizacion.$push.historial = {
                estado: req.body.estado,
                cedulaLaboratorista: req.usuario.documento,
                nombreLaboratorista: req.usuario.nombre,
                fechaCambio: new Date(),
                observaciones: req.body.observaciones || 'Actualización de estado'
            };
        }

        const muestra = await Muestra.findOneAndUpdate(
            { id_muestra: req.params.id },
            datosActualizacion,
            { 
                new: true, 
                runValidators: true 
            }
        )
        .populate('creadoPor', 'nombre email documento')
        .populate('actualizadoPor.usuario', 'nombre email documento');

        ResponseHandler.success(res, { muestra }, 'Muestra actualizada correctamente');
    } catch (error) {
        next(error);
    }
};

// Eliminar una muestra
const eliminarMuestra = async (req, res, next) => {
    try {
        const muestra = await Muestra.findOneAndDelete({ id_muestra: req.params.id })
            .populate('creadoPor', 'nombre email documento')
            .populate('actualizadoPor.usuario', 'nombre email documento');
        
        if (!muestra) {
            throw new NotFoundError('Muestra no encontrada');
        }

        ResponseHandler.success(res, { muestra }, 'Muestra eliminada correctamente');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    obtenerMuestras,
    obtenerMuestrasPorTipo,
    obtenerMuestrasPorEstado,
    obtenerMuestra,
    crearMuestra,
    actualizarMuestra,
    eliminarMuestra
}; 