const { validationResult } = require('express-validator');
const Resultado = require("../models/resultadoModel");
const mongoose = require("mongoose");
const ResponseHandler = require("../../../shared/utils/responseHandler");
const { NotFoundError, ValidationError, AuthorizationError } = require("../../../shared/errors/AppError");
const { Muestra } = require("../../../shared/models/muestrasModel");
const { formatPaginationResponse } = require("../../../shared/middleware/paginationMiddleware");
const Analisis = require("../../../shared/models/analisisModel");
const resultadoService = require("../services/resultadoService");
const AuditoriaService = require('../../auditoria/services/auditoriaService');

// Función para formatear fechas en zona horaria colombiana
const formatearFechaHora = (fecha) => {
    if (!fecha) return null;
    
    try {
        // Crear fecha y ajustar a zona horaria de Colombia (UTC-5)
        const fechaUTC = new Date(fecha);
        const fechaColombia = new Date(fechaUTC.getTime() - (5 * 60 * 60 * 1000));
        
        // Formatear fecha
        const dia = fechaColombia.getUTCDate().toString().padStart(2, '0');
        const mes = (fechaColombia.getUTCMonth() + 1).toString().padStart(2, '0');
        const año = fechaColombia.getUTCFullYear();
        
        // Formatear hora en formato 12 horas con AM/PM
        let horas = fechaColombia.getUTCHours();
        const minutos = fechaColombia.getUTCMinutes().toString().padStart(2, '0');
        const segundos = fechaColombia.getUTCSeconds().toString().padStart(2, '0');
        const ampm = horas >= 12 ? 'PM' : 'AM';
        
        // Convertir a formato 12 horas
        horas = horas % 12;
        horas = horas ? horas : 12; // si es 0, convertir a 12
        horas = horas.toString().padStart(2, '0');
        
        return {
            fecha: `${dia}/${mes}/${año}`,
            hora: `${horas}:${minutos}:${segundos} ${ampm}`
        };
    } catch (error) {
        console.error('Error al formatear fecha:', error);
        return null;
    }
};

