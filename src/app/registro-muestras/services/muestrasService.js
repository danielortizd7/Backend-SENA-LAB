const { Muestra } = require('../../../shared/models/muestrasModel');
const { NotFoundError, DatabaseError, ValidationError } = require('../../../shared/errors/AppError');
const { analisisDisponibles } = require('../../../shared/data/analisisData');

// Validar rol de usuario
const validarRolUsuario = (usuario) => {
    console.log('Validando rol de usuario:', usuario);
    
    if (!usuario) {
        throw new ValidationError('Usuario no autenticado');
    }

    if (!usuario.rol) {
        throw new ValidationError('No se encontró el rol del usuario');
    }

    const rolesPermitidos = ['administrador', 'laboratorista'];
    const rolUsuario = usuario.rol.toLowerCase();
    
    console.log('Rol del usuario:', rolUsuario);
    console.log('Roles permitidos:', rolesPermitidos);
    
    if (!rolesPermitidos.includes(rolUsuario)) {
        throw new ValidationError(`No tienes permisos para realizar esta acción. Tu rol es: ${rolUsuario}`);
    }

    return true;
};

// Función para calcular el total de análisis seleccionados
const calcularPrecioTotal = (analisisSeleccionados) => {
    let total = 0;
    
    // Obtener todos los análisis disponibles
    const todosLosAnalisis = [
        ...analisisDisponibles.fisicoquimico,
        ...analisisDisponibles.microbiologico
    ];
    
    // Calcular el total sumando los precios de los análisis seleccionados
    analisisSeleccionados.forEach(nombreAnalisis => {
        const analisis = todosLosAnalisis.find(a => a.nombre === nombreAnalisis);
        if (analisis) {
            // Convertir el precio de string con formato "xx,xxx" a número
            const precioNumerico = parseFloat(analisis.precio.replace(/,/g, ''));
            total += precioNumerico;
        }
    });
    
    // Formatear el total al formato colombiano (con comas para miles)
    return total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

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
        console.log('Buscando muestra con ID:', id);
        const muestra = await Muestra.findOne({ id_muestra: id.trim() })
            .collation({ locale: "es", strength: 2 })
            .lean(); // Use lean() to get plain JavaScript object
        
        if (!muestra) {
            console.log('Muestra no encontrada');
            throw new NotFoundError('Muestra no encontrada');
        }
        console.log('Muestra encontrada:', muestra.id_muestra);
        return muestra;
    } catch (error) {
        console.error('Error al obtener la muestra:', error);
        if (error instanceof NotFoundError) {
            throw error;
        }
        throw new DatabaseError('Error al obtener la muestra', error);
    }
};

// Función para procesar firmas
const procesarFirmas = (datosMuestra, usuario) => {
    // Si no hay firmas o el estado es Rechazada, Cotizada o Pendiente, devolver un objeto vacío
    if (!datosMuestra.firmas || 
        datosMuestra.estado === 'Rechazada' || 
        datosMuestra.estado === 'Cotizada' || 
        datosMuestra.estado === 'Pendiente') {
        return {};
    }
    
    return {
        administrador: {
            nombre: usuario.nombre,
            documento: usuario.documento,
            firmaAdministrador: datosMuestra.firmas?.firmaAdministrador?.firma || ''
        },
        cliente: {
            nombre: datosMuestra.cliente.nombre,
            documento: datosMuestra.cliente.documento,
            firmaCliente: datosMuestra.firmas?.firmaCliente?.firma || ''
        }
    };
};

// Función para crear entrada de historial
const crearEntradaHistorial = (estado, usuario, observaciones) => {
    return {
        estado,
        administrador: {
            nombre: usuario.nombre,
            documento: usuario.documento,
            email: usuario.email
        },
        fechaCambio: new Date(),
        observaciones: observaciones || `Estado cambiado a ${estado}`
    };
};

// Crear una nueva muestra
const crearMuestra = async (datosMuestra, usuario) => {
    try {
        // Validar el rol del usuario
        validarRolUsuario(usuario);

        // Normalizar campos
        const datosNormalizados = {
            ...datosMuestra,
            tipoMuestreo: datosMuestra.tipoMuestreo === "Compuesto" ? "Compuesto" : "Simple",
            tipoAnalisis: datosMuestra.tipoAnalisis === "Fisicoquimico" ? "Fisicoquímico" : datosMuestra.tipoAnalisis,
            estado: datosMuestra.estado || 'Pendiente'
        };

        // Validar estado y observaciones para rechazo
        if (datosNormalizados.estado === 'Rechazada' && !datosNormalizados.observaciones) {
            throw new ValidationError('Para rechazar una muestra debe especificar el motivo en las observaciones');
        }

        // Calcular el precio total si no está definido
        if (!datosNormalizados.precioTotal && datosNormalizados.analisisSeleccionados) {
            datosNormalizados.precioTotal = calcularPrecioTotal(datosNormalizados.analisisSeleccionados);
        }

        // Procesar las firmas - No se requieren para cotización o rechazo
        const firmas = (datosNormalizados.estado === 'Rechazada' || 
                       datosNormalizados.estado === 'Cotizada' || 
                       datosNormalizados.estado === 'Pendiente') ? {} : procesarFirmas(datosNormalizados, usuario);

        // Crear el objeto de muestra con los datos normalizados
        const muestra = new Muestra({
            ...datosNormalizados,
            firmas,
            creadoPor: {
                nombre: usuario.nombre,
                documento: usuario.documento,
                email: usuario.email,
                fechaCreacion: new Date()
            },
            historial: [crearEntradaHistorial(
                datosNormalizados.estado,
                usuario,
                datosNormalizados.observaciones || 
                (datosNormalizados.estado === 'Rechazada' ? 'Muestra rechazada' : 
                 datosNormalizados.estado === 'Cotizada' ? 'Muestra en proceso de cotización' : 
                 'Registro inicial de muestra')
            )],
            actualizadoPor: []
        });

        console.log('Intentando guardar muestra:', JSON.stringify(muestra, null, 2));
        
        await muestra.save();
        return muestra;
    } catch (error) {
        console.error('Error completo al crear muestra:', error);
        if (error instanceof ValidationError) {
            throw error;
        }
        if (error.name === 'ValidationError') {
            throw new ValidationError(Object.values(error.errors).map(e => e.message).join(', '));
        }
        throw new DatabaseError('Error al crear la muestra', error);
    }
};

