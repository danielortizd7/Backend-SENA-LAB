const Resultado = require('../models/resultadoModel');
const Analisis = require("../../../shared/models/analisisModel");
const { Muestra } = require("../../../shared/models/muestrasModel");
const { ValidationError } = require('../../../shared/errors/AppError');
const mongoose = require('mongoose');

const procesarValorUnidad = (valor, unidad, analisisInfo) => {
    if (!valor) return null;

    // Validar que el valor sea numérico si no es Ausencia/Presencia
    if (analisisInfo.rango && analisisInfo.rango !== 'Ausencia/Presencia') {
        const valorNumerico = Number(valor);
        
        if (isNaN(valorNumerico)) {
            throw new ValidationError(`El valor para ${analisisInfo.nombre} debe ser numérico`);
        }
    }

    // Validar la unidad
    if (unidad !== analisisInfo.unidad) {
        throw new ValidationError(`La unidad para ${analisisInfo.nombre} debe ser ${analisisInfo.unidad}`);
    }

    return {
        valor: valor.toString(),
        unidad: unidad,
        metodo: analisisInfo.metodo,
        tipo: analisisInfo.tipo
    };
};

const registrarResultado = async (datosResultado) => {
    try {
        // Validar que la muestra existe
        const muestra = await Muestra.findOne({ id_muestra: datosResultado.idMuestra });
        if (!muestra) {
            throw new ValidationError('La muestra no existe');
        }

        // Obtener información de los análisis
        const analisisInfo = await Analisis.find({
            nombre: { $in: Object.keys(datosResultado.resultados) }
        });

        if (!analisisInfo.length) {
            throw new ValidationError('No se encontraron los análisis especificados');
        }

        // Crear un mapa de nombre a _id de análisis
        const analisisMap = analisisInfo.reduce((acc, analisis) => {
            acc[analisis.nombre] = analisis;
            return acc;
        }, {});

        // Procesar y validar los resultados usando los IDs como claves
        const resultadosValidados = new Map();
        
        for (const [nombreAnalisis, datos] of Object.entries(datosResultado.resultados)) {
            const analisis = analisisMap[nombreAnalisis];
            if (!analisis) {
                throw new ValidationError(`El análisis ${nombreAnalisis} no existe en la base de datos`);
            }

            const resultadoProcesado = procesarValorUnidad(datos.valor, datos.unidad, analisis);
            if (resultadoProcesado) {
                // Usar el _id del análisis como clave en lugar del nombre
                resultadosValidados.set(analisis._id, resultadoProcesado);
            }
        }        // Crear el nuevo resultado con los datos validados
        const nuevoResultado = new Resultado({
            ...datosResultado,
            resultados: resultadosValidados
        });

        // Agregar entrada inicial al historial de cambios
        const entradaInicialHistorial = {
            _id: new mongoose.Types.ObjectId(),
            nombre: datosResultado.nombreLaboratorista,
            cedula: datosResultado.cedulaLaboratorista,
            fecha: new Date(),
            observaciones: datosResultado.observaciones || "Registro inicial de resultados",
            cambiosRealizados: {
                accion: "registro_inicial",
                resultados: Object.fromEntries(
                    Array.from(resultadosValidados.entries()).map(([id, valor]) => {
                        const analisis = analisisInfo.find(a => a._id.toString() === id.toString());
                        const nombreAnalisis = analisis ? analisis.nombre : id.toString();
                        return [nombreAnalisis, {
                            valorAnterior: "Sin registro",
                            valorNuevo: `${valor.valor} ${valor.unidad}`,
                            unidad: valor.unidad,
                            metodo: valor.metodo
                        }];
                    })
                )
            }
        };

        nuevoResultado.historialCambios = [entradaInicialHistorial];

        await nuevoResultado.save();
        return nuevoResultado;
    } catch (error) {
        console.error('Error al registrar el resultado:', error);
        throw error;
    }
};

