const { validationResult } = require('express-validator');
const Resultado = require("../models/resultadoModel");
const mongoose = require("mongoose");
const { ResponseHandler } = require("../../../shared/utils/responseHandler");
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

        // Obtener todos los análisis necesarios para la validación
        const analisisDisponibles = await Analisis.find({
            nombre: { $in: Object.keys(resultados) }
        });

        // Validar los rangos para cada resultado
        const erroresValidacion = [];
        for (const [nombreAnalisis, datos] of Object.entries(resultados)) {
            const analisis = analisisDisponibles.find(a => a.nombre === nombreAnalisis);
            
            if (!analisis) {
                erroresValidacion.push(`El análisis ${nombreAnalisis} no existe en la base de datos`);
                continue;
            }

            // Validar que el valor sea numérico (excepto para resultados cualitativos)
            const valor = parseFloat(datos.valor);
            if (isNaN(valor) && analisis.rango !== 'Ausencia/Presencia') {
                erroresValidacion.push(`El valor para ${nombreAnalisis} debe ser numérico`);
                continue;
            }

            // Validar la unidad
            if (datos.unidad !== analisis.unidad) {
                erroresValidacion.push(
                    `La unidad para ${nombreAnalisis} debe ser ${analisis.unidad}`
                );
            }
        }

        // Si hay errores de validación, retornar error
        if (erroresValidacion.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Error en la validación de resultados',
                errors: erroresValidacion,
                errorCode: 'VALIDATION_ERROR'
            });
        }

        // Obtener la muestra para tener los datos completos
        const muestra = await Muestra.findOne({ id_muestra: idMuestra });
        if (!muestra) {
            return res.status(404).json({
                success: false,
                message: 'Muestra no encontrada',
                errorCode: 'NOT_FOUND'
            });
        }

        // Actualizar el estado de la muestra a "En análisis"
        const estadoAnterior = muestra.estado;
        muestra.estado = "En análisis";
        
        // Crear el registro del historial de estados
        const nuevoEstado = {
            estado: "En análisis",
            estadoAnterior: estadoAnterior,
            fecha: new Date(),
            observaciones: "Cambio automático al registrar resultados"
        };

        // Si tenemos el ID del usuario lo agregamos, si no, usamos la información básica
        if (usuario._id) {
            nuevoEstado.usuario = usuario._id;
        } else {
            // Crear un nuevo ObjectId para el usuario si no existe
            nuevoEstado.usuario = new mongoose.Types.ObjectId();
        }

        muestra.historialEstados.push(nuevoEstado);

        try {
            await muestra.save();
        } catch (error) {
            console.error('Error al guardar la muestra:', error);
            return res.status(400).json({
                success: false,
                message: 'Error al actualizar el estado de la muestra',
                error: error.message
            });
        }

        // Preparar datos para el servicio
        const datosResultado = {
            idMuestra,
            cliente: {
                documento: muestra.cliente.documento,
                nombre: muestra.cliente.nombre,
                email: muestra.cliente.email,
                telefono: muestra.cliente.telefono,
                direccion: muestra.cliente.direccion
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
            nombreLaboratorista: usuario.nombre
        };

        // Usar el servicio para registrar el resultado
        const resultado = await resultadoService.registrarResultado(datosResultado);

        // Obtener los análisis para mapear IDs a nombres
        const analisisInfo = await Analisis.find({
            _id: { $in: Array.from(resultado.resultados.keys()) }
        });

        const analisisMap = analisisInfo.reduce((acc, analisis) => {
            acc[analisis._id] = analisis;
            return acc;
        }, {});

        // Formatear el resultado para la respuesta
        const resultadoFormateado = {
            _id: resultado._id,
            idMuestra: resultado.idMuestra,
            cliente: resultado.cliente,
            tipoDeAgua: resultado.tipoDeAgua,
            lugarMuestreo: resultado.lugarMuestreo,
            fechaHoraMuestreo: formatearFechaHora(resultado.fechaHoraMuestreo),
            tipoAnalisis: resultado.tipoAnalisis,
            estado: resultado.estado,
            resultados: Object.fromEntries(
                Array.from(resultado.resultados.entries()).map(([id, valor]) => [
                    analisisMap[id].nombre,
                    valor
                ])
            ),
            observaciones: resultado.observaciones,
            verificado: resultado.verificado,
            cedulaLaboratorista: resultado.cedulaLaboratorista,
            nombreLaboratorista: resultado.nombreLaboratorista,
            historialCambios: resultado.historialCambios.map(cambio => ({
                nombre: cambio.nombre,
                cedula: cambio.cedula,
                fecha: formatearFechaHora(cambio.fecha),
                observaciones: cambio.observaciones,
                cambiosRealizados: cambio.cambiosRealizados
            })),
            createdAt: formatearFechaHora(resultado.createdAt),
            updatedAt: formatearFechaHora(resultado.updatedAt)
        };

        // Registrar auditoría
        setImmediate(async () => {
            try {
                await AuditoriaService.registrarAccionMuestra({
                    usuario,
                    metodo: 'POST',
                    descripcion: 'Registro de resultado y muestra',
                    idMuestra,
                    tipoMuestra: resultado.tipoDeAgua,
                    estadoMuestra: resultado.estado,
                    datosCompletos: resultadoFormateado
                });
            } catch (error) {
                console.error('[AUDITORIA ERROR]', error.message);
            }
        });

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

        // Verificar si el resultado ya está verificado
        if (resultado.verificado || muestra.estado === "Finalizada") {
            return res.status(403).json({
                success: false,
                message: 'No se puede editar un resultado que ya ha sido verificado o finalizado',
                errorCode: 'VALIDATION_ERROR'
            });
        }

        // Obtener información de los análisis y validar rangos
        const analisisDisponibles = await Analisis.find({
            nombre: { $in: Object.keys(resultados) }
        });

        // Validar los rangos para cada resultado
        const erroresValidacion = [];
        for (const [nombreAnalisis, datos] of Object.entries(resultados)) {
            const analisis = analisisDisponibles.find(a => a.nombre === nombreAnalisis);
            
            if (!analisis) {
                erroresValidacion.push(`El análisis ${nombreAnalisis} no existe en la base de datos`);
                continue;
            }

            // Validar que el valor sea numérico (excepto para resultados cualitativos)
            const valor = parseFloat(datos.valor);
            if (isNaN(valor) && analisis.rango !== 'Ausencia/Presencia') {
                erroresValidacion.push(`El valor para ${nombreAnalisis} debe ser numérico`);
                continue;
            }

            // Validar la unidad
            if (datos.unidad !== analisis.unidad) {
                erroresValidacion.push(
                    `La unidad para ${nombreAnalisis} debe ser ${analisis.unidad}`
                );
            }
        }

        // Si hay errores de validación, retornar error
        if (erroresValidacion.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Error en la validación de resultados',
                errors: erroresValidacion,
                errorCode: 'VALIDATION_ERROR'
            });
        }

        // Guardar valores anteriores para auditoría
        const valoresAnteriores = resultado.toObject();
        const cambiosRealizados = {};

        // Procesar y validar los nuevos resultados
        for (const [nombreAnalisis, datos] of Object.entries(resultados)) {
            const analisis = analisisDisponibles.find(a => a.nombre === nombreAnalisis);
            if (!analisis) {
                return res.status(400).json({
                    success: false,
                    message: `El análisis ${nombreAnalisis} no existe en la base de datos`,
                    errorCode: 'VALIDATION_ERROR'
                });
            }

            // Validar el valor según el tipo de análisis
            if (analisis.rango && analisis.rango !== 'Ausencia/Presencia') {
                const valor = Number(datos.valor);
                if (isNaN(valor)) {
                    return res.status(400).json({
                        success: false,
                        message: `El valor para ${nombreAnalisis} debe ser numérico`,
                        errorCode: 'VALIDATION_ERROR'
                    });
                }
            }

            // Validar la unidad
            if (datos.unidad !== analisis.unidad) {
                return res.status(400).json({
                    success: false,
                    message: `La unidad para ${nombreAnalisis} debe ser ${analisis.unidad}`,
                    errorCode: 'VALIDATION_ERROR'
                });
            }

            // Obtener el valor anterior
            const valorAnteriorObj = resultado.resultados.get(analisis._id);
            const valorAnterior = valorAnteriorObj ? 
                `${valorAnteriorObj.valor} ${valorAnteriorObj.unidad}` : 
                "No registrado";

            // Actualizar el resultado usando el ID como clave
            resultado.resultados.set(analisis._id, {
                valor: datos.valor,
                unidad: datos.unidad,
                metodo: analisis.metodo,
                tipo: analisis.tipo
            });

            // Registrar el cambio
            cambiosRealizados[nombreAnalisis] = {
                valorAnterior,
                valorNuevo: `${datos.valor} ${datos.unidad}`,
                unidad: datos.unidad,
                metodo: analisis.metodo
            };
        }

        // Actualizar observaciones
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

        // Formatear el resultado para la respuesta
        const resultadoFormateado = {
            _id: resultado._id,
            idMuestra: resultado.idMuestra,
            cliente: resultado.cliente,
            tipoDeAgua: resultado.tipoDeAgua,
            lugarMuestreo: resultado.lugarMuestreo,
            fechaHoraMuestreo: formatearFechaHora(resultado.fechaHoraMuestreo),
            tipoAnalisis: resultado.tipoAnalisis,
            estado: resultado.estado,
            resultados: Object.fromEntries(
                Array.from(resultado.resultados.entries()).map(([id, valor]) => [
                    analisisDisponibles.find(a => a._id === id || a._id.toString() === id.toString())?.nombre || id,
                    valor
                ])
            ),
            observaciones: resultado.observaciones,
            verificado: resultado.verificado,
            cedulaLaboratorista: resultado.cedulaLaboratorista,
            nombreLaboratorista: resultado.nombreLaboratorista,
            historialCambios: resultado.historialCambios.map(cambio => ({
                nombre: cambio.nombre,
                cedula: cambio.cedula,
                fecha: formatearFechaHora(cambio.fecha),
                observaciones: cambio.observaciones,
                cambiosRealizados: cambio.cambiosRealizados
            })),
            createdAt: formatearFechaHora(resultado.createdAt),
            updatedAt: formatearFechaHora(resultado.updatedAt)
        };

        // Registrar auditoría
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
        const { idMuestra } = req.params;
        const usuario = req.usuario;
        const { observaciones } = req.body;

        // Verificar que el usuario tiene permisos de administrador
        if (usuario.rol !== 'administrador') {
            return res.status(403).json({
                success: false,
                message: 'No tiene permisos para verificar resultados. Solo los administradores pueden realizar esta acción.',
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

        // Actualizar el estado de verificación del resultado y el estado
        resultado.verificado = true;
        resultado.estado = "Finalizada"; // También actualizamos el estado en el resultado
        
        // Agregar al historial de cambios del resultado
        resultado.historialCambios.push({
            _id: new mongoose.Types.ObjectId(),
            nombre: usuario.nombre,
            cedula: usuario.documento,
            fecha: new Date(),
            observaciones: observaciones || "Verificación de resultados",
            cambiosRealizados: {
                verificacion: {
                    anterior: false,
                    nuevo: true
                },
                estado: {
                    anterior: muestra.estado,
                    nuevo: "Finalizada"
                }
            }
        });

        // Actualizar el estado de la muestra a "Finalizada"
        const estadoAnterior = muestra.estado;
        muestra.estado = "Finalizada";

        // Crear el registro del historial de estados
        const nuevoEstado = {
            estado: "Finalizada",
            estadoAnterior: estadoAnterior,
            fecha: new Date(),
            observaciones: "Cambio automático al verificar resultados"
        };

        // Si tenemos el ID del usuario lo agregamos, si no, creamos uno nuevo
        if (usuario._id) {
            nuevoEstado.usuario = usuario._id;
        } else {
            nuevoEstado.usuario = new mongoose.Types.ObjectId();
        }

        muestra.historialEstados.push(nuevoEstado);

        // Guardar ambos cambios
        try {
            await Promise.all([
                resultado.save(),
                muestra.save()
            ]);
        } catch (error) {
            console.error('Error al guardar los cambios:', error);
            return res.status(400).json({
                success: false,
                message: 'Error al guardar los cambios',
                error: error.message
            });
        }

        // Formatear el resultado para la respuesta
        const resultadoFormateado = {
            _id: resultado._id,
            idMuestra: resultado.idMuestra,
            estado: resultado.estado,
            verificado: resultado.verificado,
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
            message: 'Resultado verificado y muestra finalizada exitosamente',
            data: resultadoFormateado
        });

    } catch (error) {
        console.error('Error al verificar resultado:', error);
        return res.status(error instanceof ValidationError ? 400 : 500).json({
            success: false,
            message: error.message || 'Error al verificar el resultado',
            errorCode: error instanceof ValidationError ? 'VALIDATION_ERROR' : 'SERVER_ERROR'
        });
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
