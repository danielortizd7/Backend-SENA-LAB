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

const registrarResultado = async (datosEntrada) => {
    try {
        // Verificar que la muestra existe
        const muestra = await Muestra.findOne({ id_muestra: datosEntrada.idMuestra });
        if (!muestra) {
            throw new ValidationError('La muestra no existe');
        }

        // Obtener información de los análisis desde la base de datos
        const analisisInfo = await Analisis.find({
            nombre: { $in: Object.keys(datosEntrada.resultados) }
        });

        // Crear un mapa de análisis para fácil acceso
        const analisisMap = analisisInfo.reduce((acc, analisis) => {
            acc[analisis.nombre] = analisis;
            return acc;
        }, {});

        // Validar que todos los análisis existen en la base de datos
        for (const nombre of Object.keys(datosEntrada.resultados)) {
            if (!analisisMap[nombre]) {
                throw new ValidationError(`El análisis ${nombre} no existe en la base de datos`);
            }
        }

        // Validar que los análisis correspondan a los seleccionados en la muestra
        const analisisNoSeleccionados = Object.keys(datosEntrada.resultados).filter(
            analisis => !muestra.analisisSeleccionados.some(a => a.nombre === analisis)
        );

        if (analisisNoSeleccionados.length > 0) {
            throw new ValidationError(
                `Los siguientes análisis no fueron seleccionados originalmente: ${analisisNoSeleccionados.join(', ')}`
            );
        }

        // Procesar los resultados
        const resultadosMap = new Map();
        const cambiosIniciales = {};

        for (const [nombre, datosAnalisis] of Object.entries(datosEntrada.resultados)) {
            const analisis = analisisMap[nombre];
            const valorProcesado = procesarValorUnidad(datosAnalisis.valor, datosAnalisis.unidad, analisis);

            if (valorProcesado) {
                resultadosMap.set(nombre, valorProcesado);
                cambiosIniciales[nombre] = {
                    valorAnterior: "No registrado",
                    valorNuevo: `${datosAnalisis.valor} ${datosAnalisis.unidad}`,
                    unidad: datosAnalisis.unidad,
                    metodo: analisis.metodo
                };
            }
        }

        // Crear el resultado
        const resultado = new Resultado({
            idMuestra: datosEntrada.idMuestra,
            cliente: {
                _id: muestra.cliente._id || new mongoose.Types.ObjectId(),
                nombre: muestra.cliente.nombre,
                documento: muestra.cliente.documento,
                email: muestra.cliente.email,
                telefono: muestra.cliente.telefono,
                direccion: muestra.cliente.direccion
            },
            tipoDeAgua: muestra.tipoDeAgua,
            lugarMuestreo: muestra.lugarMuestreo,
            fechaHoraMuestreo: muestra.fechaHoraMuestreo,
            tipoAnalisis: muestra.tipoAnalisis,
            estado: 'En análisis',
            resultados: resultadosMap,
            observaciones: datosEntrada.observaciones || "",
            verificado: false,
            cedulaLaboratorista: datosEntrada.cedulaLaboratorista,
            nombreLaboratorista: datosEntrada.nombreLaboratorista,
            historialCambios: [{
                _id: new mongoose.Types.ObjectId(),
                nombre: datosEntrada.nombreLaboratorista,
                cedula: datosEntrada.cedulaLaboratorista,
                fecha: new Date(),
                observaciones: datosEntrada.observaciones || "Registro inicial",
                cambiosRealizados: {
                    resultados: cambiosIniciales
                }
            }]
        });

        await resultado.save();

        // Actualizar el estado de la muestra
        await muestra.updateOne({ estado: 'En análisis' });

        return resultado;
    } catch (error) {
        console.error("Error al registrar el resultado:", error);
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

const verificarResultado = async (idMuestra, usuario) => {
    const resultado = await Resultado.findOne({ idMuestra });
    if (!resultado) {
        throw new ValidationError('No se encontraron resultados para esta muestra');
    }

    if (resultado.verificado) {
        throw new ValidationError('El resultado ya ha sido verificado');
    }

    // Actualizar el estado del resultado
    resultado.verificado = true;
    resultado.estado = 'Finalizada';
    
    // Agregar el registro al historial de cambios
    resultado.historialCambios.push({
        _id: new mongoose.Types.ObjectId(),
        nombre: usuario.nombre,
        cedula: usuario.documento,
        fecha: new Date(),
        observaciones: 'Verificación de resultados',
        cambiosRealizados: {
            estado: {
                valorAnterior: resultado.estado,
                valorNuevo: 'Finalizada'
            }
        }
    });
    
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
