const { validationResult } = require('express-validator');
const Resultado = require("../models/resultadoModel");
const mongoose = require("mongoose");
const { ResponseHandler } = require("../../../shared/utils/responseHandler");
const { NotFoundError, ValidationError, AuthorizationError } = require("../../../shared/errors/AppError");
const { Muestra } = require("../../../shared/models/muestrasModel");

// Validar que los valores numéricos sean válidos
const validarValoresNumericos = (datos) => {
  const campos = ['pH', 'turbidez', 'oxigenoDisuelto', 'nitratos', 'solidosSuspendidos', 'fosfatos'];
  campos.forEach(campo => {
    if (datos[campo] !== undefined) {
      const valor = Number(datos[campo]);
      if (isNaN(valor)) {
        throw new ValidationError(`El valor de ${campo} debe ser numérico`);
      }
      // Validaciones específicas para cada campo
      switch (campo) {
        case 'pH':
          if (valor < 0 || valor > 14) {
            throw new ValidationError('El pH debe estar entre 0 y 14');
          }
          break;
        case 'turbidez':
        case 'oxigenoDisuelto':
        case 'nitratos':
        case 'solidosSuspendidos':
        case 'fosfatos':
          if (valor < 0) {
            throw new ValidationError(`El valor de ${campo} no puede ser negativo`);
          }
          break;
      }
    }
  });
};

// Validar formato del valor numérico
const validarFormatoNumerico = (valor) => {
    if (typeof valor !== 'string' && typeof valor !== 'number') {
        throw new ValidationError('El valor debe ser un número o una cadena numérica');
    }

    const valorStr = valor.toString();
    
    // Verificar si contiene coma
    if (valorStr.includes(',')) {
        throw new ValidationError('El valor debe usar punto decimal (.) en lugar de coma (,)');
    }

    // Verificar que sea un número válido
    const numero = Number(valorStr);
    if (isNaN(numero)) {
        throw new ValidationError('El valor debe ser un número válido');
    }

    return true;
};

const procesarMedicion = (valorCompleto) => {
  if (!valorCompleto) return null;

  // Si es un string, procesamos el formato "valor unidad"
  const valorStr = valorCompleto.toString().trim();
  
  // Si tiene formato "1.3mg/L" (sin espacio)
  const matchSinEspacio = valorStr.match(/^([\d.]+)(.+)$/);
  if (matchSinEspacio) {
    return {
      valor: matchSinEspacio[1],
      unidad: matchSinEspacio[2].trim()
    };
  }

  // Si tiene formato "7.5 mv" (con espacio)
  const partes = valorStr.split(' ');
  if (partes.length >= 2) {
    return {
      valor: partes[0],
      unidad: partes.slice(1).join(' ').trim()
    };
  }

  // Si no tiene unidad
  return {
    valor: valorStr,
    unidad: ''
  };
};

const formatearValorCompleto = (valor, unidad) => {
  if (!valor) return '';
  return unidad ? `${valor} ${unidad}` : valor;
};