const registrarResultado = async (req, res) => {
    try {
        const { idMuestra } = req.params;
        const { resultados, observaciones } = req.body;
        const usuario = req.usuario;

        // Validar rol de laboratorista
        if (usuario.rol !== 'laboratorista') {
            return res.status(403).json({
                success: false,
                message: 'No tiene permisos para registrar resultados. Solo los laboratoristas pueden realizar esta acción.',
                errorCode: 'AUTHORIZATION_ERROR'
            });
        }

        // Validar estructura básica de la petición
        if (!resultados || typeof resultados !== 'object' || Array.isArray(resultados)) {
            return res.status(400).json({
                success: false,
                message: 'Los resultados deben ser un objeto con los análisis y sus valores',
                errorCode: 'VALIDATION_ERROR'
            });
        }

        // Obtener la muestra para tener los datos completos
        const muestra = await Muestra.findOne({ id_muestra: idMuestra }).lean();
        if (!muestra) {
            return res.status(404).json({
                success: false,
                message: 'Muestra no encontrada',
                errorCode: 'NOT_FOUND'
            });
        }

        // Crear fecha actual para todos los timestamps
        const fechaActual = new Date();

        // Preparar datos para el servicio
        const datosResultado = {
            idMuestra,
            cliente: {
                documento: muestra.cliente.documento,
                nombre: muestra.cliente.nombre
            },
            tipoDeAgua: muestra.tipoDeAgua,
            lugarMuestreo: muestra.lugarMuestreo,
            fechaHoraMuestreo: muestra.fechaHoraMuestreo,
            tipoAnalisis: muestra.tipoAnalisis,
            estado: muestra.estado,
            resultados,
            observaciones,
            verificado: false,
            cedulaLaboratorista: usuario.documento,
            nombreLaboratorista: usuario.nombre,
            historialCambios: [{
                nombre: usuario.nombre,
                cedula: usuario.documento,
                fecha: fechaActual,
                observaciones: observaciones || 'Registro inicial de resultados',
                cambiosRealizados: { resultados }
            }],
            createdAt: fechaActual,
            updatedAt: fechaActual
        };

        // Usar el servicio para registrar el resultado
        const resultado = await resultadoService.registrarResultado(datosResultado);

         // Registrar auditoría de registro de muestra
         setImmediate(async () => {
            try {
                await AuditoriaService.registrarAccionMuestra({
                    usuario,
                    metodo: 'POST',
                    descripcion: 'Registro de resultado y muestra',
                    idMuestra,
                    tipoMuestra: resultado.tipoDeAgua,
                    estadoMuestra: resultado.estado,
                    datosCompletos: resultado
                });
            } catch (error) {
                console.error('[AUDITORIA ERROR]', error.message);
            }
        });

        // Obtener el resultado recién creado con todos los datos
        const resultadoGuardado = await Resultado.findById(resultado._id)
            .lean();

        if (!resultadoGuardado) {
            throw new Error('Error al recuperar el resultado guardado');
        }

        // Formatear el resultado para la respuesta
        const resultadoFormateado = {
            _id: resultadoGuardado._id,
            idMuestra: resultadoGuardado.idMuestra,
            cliente: {
                documento: resultadoGuardado.cliente.documento,
                nombre: resultadoGuardado.cliente.nombre
            },
            tipoDeAgua: resultadoGuardado.tipoDeAgua,
            lugarMuestreo: resultadoGuardado.lugarMuestreo,
            fechaHoraMuestreo: formatearFechaHora(resultadoGuardado.fechaHoraMuestreo),
            tipoAnalisis: resultadoGuardado.tipoAnalisis,
            estado: resultadoGuardado.estado,
            resultados: resultadoGuardado.resultados,
            observaciones: resultadoGuardado.observaciones,
            verificado: resultadoGuardado.verificado,
            cedulaLaboratorista: resultadoGuardado.cedulaLaboratorista,
            nombreLaboratorista: resultadoGuardado.nombreLaboratorista,
            historialCambios: resultadoGuardado.historialCambios.map(cambio => ({
                nombre: cambio.nombre,
                cedula: cambio.cedula,
                fecha: formatearFechaHora(cambio.fecha),
                observaciones: cambio.observaciones,
                cambiosRealizados: cambio.cambiosRealizados
            })),
            createdAt: formatearFechaHora(resultadoGuardado.createdAt),
            updatedAt: formatearFechaHora(resultadoGuardado.updatedAt)
        };

        return res.status(200).json({
            success: true,
            message: 'Resultados registrados exitosamente',
            data: resultadoFormateado
        });

    } catch (error) {
        console.error('Error al registrar resultados:', error);
        return res.status(error instanceof ValidationError ? 400 : 500).json({
            success: false,
            message: error.message,
            errorCode: error instanceof ValidationError ? 'VALIDATION_ERROR' : 'SERVER_ERROR'
        });
    }
};

