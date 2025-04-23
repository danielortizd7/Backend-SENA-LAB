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
        const fechaObj = new Date(fecha);
        
        const dia = fechaObj.getDate().toString().padStart(2, '0');
        const mes = (fechaObj.getMonth() + 1).toString().padStart(2, '0');
        const año = fechaObj.getFullYear();
        
        let horas = fechaObj.getHours();
        const minutos = fechaObj.getMinutes().toString().padStart(2, '0');
        const segundos = fechaObj.getSeconds().toString().padStart(2, '0');
        const ampm = horas >= 12 ? 'PM' : 'AM';
        
        horas = horas % 12;
        horas = horas ? horas : 12;
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

        // Preparar datos para el servicio
        const datosResultado = {
            idMuestra,
            resultados,
            observaciones,
            cedulaLaboratorista: usuario.documento,
            nombreLaboratorista: usuario.nombre
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

        // Formatear el resultado para la respuesta
        const resultadoFormateado = {
            ...resultado.toObject(),
            resultados: Object.fromEntries(resultado.resultados),
            fechaHoraMuestreo: formatearFechaHora(resultado.fechaHoraMuestreo),
            createdAt: formatearFechaHora(resultado.createdAt),
            updatedAt: formatearFechaHora(resultado.updatedAt),
            historialCambios: resultado.historialCambios.map(cambio => ({
                nombre: cambio.nombre,
                cedula: cambio.cedula,
                fecha: formatearFechaHora(cambio.fecha),
                observaciones: cambio.observaciones,
                cambiosRealizados: cambio.cambiosRealizados
            }))
        };

        // Eliminar campos internos de Mongoose
        delete resultadoFormateado.__v;
        delete resultadoFormateado._id;

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
            tipoDeAgua: resultado.tipoDeAgua,
            cliente: resultado.cliente,
            lugarMuestreo: resultado.lugarMuestreo,
            fechaHoraMuestreo: formatearFechaHora(resultado.fechaHoraMuestreo),
            tipoAnalisis: resultado.tipoAnalisis,
            estado: resultado.estado,
            resultados: Object.fromEntries(resultado.resultados),
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
        const { observaciones } = req.body;
        const usuario = req.usuario;

        // Validar rol de administrador
        if (usuario.rol !== 'administrador') {
            return res.status(403).json({
                success: false,
                message: 'No tiene permisos para verificar resultados. Solo los administradores pueden realizar esta acción.',
                errorCode: 'AUTHORIZATION_ERROR'
            });
        }

        // Buscar el resultado
        const resultado = await Resultado.findOne({ idMuestra }).lean();
        if (!resultado) {
            return res.status(404).json({
                success: false,
                message: 'Resultado no encontrado',
                errorCode: 'NOT_FOUND'
            });
        }

        // Verificar que no esté ya verificado
        if (resultado.verificado) {
            return res.status(400).json({
                success: false,
                message: 'Este resultado ya ha sido verificado',
                errorCode: 'VALIDATION_ERROR'
            });
        }

        // Obtener los últimos valores de cada análisis
        const ultimoCambio = resultado.historialCambios[resultado.historialCambios.length - 1];
        const valoresActuales = {};
        const resultadosFinales = {};

        Object.entries(ultimoCambio.cambiosRealizados.resultados).forEach(([analisis, datos]) => {
            if (analisis !== 'verificacion' && analisis !== 'resumenValores') {
                valoresActuales[analisis] = datos.valorNuevo;
                // Extraer valor numérico y unidad
                const match = datos.valorNuevo.match(/^([\d.]+)\s*(.*)$/);
                if (match) {
                    resultadosFinales[analisis] = {
                        valor: match[1],
                        unidad: match[2].trim()
                    };
                }
            }
        });

        // Crear resumen de la verificación
        const resumenVerificacion = Object.entries(valoresActuales)
            .map(([analisis, valor]) => `${analisis}: ${valor}`)
            .join(', ');

        // Crear observación detallada si no se proporciona una
        const observacionFinal = observaciones || 
            `Verificación completada. Valores finales verificados: ${resumenVerificacion}. ` +
            `Todos los parámetros han sido revisados y cumplen con los estándares establecidos.`;

        // Actualizar el resultado
        const resultadoActualizado = await Resultado.findOneAndUpdate(
            { idMuestra },
            {
                $set: {
                verificado: true,
                    estado: 'Finalizada',
                    resultados: resultadosFinales,
                    observaciones: observacionFinal
                },
                $push: {
                    historialCambios: {
                        nombre: usuario.nombre,
                        cedula: usuario.documento,
                        fecha: new Date(),
                        observaciones: observacionFinal,
                        cambiosRealizados: {
                            resultados: {
                            verificacion: {
                                    valorAnterior: "No verificado",
                                    valorNuevo: "Verificado",
                                    unidad: "Estado"
                                },
                                resumenValores: Object.entries(valoresActuales).reduce((acc, [analisis, valor]) => {
                                    acc[analisis] = {
                                        valorVerificado: valor,
                                        estado: "Aprobado"
                                    };
                                    return acc;
                                }, {})
                            }
                        }
                    }
                }
            },
            { new: true }
        ).lean();

        // Actualizar el estado de la muestra
        await Muestra.findOneAndUpdate(
            { id_muestra: idMuestra },
            { 
                estado: 'Finalizada',
                fechaFinalizacion: new Date()
            }
        );

        // Transformar el resultado antes de enviarlo
        const resultadoCompleto = {
            success: true,
            message: 'Resultado verificado exitosamente',
            data: {
                _id: resultadoActualizado._id,
                idMuestra: resultadoActualizado.idMuestra,
                cliente: resultadoActualizado.cliente,
                tipoDeAgua: resultadoActualizado.tipoDeAgua,
                lugarMuestreo: resultadoActualizado.lugarMuestreo,
                fechaHoraMuestreo: formatearFechaHora(resultadoActualizado.fechaHoraMuestreo),
                tipoAnalisis: resultadoActualizado.tipoAnalisis,
                estado: resultadoActualizado.estado,
                resultados: resultadosFinales,
                observaciones: observacionFinal,
                verificado: resultadoActualizado.verificado,
                cedulaLaboratorista: resultadoActualizado.cedulaLaboratorista,
                nombreLaboratorista: resultadoActualizado.nombreLaboratorista,
                historialCambios: resultadoActualizado.historialCambios.map(cambio => ({
                    ...cambio,
                    fecha: formatearFechaHora(cambio.fecha)
                })),
                createdAt: formatearFechaHora(resultadoActualizado.createdAt),
                updatedAt: formatearFechaHora(resultadoActualizado.updatedAt),
                resumenVerificacion: valoresActuales,
                fechaVerificacion: formatearFechaHora(new Date())
            }
        };

        return res.status(200).json(resultadoCompleto);
    } catch (error) {
        console.error('Error al verificar resultado:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar el resultado',
            error: error.message
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
        const { id } = req.params;
        const resultado = await Resultado.findOneAndDelete({ id_muestra: id });

        if (!resultado) {
            return res.status(404).json({
                success: false,
                message: 'Resultado no encontrado',
                errorCode: 'NOT_FOUND'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Resultado eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar resultado:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al eliminar el resultado',
            error: error.message
        });
    }
};

const obtenerResultadosPorMuestra = async (req, res) => {
    try {
        const { idMuestra } = req.params;
        const resultados = await Resultado.find({ idMuestra })
            .select('-__v')
            .sort({ createdAt: -1 })
            .lean();

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
            data: resultadosFormateados
        });
    } catch (error) {
        console.error('Error al obtener resultados por muestra:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener los resultados de la muestra',
            error: error.message
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
    obtenerResultadosPorMuestra
};