const crearCambioMedicion = (campo, valorAnterior, valorNuevo) => {
  const anterior = valorAnterior ? formatearValorCompleto(valorAnterior.valor, valorAnterior.unidad) : "No registrado";
  const nuevo = formatearValorCompleto(valorNuevo.valor, valorNuevo.unidad);
  
  return {
    valorAnterior: anterior,
    valorNuevo: nuevo,
    unidad: valorNuevo.unidad
  };
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

        if (!idMuestra) {
            return res.status(400).json({
                success: false,
                message: 'El ID de la muestra es requerido',
                errorCode: 'VALIDATION_ERROR'
            });
        }

        // Validar formato de valores numéricos
        for (const [analisis, datos] of Object.entries(resultados)) {
            try {
                validarFormatoNumerico(datos.valor);
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: `Error en el análisis ${analisis}: ${error.message}`,
                    errorCode: 'VALIDATION_ERROR'
                });
            }
        }

        // Obtener la muestra primero
        const muestra = await Muestra.findOne({ id_muestra: idMuestra });
        if (!muestra) {
            return res.status(404).json({
                success: false,
                message: 'Muestra no encontrada',
                errorCode: 'NOT_FOUND'
            });
        }

        // Validar que hay resultados y que es un objeto
        if (!resultados || typeof resultados !== 'object' || Array.isArray(resultados)) {
            return res.status(400).json({
                success: false,
                message: 'Los resultados deben ser un objeto con al menos un análisis',
                errorCode: 'VALIDATION_ERROR'
            });
        }

        // Validar que los análisis registrados correspondan a los seleccionados
        const analisisNoSeleccionados = Object.keys(resultados).filter(
            analisis => !muestra.analisisSeleccionados.includes(analisis)
        );

        if (analisisNoSeleccionados.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Los siguientes análisis no fueron seleccionados originalmente: ${analisisNoSeleccionados.join(', ')}`,
                errorCode: 'VALIDATION_ERROR'
            });
        }

        let resultado = await Resultado.findOne({ idMuestra });
        
        if (resultado) {
            // Si existe, actualizar
            const cambiosRealizados = {};
            
            Object.entries(resultados).forEach(([nombre, datos]) => {
                const nombreLower = nombre.toLowerCase();
                // Guardar el valor anterior antes de actualizarlo
                const valorAnterior = resultado[nombreLower] ? {
                    valor: resultado[nombreLower].valor,
                    unidad: resultado[nombreLower].unidad
                } : null;
                
                // Actualizar el valor
                resultado[nombreLower] = {
                    valor: datos.valor,
                    unidad: datos.unidad
                };
                
                // Registrar el cambio
                cambiosRealizados[nombre] = {
                    valorAnterior: valorAnterior ? `${valorAnterior.valor} ${valorAnterior.unidad}`.trim() : "No registrado",
                    valorNuevo: `${datos.valor} ${datos.unidad}`.trim(),
                    unidad: datos.unidad
            };
        });

            resultado.observaciones = observaciones;
            resultado.verificado = false;
            
            // Agregar al historial de cambios
            const cambio = {
            nombre: usuario.nombre,
            cedula: usuario.documento,
            fecha: new Date(),
                observaciones: observaciones || "Sin observaciones",
                cambiosRealizados: {
                    resultados: cambiosRealizados
                }
            };
            
            resultado.historialCambios.push(cambio);
            
            await resultado.save();
        } else {
            // Si no existe, crear nuevo
            const cambiosIniciales = {};
            Object.entries(resultados).forEach(([nombre, datos]) => {
                cambiosIniciales[nombre] = {
                    valorAnterior: "No registrado",
                    valorNuevo: `${datos.valor} ${datos.unidad}`.trim(),
                    unidad: datos.unidad
                };
            });

            const nuevoResultado = {
                idMuestra,
                cliente: {
                    nombre: muestra.cliente.nombre,
                    documento: muestra.cliente.documento
                },
                tipoDeAgua: muestra.tipoDeAgua,
                lugarMuestreo: muestra.lugarMuestreo,
                fechaHoraMuestreo: muestra.fechaHoraMuestreo,
                tipoAnalisis: muestra.tipoAnalisis,
                estado: 'En análisis',
            observaciones,
            verificado: false,
            cedulaLaboratorista: usuario.documento,
            nombreLaboratorista: usuario.nombre,
                historialCambios: [{
                    nombre: usuario.nombre,
                    cedula: usuario.documento,
                    fecha: new Date(),
                    observaciones: observaciones || "Sin observaciones",
                    cambiosRealizados: {
                        resultados: cambiosIniciales
                    }
                }]
            };

            // Agregar los resultados
            Object.entries(resultados).forEach(([nombre, datos]) => {
                nuevoResultado[nombre.toLowerCase()] = {
                    valor: datos.valor,
                    unidad: datos.unidad
                };
            });

            resultado = await Resultado.create(nuevoResultado);
        }

        // Actualizar el estado de la muestra
        await Muestra.findOneAndUpdate(
            { id_muestra: idMuestra },
            { estado: 'En análisis' }
        );

        // Obtener el resultado actualizado y transformarlo
        const resultadoActualizado = await Resultado.findOne({ idMuestra });
        
        // Transformar el resultado antes de enviarlo
        const resultadoTransformado = resultadoActualizado.toObject();
        delete resultadoTransformado._id;
        
        // Asegurar que solo se incluyan nombre y documento del cliente
        if (resultadoTransformado.cliente) {
            resultadoTransformado.cliente = {
                nombre: resultadoTransformado.cliente.nombre,
                documento: resultadoTransformado.cliente.documento
            };
        }

        return res.status(200).json({
            success: true,
            message: 'Resultados registrados exitosamente',
            data: resultadoTransformado
        });
    } catch (error) {
        console.error('Error al registrar resultados:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno al registrar resultados',
            error: error.message
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

        // Validar formato de valores numéricos
        for (const [analisis, datos] of Object.entries(resultados)) {
            try {
                validarFormatoNumerico(datos.valor);
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: `Error en el análisis ${analisis}: ${error.message}`,
                    errorCode: 'VALIDATION_ERROR'
                });
            }
        }

        // Buscar el resultado usando idMuestra
        const resultado = await Resultado.findOne({ idMuestra });
        if (!resultado) {
            return res.status(404).json({
                success: false,
                message: 'Resultado no encontrado',
                errorCode: 'NOT_FOUND'
            });
        }

        // Validar que hay resultados y que es un objeto
        if (!resultados || typeof resultados !== 'object' || Array.isArray(resultados)) {
            return res.status(400).json({
                success: false,
                message: 'Los resultados deben ser un objeto con al menos un análisis',
                errorCode: 'VALIDATION_ERROR'
            });
        }

        // Registrar cambios
        const cambiosRealizados = {};
        Object.entries(resultados).forEach(([nombre, datos]) => {
            const nombreLower = nombre.toLowerCase();
            // Guardar el valor anterior
            const valorAnterior = resultado[nombreLower] ? {
                valor: resultado[nombreLower].valor,
                unidad: resultado[nombreLower].unidad
            } : null;
            
            // Actualizar el valor
            resultado[nombreLower] = {
                valor: datos.valor,
                unidad: datos.unidad
            };
            
            // Registrar el cambio
            cambiosRealizados[nombre] = {
                valorAnterior: valorAnterior ? `${valorAnterior.valor} ${valorAnterior.unidad}`.trim() : "No registrado",
                valorNuevo: `${datos.valor} ${datos.unidad}`.trim(),
                unidad: datos.unidad
            };
        });

        resultado.observaciones = observaciones;
        resultado.verificado = false;
        
        // Agregar al historial de cambios
        const cambio = {
                nombre: usuario.nombre,
                cedula: usuario.documento,
                fecha: new Date(),
            observaciones: observaciones || "Sin observaciones",
            cambiosRealizados: {
                resultados: cambiosRealizados
            }
        };
        
        resultado.historialCambios.push(cambio);

        // Guardar los cambios
        await resultado.save();

        // Obtener el resultado actualizado
        const resultadoActualizado = await Resultado.findOne({ idMuestra })
            .select('-__v')
            .lean();

        return res.status(200).json({
            success: true,
            message: 'Resultado actualizado exitosamente',
            data: resultadoActualizado
        });
    } catch (error) {
        console.error('Error al editar resultado:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al editar el resultado',
            error: error.message
        });
    }
};

const obtenerResultados = async (req, res) => {
    try {
        const { page = 1, limit = 10, ...filters } = req.query;
        const options = {
            skip: (page - 1) * limit,
            limit: parseInt(limit),
            sort: { fechaHoraMuestreo: -1 }
        };

        const query = {};
        if (filters.id_muestra) query.id_muestra = filters.id_muestra;
        if (filters.estado) query.estado = filters.estado;
        if (filters.verificado !== undefined) query.verificado = filters.verificado === 'true';

        const resultados = await Resultado.findAllWithMuestras(query, options);
        const total = await Resultado.countDocuments(query);

        return res.status(200).json({
            success: true,
            data: resultados,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
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
        const { id } = req.params;
        const resultado = await Resultado.findWithMuestra(id);

        if (!resultado) {
            return res.status(404).json({
                success: false,
                message: 'Resultado no encontrado',
                errorCode: 'NOT_FOUND'
            });
        }

        return res.status(200).json({
            success: true,
            data: resultado
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

        // Transformar el resultado antes de enviarlo
        const resultadoTransformado = {
            _id: resultado._id,
            idMuestra: resultado.idMuestra,
            cliente: resultado.cliente || {},
            tipoDeAgua: resultado.tipoDeAgua,
            lugarMuestreo: resultado.lugarMuestreo,
            fechaHoraMuestreo: resultado.fechaHoraMuestreo,
            tipoAnalisis: resultado.tipoAnalisis,
            estado: resultado.estado,
            resultados: resultado.resultados || {},
            observaciones: resultado.observaciones,
            verificado: resultado.verificado,
            cedulaLaboratorista: resultado.cedulaLaboratorista,
            nombreLaboratorista: resultado.nombreLaboratorista,
            historialCambios: resultado.historialCambios?.map(cambio => ({
                nombre: cambio.nombre,
                cedula: cambio.cedula,
                fecha: cambio.fecha,
                observaciones: cambio.observaciones,
                cambiosRealizados: cambio.cambiosRealizados || {}
            })) || [],
            createdAt: resultado.createdAt,
            updatedAt: resultado.updatedAt
        };

        return res.status(200).json({
            success: true,
            data: resultadoTransformado
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
                fechaHoraMuestreo: resultadoActualizado.fechaHoraMuestreo,
                tipoAnalisis: resultadoActualizado.tipoAnalisis,
                estado: resultadoActualizado.estado,
                resultados: resultadosFinales,
                observaciones: observacionFinal,
                verificado: resultadoActualizado.verificado,
                cedulaLaboratorista: resultadoActualizado.cedulaLaboratorista,
                nombreLaboratorista: resultadoActualizado.nombreLaboratorista,
                historialCambios: resultadoActualizado.historialCambios,
                createdAt: resultadoActualizado.createdAt,
                updatedAt: resultadoActualizado.updatedAt,
                resumenVerificacion: valoresActuales,
                fechaVerificacion: new Date()
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

        return res.status(200).json({
            success: true,
            data: resultados,
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

module.exports = {
    registrarResultado,
    editarResultado,
    obtenerResultados,
    obtenerResultado,
    obtenerResultadoPorMuestra,
    obtenerTodosResultados,
    verificarResultado,
    eliminarResultado
};