const editarResultado = async (req, res) => {
    try {
        const { idMuestra } = req.params;
        const { resultados, observaciones } = req.body;
        const usuario = req.usuario;

        // Validar rol de laboratorista
        if (usuario.rol !== 'laboratorista') {
            return res.status(403).json({
                success: false,
                message: 'No tiene permisos para editar resultados. Solo los laboratoristas pueden realizar esta acción.',
                errorCode: 'AUTHORIZATION_ERROR'
            });
        }

        // Buscar el resultado y la muestra
        const [resultado, muestra] = await Promise.all([
            Resultado.findOne({ idMuestra }),
            Muestra.findOne({ id_muestra: idMuestra })
        ]);

        if (!resultado || !muestra) {
            return res.status(404).json({
                success: false,
                message: 'Resultado o muestra no encontrada',
                errorCode: 'NOT_FOUND'
            });
        }

        
        // Guardar valores anteriores para auditoría
        const valoresAnteriores = resultado.toObject();


        // Obtener información de los análisis
        const analisisInfo = await Analisis.find({
            nombre: { $in: Object.keys(resultados) }
        });

        const analisisMap = analisisInfo.reduce((acc, analisis) => {
            acc[analisis.nombre] = analisis;
            return acc;
        }, {});

        // Validar y procesar los nuevos resultados
        const cambiosRealizados = {};
        
        for (const [nombre, datos] of Object.entries(resultados)) {
            const analisis = analisisMap[nombre];
            if (!analisis) {
                return res.status(400).json({
                    success: false,
                    message: `El análisis ${nombre} no existe en la base de datos`,
                    errorCode: 'VALIDATION_ERROR'
                });
            }

            // Obtener el valor anterior
            const valorAnteriorObj = resultado.resultados.get(nombre);
            const valorAnterior = valorAnteriorObj ? 
                `${valorAnteriorObj.valor} ${valorAnteriorObj.unidad}` : 
                "No registrado";

            // Validar el nuevo valor
            if (analisis.rango && analisis.rango !== 'Ausencia/Presencia') {
                const valor = Number(datos.valor);
                
                if (isNaN(valor)) {
                    return res.status(400).json({
                        success: false,
                        message: `El valor para ${nombre} debe ser numérico`,
                        errorCode: 'VALIDATION_ERROR'
                    });
                }
            }

            // Actualizar el valor
            resultado.resultados.set(nombre, {
                valor: datos.valor,
                unidad: datos.unidad,
                metodo: analisis.metodo,
                tipo: analisis.tipo
            });

            // Registrar el cambio
            cambiosRealizados[nombre] = {
                valorAnterior,
                valorNuevo: `${datos.valor} ${datos.unidad}`,
                unidad: datos.unidad,
                metodo: analisis.metodo
            };
        }

        resultado.observaciones = observaciones;
        resultado.verificado = false;

        // Agregar al historial de cambios
        resultado.historialCambios.push({
            _id: new mongoose.Types.ObjectId(),
            nombre: usuario.nombre,
            cedula: usuario.documento,
            fecha: new Date(),
            observaciones: observaciones || "Sin observaciones",
            cambiosRealizados: {
                resultados: cambiosRealizados
            }
        });

        await resultado.save();

         // Registrar auditoría con valores anteriores y nuevos
         setImmediate(async () => {
            try {
                await AuditoriaService.registrarAccion({
                    usuario,
                    accion: {
                        tipo: 'PUT',
                        descripcion: 'Actualización de resultado'
                    },
                    detalles: {
                        idMuestra,
                        cambios: {
                            antes: valoresAnteriores,
                            despues: resultado.toObject()
                        }
                    },
                    fecha: new Date()
                });
            } catch (error) {
                console.error('[AUDITORIA ERROR]', error.message);
            }
        });


        // Formatear el resultado para la respuesta
        const resultadoFormateado = {
            _id: resultado._id,
            idMuestra: resultado.idMuestra,
            cliente: {
                _id: muestra.cliente._id,
                nombre: muestra.cliente.nombre,
                documento: muestra.cliente.documento,
                email: muestra.cliente.email,
                telefono: muestra.cliente.telefono,
                direccion: muestra.cliente.direccion
            },
            tipoDeAgua: muestra.tipoDeAgua,
            lugarMuestreo: muestra.lugarMuestreo,
            fechaHoraMuestreo: formatearFechaHora(muestra.fechaHoraMuestreo),
            tipoAnalisis: muestra.tipoAnalisis,
            estado: muestra.estado,
            resultados: Object.fromEntries(resultado.resultados),
            observaciones: resultado.observaciones,
            verificado: resultado.verificado,
            cedulaLaboratorista: resultado.cedulaLaboratorista,
            nombreLaboratorista: resultado.nombreLaboratorista,
            historialCambios: resultado.historialCambios.map(cambio => ({
                _id: cambio._id,
                nombre: cambio.nombre,
                cedula: cambio.cedula,
                fecha: formatearFechaHora(cambio.fecha),
                observaciones: cambio.observaciones,
                cambiosRealizados: cambio.cambiosRealizados
            })),
            createdAt: formatearFechaHora(resultado.createdAt),
            updatedAt: formatearFechaHora(resultado.updatedAt)
        };

        return res.status(200).json({
            success: true,
            message: 'Resultado actualizado exitosamente',
            data: resultadoFormateado
        });

    } catch (error) {
        console.error('Error al editar resultado:', error);
        return res.status(error instanceof ValidationError ? 400 : 500).json({
            success: false,
            message: error.message,
            errorCode: error instanceof ValidationError ? 'VALIDATION_ERROR' : 'SERVER_ERROR'
        });
    }
};