// Actualizar una muestra
const actualizarMuestra = async (id, datosActualizacion, usuario) => {
    try {
        // Validar el rol del usuario
        validarRolUsuario(usuario);

        const idLimpio = id.replace(/[^a-zA-Z0-9-]/g, '');
        console.log('ID de muestra a actualizar (limpio):', idLimpio);

        // Filtrar campos inmutables y agregar validaciones
        const { documento, ...datosActualizados } = datosActualizacion;
        
        // Validar tipoMuestreo si está presente
        if (datosActualizados.tipoMuestreo) {
            const tiposValidos = ['Simple', 'Compuesto', 'Integrado'];
            if (!tiposValidos.includes(datosActualizados.tipoMuestreo)) {
                throw new ValidationError(`Tipo de muestreo no válido. Valores permitidos: ${tiposValidos.join(', ')}`);
            }
        }

        // Calcular el precio total si se están actualizando los análisis seleccionados
        if (datosActualizados.analisisSeleccionados) {
            datosActualizados.precioTotal = calcularPrecioTotal(datosActualizados.analisisSeleccionados);
        }

        // Verificar si la muestra existe antes de actualizar
        const muestraExistente = await Muestra.findOne({ id_muestra: idLimpio });
        if (!muestraExistente) {
            throw new NotFoundError('Muestra no encontrada');
        }

        // Preparar datos para actualizar
        const datosParaActualizar = { ...datosActualizados };
        
        // Si se está rechazando la muestra, actualizar el campo rechazoMuestra
        if (datosActualizacion.estado === 'Rechazada') {
            datosParaActualizar.rechazoMuestra = {
                rechazada: true,
                motivo: datosActualizacion.observaciones,
                fechaRechazo: new Date()
            };
        }

        // Procesar firmas si se están actualizando
        if (datosActualizacion.firmas) {
            datosParaActualizar.firmas = procesarFirmas(datosActualizacion, usuario);
        }

        // Agregar al historial si hay cambio de estado
        if (datosActualizacion.estado && datosActualizacion.estado !== muestraExistente.estado) {
            datosParaActualizar.$push = {
                ...datosParaActualizar.$push,
                historial: crearEntradaHistorial(
                    datosActualizacion.estado,
                    usuario,
                    datosActualizacion.observaciones
                )
            };
        }

        const muestra = await Muestra.findOneAndUpdate(
            { id_muestra: idLimpio },
            { $set: datosParaActualizar },
            { new: true }
        );

        if (!muestra) {
            throw new NotFoundError('Muestra no encontrada');
        }

        return muestra;
    } catch (error) {
        if (error instanceof NotFoundError || error instanceof ValidationError) {
            throw error;
        }
        throw new DatabaseError('Error al actualizar la muestra', error);
    }
};

// Eliminar una muestra
const eliminarMuestra = async (id, usuario) => {
    try {
        // Validar el rol del usuario
        validarRolUsuario(usuario);

        const muestra = await Muestra.findOneAndDelete({ id_muestra: id });
        
        if (!muestra) {
            throw new NotFoundError('Muestra no encontrada');
        }
        return muestra;
    } catch (error) {
        if (error instanceof NotFoundError || error instanceof ValidationError) {
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

// Obtener muestras por cliente
const obtenerMuestrasPorCliente = async (documento) => {
    try {
        if (!documento) {
            throw new ValidationError('El documento del cliente es requerido');
        }

        const muestras = await Muestra.find({ 'cliente.documento': documento })
            .sort({ fechaHoraMuestreo: -1 });

        if (!muestras || muestras.length === 0) {
            throw new NotFoundError('No se encontraron muestras para este cliente');
        }

        return muestras;
    } catch (error) {
        if (error instanceof NotFoundError || error instanceof ValidationError) {
            throw error;
        }
        throw new DatabaseError('Error al obtener las muestras del cliente', error);
    }
};

module.exports = {
    obtenerMuestras,
    obtenerMuestra,
    crearMuestra,
    actualizarMuestra,
    eliminarMuestra,
    obtenerMuestrasPorTipo,
    obtenerMuestrasPorEstado,
    calcularPrecioTotal,
    obtenerMuestrasPorCliente
}; 