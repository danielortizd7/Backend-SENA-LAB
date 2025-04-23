const Resultado = require('../models/resultadoModel');
const Analisis = require("../../../shared/models/analisisModel");
const { Muestra } = require("../../../shared/models/muestrasModel");
const { ValidationError } = require('../../../shared/errors/AppError');

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
                nombre: muestra.cliente.nombre,
                documento: muestra.cliente.documento
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
    const resultado = await Resultado.findById(idResultado);
    if (!resultado) {
        throw new ValidationError('Resultado no encontrado');
    }

    if (resultado.estado === 'Verificado') {
        throw new ValidationError('No se puede modificar un resultado verificado');
    }

    // Registrar el cambio en el historial
    const cambio = {
        usuario: usuario._id,
        detalles: {
            resultadosAnteriores: resultado.resultados,
            resultadosNuevos: datosActualizacion.resultados
        }
    };

    if (datosActualizacion.observaciones) {
        cambio.observaciones = datosActualizacion.observaciones;
    }

    // Actualizar los datos
    if (datosActualizacion.resultados) {
        resultado.resultados = datosActualizacion.resultados;
    }
    
    if (datosActualizacion.observaciones) {
        resultado.observaciones = datosActualizacion.observaciones;
    }

    resultado.historialCambios.push(cambio);
    
    await resultado.save();
    return resultado;
};

module.exports = {
    registrarResultado,
    obtenerResultadoPorId,
    verificarResultado,
    eliminarResultado,
    obtenerResultadosPorMuestra,
    actualizarResultado
};