const obtenerResultados = async (req, res) => {
    try {
        // Configurar el ordenamiento
        const sort = {};
        sort[req.pagination.sortBy] = req.pagination.sortOrder === 'desc' ? -1 : 1;

        // Ejecutar las consultas en paralelo
        const [resultados, total] = await Promise.all([
            Resultado.find()
                .select('-__v')
                .sort(sort)
                .skip(req.pagination.skip)
                .limit(req.pagination.limit)
                .lean(),
            Resultado.countDocuments()
        ]);

        // Formatear las fechas en cada resultado
        const resultadosFormateados = resultados.map(resultado => {
            return {
                ...resultado,
                fechaHoraMuestreo: formatearFechaHora(resultado.fechaHoraMuestreo),
                createdAt: formatearFechaHora(resultado.createdAt),
                updatedAt: formatearFechaHora(resultado.updatedAt),
                historialCambios: resultado.historialCambios?.map(cambio => ({
                    ...cambio,
                    fecha: formatearFechaHora(cambio.fecha)
                })) || []
            };
        });

        // Formatear la respuesta con paginación
        const respuesta = formatPaginationResponse(
            resultadosFormateados,
            total,
            req.pagination
        );

        return res.status(200).json({
            success: true,
            data: respuesta
        });
    } catch (error) {
        console.error('Error al obtener resultados:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener los resultados',
            error: error.message
        });
    }
};

const obtenerResultado = async (req, res) => {
    try {
        const { idMuestra } = req.params;
        const resultado = await Resultado.findOne({ idMuestra });

        if (!resultado) {
            return res.status(404).json({
                success: false,
                message: 'Resultado no encontrado',
                errorCode: 'NOT_FOUND'
            });
        }

        // Formatear las fechas en la respuesta
        const resultadoFormateado = {
            ...resultado.toObject(),
            fechaHoraMuestreo: formatearFechaHora(resultado.fechaHoraMuestreo),
            createdAt: formatearFechaHora(resultado.createdAt),
            updatedAt: formatearFechaHora(resultado.updatedAt),
            historialCambios: resultado.historialCambios.map(cambio => ({
                ...cambio,
                fecha: formatearFechaHora(cambio.fecha)
            }))
        };

        return res.status(200).json({
            success: true,
            data: resultadoFormateado
        });
    } catch (error) {
        console.error('Error al obtener resultado:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener el resultado',
            error: error.message
        });
    }
};

const obtenerResultadoPorMuestra = async (req, res) => {
    try {
        const { idMuestra } = req.params;
        const resultado = await Resultado.findOne({ idMuestra })
            .select('-__v')
            .lean();

        if (!resultado) {
            return res.status(404).json({
                success: false,
                message: 'No hay resultados registrados para esta muestra',
                errorCode: 'NOT_FOUND'
            });
        }

        // Formatear todas las fechas en el resultado
        const resultadoFormateado = {
            ...resultado,
            fechaHoraMuestreo: formatearFechaHora(resultado.fechaHoraMuestreo),
            createdAt: formatearFechaHora(resultado.createdAt),
            updatedAt: formatearFechaHora(resultado.updatedAt),
            historialCambios: resultado.historialCambios?.map(cambio => ({
                ...cambio,
                fecha: formatearFechaHora(cambio.fecha)
            })) || []
        };

        return res.status(200).json({
            success: true,
            data: resultadoFormateado
        });
    } catch (error) {
        console.error('Error al obtener resultado por muestra:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener el resultado',
            error: error.message
        });
    }
};

