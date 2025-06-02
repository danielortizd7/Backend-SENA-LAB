const { ValidationError, NotFoundError, DatabaseError } = require('../../../shared/errors/AppError');
const mongoose = require('mongoose');
const { Muestra } = require('../../../shared/models/muestrasModel');
const { validarRolUsuario } = require('../../../shared/middleware/roles');
const { analisisDisponibles } = require('../../../shared/data/analisisData');
const axios = require('axios');

// URL base para las peticiones a la API de usuarios
const BASE_URL = 'https://backend-sena-lab-1-qpzp.onrender.com';

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
    // Proteger acceso a cliente
    const cliente = datosMuestra.cliente || {};
    return {
        administrador: {
            nombre: usuario.nombre,
            documento: usuario.documento,
            firmaAdministrador: datosMuestra.firmas?.firmaAdministrador?.firma || ''
        },
        cliente: {
            nombre: cliente.nombre || '',
            documento: cliente.documento || '',
            firmaCliente: datosMuestra.firmas?.firmaCliente?.firma || ''
        }
    };
};

// Función para crear entrada de historial
const crearEntradaHistorial = (estado, usuario, observaciones) => {
    return {
        estado,
        administrador: {
            _id: usuario._id || new mongoose.Types.ObjectId(),
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
            estado: datosMuestra.estado || 'Pendiente',
            cliente: {
                _id: datosMuestra.cliente._id || new mongoose.Types.ObjectId(),
                ...datosMuestra.cliente
            }
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
                _id: usuario._id || new mongoose.Types.ObjectId(),
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

        // Registrar la auditoría de forma asíncrona
        setImmediate(async () => {
            try {
                const AuditoriaService = require('../../auditoria/services/auditoriaService');
                await AuditoriaService.registrarAccion({
                    usuario: {
                        id: usuario._id,
                        nombre: usuario.nombre,
                        rol: usuario.rol,
                        documento: usuario.documento
                    },
                    accion: {
                        descripcion: 'registro nueva muestra',
                        tipo: 'POST',
                        modulo: 'muestras',
                        criticidad: datosNormalizados.estado === 'Rechazada' ? 'alta' : 'media'
                    },
                    detalles: {
                        id_muestra: muestra.id_muestra,
                        cliente: {
                            _id: muestra.cliente._id,
                            nombre: muestra.cliente.nombre,
                            documento: muestra.cliente.documento,
                            email: muestra.cliente.email,
                            telefono: muestra.cliente.telefono,
                            direccion: muestra.cliente.direccion
                        },
                        tipoDeAgua: muestra.tipoDeAgua,
                        tipoMuestreo: muestra.tipoMuestreo,
                        lugarMuestreo: muestra.lugarMuestreo,
                        fechaHoraMuestreo: muestra.fechaHoraMuestreo,
                        tipoAnalisis: muestra.tipoAnalisis,
                        identificacionMuestra: muestra.identificacionMuestra,
                        planMuestreo: muestra.planMuestreo,
                        condicionesAmbientales: muestra.condicionesAmbientales,
                        preservacionMuestra: muestra.preservacionMuestra,
                        estado: muestra.estado,
                        observaciones: muestra.observaciones,
                        analisisSeleccionados: muestra.analisisSeleccionados.map(analisis => ({
                            nombre: analisis.nombre,
                            precio: parseFloat(analisis.precio.replace(/[^\d.-]/g, '')),
                            unidad: analisis.unidad,
                            metodo: analisis.metodo,
                            rango: analisis.rango
                        })),
                        precioTotal: parseFloat(muestra.precioTotal.replace(/[^\d.-]/g, '')),
                        firmas: muestra.firmas,
                        rechazoMuestra: muestra.rechazoMuestra,
                        cambios: {
                            antes: null,
                            despues: null
                        },
                        metadata: {
                            version: '1.1',
                            entorno: process.env.NODE_ENV || 'development',
                            createdAt: muestra.createdAt,
                            creadoPor: muestra.creadoPor,
                            historial: muestra.historial
                        }
                    }
                });
            } catch (error) {
                console.error('[AUDITORIA ERROR]', error.message);
            }
        });

        return muestra;
    } catch (error) {
        // Registrar error en auditoría
        setImmediate(async () => {
            try {
                const AuditoriaService = require('../../auditoria/services/auditoriaService');
                await AuditoriaService.registrarAccion({
                    usuario: {
                        id: usuario?._id,
                        nombre: usuario?.nombre,
                        rol: usuario?.rol,
                        documento: usuario?.documento
                    },
                    accion: {
                        descripcion: 'error en creación de muestra',
                        tipo: 'POST',
                        modulo: 'muestras',
                        criticidad: 'alta'
                    },
                    detalles: {
                        error: {
                            mensaje: error.message,
                            tipo: error.constructor.name,
                            stack: error.stack
                        },
                        datosMuestra: {
                            tipoDeAgua: datosMuestra.tipoDeAgua,
                            tipoMuestreo: datosMuestra.tipoMuestreo,
                            lugarMuestreo: datosMuestra.lugarMuestreo,
                            estado: datosMuestra.estado
                        }
                    },
                    estado: 'fallido',
                    mensaje: `Error al crear muestra: ${error.message}`
                });
            } catch (auditError) {
                console.error('[AUDITORIA ERROR]', auditError.message);
            }
        });

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
    let oldData = null;
    try {
        // Verificar que el usuario existe
        if (!usuario) {
            throw new ValidationError('Usuario no proporcionado');
        }

        // Verificar que el usuario tiene un rol válido
        if (!usuario.rol) {
            throw new ValidationError('Usuario sin rol especificado');
        }

        // Verificar que el rol es válido
        const rolesPermitidos = ['administrador', 'laboratorista'];
        if (!rolesPermitidos.includes(usuario.rol.toLowerCase())) {
            throw new ValidationError(`Rol no autorizado para esta acción: ${usuario.rol}`);
        }

        const idLimpio = id.trim();
        console.log('ID de muestra a actualizar (limpio):', idLimpio);
        
        // Obtener datos antiguos para auditoría
        oldData = await Muestra.findOne({ id_muestra: idLimpio }).lean();
        if (!oldData) {
            throw new NotFoundError('Muestra no encontrada');
        }

        // Preparar los datos actualizados
        const datosActualizados = { ...datosActualizacion };

        // Manejar el caso de análisis seleccionados
        if (datosActualizados.analisisSeleccionados) {
            if (!Array.isArray(datosActualizados.analisisSeleccionados)) {
                throw new ValidationError('analisisSeleccionados debe ser un array');
            }

            // Asegurarse de que cada análisis tenga la estructura correcta
            datosActualizados.analisisSeleccionados = datosActualizados.analisisSeleccionados.map(analisis => {
                if (!analisis) return null;
                return {
                    nombre: analisis.nombre || '',
                    precio: analisis.precio || 0,
                    unidad: analisis.unidad || '',
                    metodo: analisis.metodo || '',
                    rango: analisis.rango || ''
                };
            }).filter(analisis => analisis !== null);

            // Recalcular el precio total
            datosActualizados.precioTotal = datosActualizados.analisisSeleccionados.reduce(
                (total, analisis) => total + (typeof analisis.precio === 'string' ? 
                    parseFloat(analisis.precio.replace(/[^\d.-]/g, '')) : 
                    (analisis.precio || 0)), 
                0
            );
        }

        // Manejar fechas
        if (datosActualizados.fechaHoraMuestreo) {
            try {
                if (typeof datosActualizados.fechaHoraMuestreo === 'string') {
                    datosActualizados.fechaHoraMuestreo = new Date(datosActualizados.fechaHoraMuestreo);
                } else if (datosActualizados.fechaHoraMuestreo.timestamp) {
                    datosActualizados.fechaHoraMuestreo = new Date(datosActualizados.fechaHoraMuestreo.timestamp);
                }

                if (isNaN(datosActualizados.fechaHoraMuestreo.getTime())) {
                    throw new ValidationError('Fecha de muestreo inválida');
                }
            } catch (error) {
                throw new ValidationError('Error al procesar la fecha de muestreo: ' + error.message);
            }
        }

        // Manejar el estado y rechazo
        if (datosActualizados.estado === 'Rechazada') {
            if (!datosActualizados.observaciones) {
                throw new ValidationError('Debe especificar el motivo del rechazo en las observaciones');
            }
            datosActualizados.rechazoMuestra = {
                rechazada: true,
                motivo: datosActualizados.observaciones,
                fechaRechazo: new Date()
            };
        }

        // Preparar el historial si hay cambio de estado
        if (datosActualizados.estado && datosActualizados.estado !== oldData.estado) {
            const entradaHistorial = {
                estado: datosActualizados.estado,
                usuario: {
                    _id: usuario._id || new mongoose.Types.ObjectId(),
                    nombre: usuario.nombre,
                    documento: usuario.documento,
                    email: usuario.email,
                    rol: usuario.rol
                },
                fechaCambio: new Date(),
                observaciones: datosActualizados.observaciones || `Estado cambiado a ${datosActualizados.estado}`
            };

            // Si no existe el array de historial, crearlo
            if (!oldData.historial) {
                datosActualizados.historial = [entradaHistorial];
            } else {
                // Usar $push para añadir al array existente
                datosActualizados.$push = { historial: entradaHistorial };
            }
        }

        // Detectar cambios significativos para auditoría
        const cambiosSignificativos = {};
        const camposAuditables = [
            'estado',
            'tipoDeAgua',
            'tipoMuestreo',
            'lugarMuestreo',
            'fechaHoraMuestreo',
            'tipoAnalisis',
            'observaciones',
            'analisisSeleccionados'
        ];

        camposAuditables.forEach(campo => {
            if (datosActualizados[campo] && 
                JSON.stringify(datosActualizados[campo]) !== JSON.stringify(oldData[campo])) {
                cambiosSignificativos[campo] = {
                    antes: oldData[campo],
                    despues: datosActualizados[campo]
                };
            }
        });

        // Realizar la actualización
        console.log('Actualizando muestra con datos:', JSON.stringify(datosActualizados, null, 2));
        
        const muestra = await Muestra.findOneAndUpdate(
            { id_muestra: idLimpio },
            datosActualizados,
            { 
                new: true,
                runValidators: true,
                lean: false
            }
        ).exec();

        if (!muestra) {
            throw new NotFoundError('Muestra no encontrada después de la actualización');
        }

        // Registrar la auditoría de forma asíncrona
        setImmediate(async () => {
            try {
                const AuditoriaService = require('../../auditoria/services/auditoriaService');
                await AuditoriaService.registrarAccion({
                    usuario: {
                        id: usuario._id,
                        nombre: usuario.nombre,
                        rol: usuario.rol,
                        documento: usuario.documento
                    },
                    accion: {
                        descripcion: 'actualización de muestra',
                        tipo: 'PUT',
                        modulo: 'muestras',
                        criticidad: datosActualizados.estado === 'Rechazada' ? 'alta' : 'media'
                    },
                    detalles: {
                        idMuestra: muestra.id_muestra,
                        cliente: muestra.cliente,
                        tipoDeAgua: muestra.tipoDeAgua,
                        lugarMuestreo: muestra.lugarMuestreo,
                        fechaHoraMuestreo: muestra.fechaHoraMuestreo,
                        tipoAnalisis: muestra.tipoAnalisis,
                        estado: muestra.estado,
                        analisisSeleccionados: muestra.analisisSeleccionados,
                        cambios: cambiosSignificativos,
                        metadata: {
                            version: '1.1',
                            entorno: process.env.NODE_ENV || 'development',
                            lastModified: new Date()
                        }
                    }
                });
            } catch (error) {
                console.error('[AUDITORIA ERROR]', error.message);
            }
        });

        return muestra;
    } catch (error) {
        // Registrar error en auditoría
        setImmediate(async () => {
            try {
                const AuditoriaService = require('../../auditoria/services/auditoriaService');
                await AuditoriaService.registrarAccion({
                    usuario: {
                        id: usuario?._id,
                        nombre: usuario?.nombre,
                        rol: usuario?.rol,
                        documento: usuario?.documento
                    },
                    accion: {
                        descripcion: 'error en actualización de muestra',
                        tipo: 'PUT',
                        modulo: 'muestras',
                        criticidad: 'alta'
                    },
                    detalles: {
                        idMuestra: id,
                        error: {
                            mensaje: error.message,
                            tipo: error.constructor.name,
                            stack: error.stack
                        },
                        datosActualizacion: datosActualizacion,
                        estadoAnterior: oldData?.estado
                    },
                    estado: 'fallido',
                    mensaje: `Error al actualizar muestra: ${error.message}`
                });
            } catch (auditError) {
                console.error('[AUDITORIA ERROR]', auditError.message);
            }
        });

        console.error('Error en actualizarMuestra:', error);
        if (error instanceof NotFoundError || error instanceof ValidationError) {
            throw error;
        }
        throw new DatabaseError('Error al actualizar la muestra: ' + error.message, error);
    }
};

// Eliminar una muestra
const eliminarMuestra = async (id, usuario) => {
    let muestraPrevia = null;
    try {
        // Validar el rol del usuario
        validarRolUsuario(usuario);

        // Obtener datos de la muestra antes de eliminar para la auditoría
        muestraPrevia = await Muestra.findOne({ id_muestra: id }).lean();
        if (!muestraPrevia) {
            throw new NotFoundError('Muestra no encontrada');
        }

        const muestra = await Muestra.findOneAndDelete({ id_muestra: id });
        
        if (!muestra) {
            throw new NotFoundError('Muestra no encontrada');
        }

        // Registrar la auditoría de forma asíncrona
        setImmediate(async () => {
            try {
                const AuditoriaService = require('../../auditoria/services/auditoriaService');
                await AuditoriaService.registrarAccion({
                    usuario: {
                        id: usuario._id,
                        nombre: usuario.nombre,
                        rol: usuario.rol,
                        documento: usuario.documento
                    },
                    accion: {
                        descripcion: 'eliminación de muestra',
                        tipo: 'DELETE',
                        modulo: 'muestras',
                        criticidad: 'alta'
                    },
                    detalles: {
                        idMuestra: id,
                        muestraEliminada: {
                            cliente: muestraPrevia.cliente,
                            tipoDeAgua: muestraPrevia.tipoDeAgua,
                            lugarMuestreo: muestraPrevia.lugarMuestreo,
                            fechaHoraMuestreo: muestraPrevia.fechaHoraMuestreo,
                            tipoAnalisis: muestraPrevia.tipoAnalisis,
                            estado: muestraPrevia.estado,
                            analisisSeleccionados: muestraPrevia.analisisSeleccionados
                        },
                        metadata: {
                            version: '1.1',
                            entorno: process.env.NODE_ENV || 'development',
                            fechaEliminacion: new Date(),
                            ultimoEstado: muestraPrevia.estado
                        }
                    }
                });
            } catch (error) {
                console.error('[AUDITORIA ERROR]', error.message);
            }
        });

        return muestra;
    } catch (error) {
        // Registrar error en auditoría
        setImmediate(async () => {
            try {
                const AuditoriaService = require('../../auditoria/services/auditoriaService');
                await AuditoriaService.registrarAccion({
                    usuario: {
                        id: usuario?._id,
                        nombre: usuario?.nombre,
                        rol: usuario?.rol,
                        documento: usuario?.documento
                    },
                    accion: {
                        descripcion: 'error en eliminación de muestra',
                        tipo: 'DELETE',
                        modulo: 'muestras',
                        criticidad: 'alta'
                    },
                    detalles: {
                        idMuestra: id,
                        error: {
                            mensaje: error.message,
                            tipo: error.constructor.name,
                            stack: error.stack
                        },
                        estadoPrevio: muestraPrevia?.estado,
                        metadata: {
                            version: '1.1',
                            entorno: process.env.NODE_ENV || 'development',
                            intentoEliminacion: new Date()
                        }
                    },
                    estado: 'fallido',
                    mensaje: `Error al eliminar muestra: ${error.message}`
                });
            } catch (auditError) {
                console.error('[AUDITORIA ERROR]', auditError.message);
            }
        });

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
const obtenerMuestrasPorCliente = async (identificador) => {
    try {
        console.log('Iniciando búsqueda de muestras para identificador:', identificador);
        
        if (!identificador) {
            console.log('Error: Identificador no proporcionado');
            throw new ValidationError('Se requiere un identificador (documento o ID) del cliente');
        }

        // Construir el filtro de búsqueda
        let filtro = {
            $or: [
                { 'cliente.documento': identificador }
            ]
        };

        // Si el identificador es un ObjectId válido, buscar por _id del cliente
        if (mongoose.Types.ObjectId.isValid(identificador)) {
            console.log('Identificador válido como ObjectId, añadiendo a filtro de cliente._id');
            filtro.$or.push({ 'cliente._id': new mongoose.Types.ObjectId(identificador) });
        }

        console.log('Filtro de búsqueda:', JSON.stringify(filtro, null, 2));

        // Realizar la búsqueda
        const muestras = await Muestra.find(filtro)
            .sort({ fechaHoraMuestreo: -1 })
            .lean(); // Usar lean() para mejor rendimiento

        console.log('Resultado de la búsqueda:', muestras ? `${muestras.length} muestras encontradas` : 'No se encontraron muestras');

        if (!muestras || muestras.length === 0) {
            console.log('No se encontraron muestras para el cliente');
            throw new NotFoundError('No se encontraron muestras para este cliente');
        }

        return muestras;
    } catch (error) {
        console.error('Error en obtenerMuestrasPorCliente:', error);
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