const obtenerResultadoPorId = async (idResultado) => {
    const resultado = await Resultado.findById(idResultado)
        .populate('muestra')
        .populate('verificadoPor', 'nombre email');
    
    if (!resultado) {
        throw new ValidationError('Resultado no encontrado');
    }
    
    return resultado;
};

const verificarResultado = async (idResultado, usuario) => {
    const resultado = await Resultado.findById(idResultado);
    if (!resultado) {
        throw new ValidationError('Resultado no encontrado');
    }

    if (resultado.estado === 'Verificado') {
        throw new ValidationError('El resultado ya ha sido verificado');
    }

    resultado.estado = 'Verificado';
    resultado.verificadoPor = usuario._id;
    resultado.fechaVerificacion = new Date();

    const cambio = {
        usuario: usuario._id,
        detalles: {
            accion: 'Verificación',
            estadoAnterior: 'Aprobado',
            estadoNuevo: 'Verificado'
        }
    };

    resultado.historialCambios.push(cambio);
    
    await resultado.save();
    return resultado;
};

const eliminarResultado = async (idResultado) => {
    const resultado = await Resultado.findById(idResultado);
    if (!resultado) {
        throw new ValidationError('Resultado no encontrado');
    }

    if (resultado.estado === 'Verificado') {
        throw new ValidationError('No se puede eliminar un resultado verificado');
    }

    await Resultado.deleteOne({ _id: idResultado });
};

const obtenerResultadosPorMuestra = async (idMuestra) => {
    return await Resultado.find({ muestra: idMuestra })
        .populate('verificadoPor', 'nombre email')
        .sort({ createdAt: -1 });
};

const actualizarResultado = async (idResultado, datosActualizacion, usuario) => {
    try {
        // Verificar que el resultado existe
        const resultado = await Resultado.findById(idResultado);
        if (!resultado) {
            throw new ValidationError('Resultado no encontrado');
        }

        if (resultado.estado === 'Verificado') {
            throw new ValidationError('No se puede modificar un resultado verificado');
        }

        // Obtener los valores anteriores para el historial
        const cambiosRealizados = {
            resultados: {}
        };

        // Procesar los cambios en los resultados
        if (datosActualizacion.resultados) {
            for (const [parametro, nuevoValor] of Object.entries(datosActualizacion.resultados)) {
                const valorAnterior = resultado.resultados.get(parametro);
                
                cambiosRealizados.resultados[parametro] = {
                    valorAnterior: valorAnterior ? `${valorAnterior.valor} ${valorAnterior.unidad}` : 'No registrado',
                    valorNuevo: `${nuevoValor.valor} ${nuevoValor.unidad}`,
                    unidad: nuevoValor.unidad,
                    metodo: nuevoValor.metodo
                };

                // Actualizar el valor en el mapa de resultados
                resultado.resultados.set(parametro, {
                    valor: nuevoValor.valor,
                    unidad: nuevoValor.unidad,
                    metodo: nuevoValor.metodo,
                    tipo: nuevoValor.tipo
                });
            }
        }

        // Crear el registro del historial
        const nuevoHistorial = {
            _id: new mongoose.Types.ObjectId(),
            nombre: usuario.nombre || datosActualizacion.nombreLaboratorista,
            cedula: usuario.cedula || datosActualizacion.cedulaLaboratorista,
            fecha: new Date(),
            observaciones: datosActualizacion.observaciones || '',
            cambiosRealizados: cambiosRealizados
        };

        // Actualizar observaciones si se proporcionaron
        if (datosActualizacion.observaciones) {
            resultado.observaciones = datosActualizacion.observaciones;
        }

        // Agregar el nuevo registro al historial
        resultado.historialCambios.push(nuevoHistorial);

        // Guardar los cambios
        await resultado.save();

        return resultado;
    } catch (error) {
        console.error('Error al actualizar el resultado:', error);
        throw error;
    }
};

module.exports = {
    registrarResultado,
    obtenerResultadoPorId,
    verificarResultado,
    eliminarResultado,
    obtenerResultadosPorMuestra,
    actualizarResultado
};