const verificarResultado = async (req, res) => {
    try {
        const { idResultado } = req.params;
        const usuario = req.usuario;

        // Verificar que el usuario tiene permisos de administrador
        if (!usuario.roles.includes('admin')) {
            throw new ValidationError('No tiene permisos para verificar resultados');
        }

        const resultado = await resultadoService.verificarResultado(idResultado, usuario);
        
        ResponseHandler.success(res, {
            mensaje: 'Resultado verificado exitosamente',
            resultado
        });
    } catch (error) {
        ResponseHandler.error(res, error);
    }
};

const obtenerTodosResultados = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const options = {
            skip: (page - 1) * limit,
            limit: parseInt(limit),
            sort: { createdAt: -1 }
        };

        const [resultados, total] = await Promise.all([
            Resultado.find()
                .select('-__v')
                .skip(options.skip)
                .limit(options.limit)
                .sort(options.sort)
                .lean(),
            Resultado.countDocuments()
        ]);

        // Formatear las fechas en cada resultado
        const resultadosFormateados = resultados.map(resultado => {
            return {
                ...resultado,
                fechaHoraMuestreo: formatearFechaHora(resultado.fechaHoraMuestreo),
                createdAt: formatearFechaHora(resultado.createdAt),
                updatedAt: formatearFechaHora(resultado.updatedAt),
                historialCambios: resultado.historialCambios?.map(cambio => ({
                    ...cambio,
                    fecha: formatearFechaHora(cambio.fecha)
                })) || []
            };
        });

        return res.status(200).json({
            success: true,
            data: resultadosFormateados,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Error al obtener todos los resultados:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener los resultados',
            error: error.message
        });
    }
};

const eliminarResultado = async (req, res) => {
    try {
        const { idResultado } = req.params;
        await resultadoService.eliminarResultado(idResultado);
        
        ResponseHandler.success(res, {
            mensaje: 'Resultado eliminado exitosamente'
        });
    } catch (error) {
        ResponseHandler.error(res, error);
    }
};

const obtenerResultadosPorMuestra = async (req, res) => {
    try {
        const { idMuestra } = req.params;
        const resultados = await resultadoService.obtenerResultadosPorMuestra(idMuestra);
        
        ResponseHandler.success(res, {
            resultados
        });
    } catch (error) {
        ResponseHandler.error(res, error);
    }
};

const actualizarResultado = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new ValidationError('Error de validación', errors.array());
        }

        const { idResultado } = req.params;
        const datosActualizacion = req.body;
        const usuario = req.usuario;

        const resultado = await resultadoService.actualizarResultado(idResultado, datosActualizacion, usuario);
        
        ResponseHandler.success(res, {
            mensaje: 'Resultado actualizado exitosamente',
            resultado
        });
    } catch (error) {
        ResponseHandler.error(res, error);
    }
};

const obtenerResultadoPorId = async (req, res) => {
    try {
        const { idResultado } = req.params;
        const resultado = await resultadoService.obtenerResultadoPorId(idResultado);
        
        ResponseHandler.success(res, {
            resultado
        });
    } catch (error) {
        ResponseHandler.error(res, error);
    }
};

const obtenerResultadosPorCliente = async (req, res) => {
    try {
        const { documento } = req.params;
        
        if (!documento) {
            return res.status(400).json({
                success: false,
                message: 'El identificador del cliente es requerido',
                errorCode: 'VALIDATION_ERROR'
            });
        }

        console.log('Buscando resultados para el cliente:', documento);

        // Buscar todas las muestras del cliente (por documento o por ID)
        const query = mongoose.isValidObjectId(documento) 
            ? { 'cliente._id': new mongoose.Types.ObjectId(documento) }
            : { 'cliente.documento': documento };

        // Buscar todas las muestras del cliente
        const muestras = await Muestra.find(query)
            .select('_id id_muestra cliente tipoDeAgua lugarMuestreo fechaHoraMuestreo tipoAnalisis estado')
            .lean();

        console.log('Muestras encontradas:', muestras.length);

        if (!muestras || muestras.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No se encontraron muestras para este cliente',
                errorCode: 'NOT_FOUND'
            });
        }

        // Obtener los IDs de las muestras
        const idsMuestras = muestras.map(muestra => muestra.id_muestra);
        console.log('IDs de muestras a buscar:', idsMuestras);

        // Buscar los resultados de las muestras
        const resultados = await Resultado.find({ idMuestra: { $in: idsMuestras } })
            .lean();

        console.log('Resultados encontrados:', resultados.length);

        if (!resultados || resultados.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No se encontraron resultados para las muestras del cliente',
                errorCode: 'NOT_FOUND'
            });
        }

        // Formatear la respuesta
        const resultadosFormateados = resultados.map(resultado => {
            const muestraCorrespondiente = muestras.find(m => m.id_muestra === resultado.idMuestra);
            
            if (!muestraCorrespondiente) {
                console.log('No se encontró muestra correspondiente para el resultado:', resultado.idMuestra);
                return null;
            }

            return {
                _id: resultado._id,
                idMuestra: resultado.idMuestra,
                muestra: {
                    _id: muestraCorrespondiente._id,
                    id_muestra: muestraCorrespondiente.id_muestra,
                    cliente: {
                        _id: muestraCorrespondiente.cliente._id,
                        nombre: muestraCorrespondiente.cliente.nombre,
                        documento: muestraCorrespondiente.cliente.documento,
                        email: muestraCorrespondiente.cliente.email,
                        telefono: muestraCorrespondiente.cliente.telefono,
                        direccion: muestraCorrespondiente.cliente.direccion
                    },
                    tipoDeAgua: muestraCorrespondiente.tipoDeAgua,
                    lugarMuestreo: muestraCorrespondiente.lugarMuestreo,
                    fechaHoraMuestreo: formatearFechaHora(muestraCorrespondiente.fechaHoraMuestreo),
                    tipoAnalisis: muestraCorrespondiente.tipoAnalisis,
                    estado: muestraCorrespondiente.estado
                },
                resultados: resultado.resultados,
                observaciones: resultado.observaciones,
                verificado: resultado.verificado,
                cedulaLaboratorista: resultado.cedulaLaboratorista,
                nombreLaboratorista: resultado.nombreLaboratorista,
                historialCambios: resultado.historialCambios?.map(cambio => ({
                    _id: cambio._id,
                    nombre: cambio.nombre,
                    cedula: cambio.cedula,
                    fecha: formatearFechaHora(cambio.fecha),
                    observaciones: cambio.observaciones,
                    cambiosRealizados: cambio.cambiosRealizados
                })) || [],
                createdAt: formatearFechaHora(resultado.createdAt),
                updatedAt: formatearFechaHora(resultado.updatedAt)
            };
        }).filter(Boolean); // Eliminar cualquier resultado null

        if (resultadosFormateados.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No se pudieron formatear los resultados encontrados',
                errorCode: 'FORMAT_ERROR'
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                resultados: resultadosFormateados,
                total: resultadosFormateados.length
            }
        });
    } catch (error) {
        console.error('Error al obtener resultados por cliente:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener los resultados del cliente',
            error: error.message,
            errorCode: 'SERVER_ERROR'
        });
    }
};

module.exports = {
    registrarResultado,
    editarResultado,
    obtenerResultados,
    obtenerResultado,
    obtenerResultadoPorMuestra,
    obtenerTodosResultados,
    verificarResultado,
    eliminarResultado,
    obtenerResultadosPorMuestra,
    actualizarResultado,
    obtenerResultadoPorId,
    obtenerResultadosPorCliente
};
