const { validationResult } = require('express-validator');
const { ResponseHandler } = require('../../../shared/utils/responseHandler');
const { ValidationError, NotFoundError } = require('../../../shared/errors/AppError');
const { Muestra, estadosValidos, TipoAgua, TIPOS_AGUA, SUBTIPOS_RESIDUAL } = require('../../../shared/models/muestrasModel');
const { getAnalisisPorTipoAgua, analisisDisponibles } = require('../../../shared/data/analisisData');
const Usuario = require('../../../shared/models/usuarioModel');
const { validarUsuario } = require('../services/usuariosService');
const muestrasService = require('../services/muestrasService');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { formatPaginationResponse } = require('../../../shared/middleware/paginationMiddleware');
const AuditoriaService = require('../../auditoria/services/auditoriaService');

// URL base para las peticiones a la API de usuarios
const BASE_URL = 'https://backend-sena-lab-1-qpzp.onrender.com';

// Función para formatear precio con separadores de miles
const formatearPrecio = (precio) => {
    if (!precio) return "0";
    return precio.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// Función para formatear precio en formato de moneda colombiana
const formatearPrecioCOP = (precio) => {
    if (!precio) return "$0";
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(precio);
};

//Funciones de Utilidad 
const obtenerDatosUsuario = (req) => {
    if (!req.usuario) {
        throw new ValidationError('Usuario no autenticado');
    }
    return {
        id: req.usuario.id,
        documento: req.usuario.documento,
        nombre: req.usuario.nombre,
        email: req.usuario.email,
        rol: req.usuario.rol
    };
};

const normalizarCampos = (datos) => {
    // Normalizar tipo de análisis
    if (datos.tipoAnalisis) {
        datos.tipoAnalisis = datos.tipoAnalisis.charAt(0).toUpperCase() + 
                            datos.tipoAnalisis.slice(1).toLowerCase();
        if (datos.tipoAnalisis === 'Fisicoquimico') {
            datos.tipoAnalisis = 'Fisicoquímico';
        }
    }

    // Normalizar preservación
    if (datos.preservacionMuestra) {
        datos.preservacionMuestra = datos.preservacionMuestra.charAt(0).toUpperCase() + 
                                  datos.preservacionMuestra.slice(1).toLowerCase();
        if (datos.preservacionMuestra === 'Refrigeracion') {
            datos.preservacionMuestra = 'Refrigeración';
        }
    }

    // Normalizar tipo de agua
    if (datos.tipoDeAgua?.tipo) {
        datos.tipoDeAgua.tipo = datos.tipoDeAgua.tipo.toLowerCase();
    }

    return datos;
};

const validarDatosMuestra = (datos) => {
    const errores = [];    // Si la muestra está rechazada, en cotización o aceptada, solo validar campos básicos
    if (datos.estado === 'Rechazada' || datos.estado === 'En Cotizacion' || datos.estado === 'Aceptada') {
        if (!datos.documento) errores.push('El documento es requerido');
        if (!datos.tipoDeAgua?.tipo) errores.push('El tipo de agua es requerido');
        if (!datos.lugarMuestreo) errores.push('El lugar de muestreo es requerido');
        if (datos.estado === 'Rechazada' && !datos.observaciones) {
            errores.push('El motivo de rechazo es requerido');
        }
        
        if (errores.length > 0) {
            throw new ValidationError(errores.join('. '));
        }
        return;
    }

    // 1. Documento
    if (!datos.documento) errores.push('El documento es requerido');
    
    // 2. Tipo de Agua
    if (!datos.tipoDeAgua?.tipo) errores.push('El tipo de agua es requerido');
    if (!datos.tipoDeAgua?.codigo) errores.push('El código del tipo de agua es requerido');
    if (!datos.tipoDeAgua?.descripcion) errores.push('La descripción del tipo de agua es requerida');
    
    // Validación específica para agua residual
    if (datos.tipoDeAgua?.tipo === TIPOS_AGUA.RESIDUAL) {
        if (!datos.tipoDeAgua?.subtipoResidual) {
            errores.push('Para agua residual debe especificar si es doméstica o no doméstica');
        } else if (!Object.values(SUBTIPOS_RESIDUAL).includes(datos.tipoDeAgua.subtipoResidual)) {
            errores.push('El subtipo de agua residual debe ser "domestica" o "no_domestica"');
        }
    }
    
    // 3. Lugar de Muestreo
    if (!datos.lugarMuestreo) errores.push('El lugar de muestreo es requerido');
    
    // 4. Fecha y Hora de Muestreo
    if (!datos.fechaHoraMuestreo) errores.push('La fecha y hora de muestreo son requeridas');
    
    // 5. Tipo de Análisis
    if (!datos.tipoAnalisis) errores.push('El tipo de análisis es requerido');
    
    // 7. Plan de Muestreo
    if (!datos.planMuestreo) errores.push('El plan de muestreo es requerido');
    
    // 8. Condiciones Ambientales
    if (!datos.condicionesAmbientales) {
        errores.push('Las condiciones ambientales son requeridas');
    }
    
    // 9. Preservación de la Muestra
    if (!datos.preservacionMuestra) {
        errores.push('El método de preservación es requerido');
    } else if (datos.preservacionMuestra === 'Otro' && !datos.descripcion) {
        errores.push('Debe especificar el método de preservación cuando selecciona "Otro"');
    }
    
    // 10. Análisis Seleccionados
    if (!Array.isArray(datos.analisisSeleccionados) || datos.analisisSeleccionados.length === 0) {
        errores.push('Debe seleccionar al menos un análisis');
    }    // Validar firmas solo si no es una muestra rechazada, en cotización o aceptada
    if (datos.estado !== 'Rechazada' && datos.estado !== 'En Cotizacion' && datos.estado !== 'Aceptada' && datos.estado !== 'Pendiente') {
        if (!datos.firmas?.firmaAdministrador?.firma) {
            errores.push('La firma del administrador es requerida');
        }
        if (!datos.firmas?.firmaCliente?.firma) {
            errores.push('La firma del cliente es requerida');
        }
    }

    if (errores.length > 0) {
        throw new ValidationError(errores.join('. '));
    }
};

const validarRolAdministrador = (usuario) => {
    if (!usuario || !usuario.rol) {
        throw new ValidationError('Usuario no autenticado o sin rol definido');
    }

    if (usuario.rol !== 'administrador') {
        throw new ValidationError('Se requieren permisos de administrador');
    }

    return true;
};

// Controladores de Usuarios
const validarUsuarioController = async (req, res) => {
    try {
        const { documento } = req.query;
        
        if (!documento) {
            return ResponseHandler.error(res, new ValidationError('El documento es requerido'));
        }

        const resultado = await validarUsuario(documento);
        return ResponseHandler.success(res, resultado, 'Usuario validado correctamente');
    } catch (error) {
        console.error('Error en validarUsuarioController:', error);
        return ResponseHandler.error(res, error);
    }
};

//Tipos de Agua 
const obtenerTiposAgua = async (req, res, next) => {
    try {
        const tiposAgua = await TipoAgua.find({ activo: true });
        ResponseHandler.success(res, { tiposAgua }, 'Tipos de agua obtenidos exitosamente');
    } catch (error) {
        next(error);
    }
};

const crearTipoAgua = async (req, res, next) => {
    try {
        const { tipo, descripcion } = req.body;
        
        if (!tipo || !descripcion) {
            throw new ValidationError('Tipo y descripción son requeridos');
        }

        const tipoAgua = new TipoAgua({
            tipo: tipo.toLowerCase(),
            descripcion
        });

        await tipoAgua.save();
        ResponseHandler.success(res, { tipoAgua }, 'Tipo de agua creado exitosamente', 201);
    } catch (error) {
        next(error);
    }
};

const actualizarTipoAgua = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { descripcion, activo } = req.body;

        const tipoAgua = await TipoAgua.findByIdAndUpdate(
            id,
            { descripcion, activo },
            { new: true }
        );

        if (!tipoAgua) {
            throw new ValidationError('Tipo de agua no encontrado');
        }

        ResponseHandler.success(res, { tipoAgua }, 'Tipo de agua actualizado exitosamente');
    } catch (error) {
        next(error);
    }
};

//Controladores de Muestras
const formatearFechaHora = (fecha) => {
    if (!fecha) return null;
    
    try {
        // Asegurarnos de que la fecha sea un objeto Date
        const fechaObj = new Date(fecha);
        
        // Convertir a zona horaria de Colombia (America/Bogota)
        const fechaColombiana = new Date(fechaObj.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
        
        // Formatear fecha
        const dia = fechaColombiana.getDate().toString().padStart(2, '0');
        const mes = (fechaColombiana.getMonth() + 1).toString().padStart(2, '0');
        const año = fechaColombiana.getFullYear();
        
        // Formatear hora en formato 24 horas para consistencia
        const horas = fechaColombiana.getHours().toString().padStart(2, '0');
        const minutos = fechaColombiana.getMinutes().toString().padStart(2, '0');
        const segundos = fechaColombiana.getSeconds().toString().padStart(2, '0');
        
        return {
            fecha: `${dia}/${mes}/${año}`,
            hora: `${horas}:${minutos}:${segundos}`,
            // Agregar timestamp ISO para el frontend
            timestamp: fechaColombiana.toISOString()
        };
    } catch (error) {
        console.error('Error al formatear fecha:', error);
        return null;
    }
};

const obtenerMuestras = async (req, res, next) => {
    try {
        const { 
            id_muestra,
            tipo,
            estado,
            fechaInicio,
            fechaFin,
            cliente
        } = req.query;

        let filtro = {};

        // Aplicar filtros si se proporcionan
        if (id_muestra) filtro.id_muestra = id_muestra;
        if (tipo) filtro['tipoDeAgua.tipo'] = tipo;
        if (estado) filtro.estado = estado;
        if (cliente) filtro['cliente.documento'] = cliente;
        if (fechaInicio || fechaFin) {
            filtro.fechaHoraMuestreo = {};
            if (fechaInicio) filtro.fechaHoraMuestreo.$gte = new Date(fechaInicio);
            if (fechaFin) filtro.fechaHoraMuestreo.$lte = new Date(fechaFin);
        }

        // Configurar el ordenamiento
        const sort = {};
        if (req.pagination && req.pagination.sortBy) {
            sort[req.pagination.sortBy] = req.pagination.sortOrder === 'desc' ? -1 : 1;
        } else {
            // Ordenamiento por defecto
            sort.createdAt = -1;
        }

        // Ejecutar las consultas en paralelo
        const [muestras, total] = await Promise.all([
            Muestra.find(filtro)
                .select('id_muestra tipoDeAgua lugarMuestreo fechaHoraMuestreo estado cliente tipoMuestreo tipoAnalisis identificacionMuestra planMuestreo condicionesAmbientales preservacionMuestra analisisSeleccionados rechazoMuestra observaciones firmas historial creadoPor actualizadoPor createdAt updatedAt precioTotal')
                .sort(sort)
                .skip(req.pagination?.skip || 0)
                .limit(req.pagination?.limit || 10)
                .lean(),
            Muestra.countDocuments(filtro)
        ]);

        // Formatear las fechas en los resultados
        const muestrasFormateadas = muestras.map(muestra => {
            const muestraFormateada = {
                ...muestra,
                fechaHoraMuestreo: formatearFechaHora(muestra.fechaHoraMuestreo),
                historial: Array.isArray(muestra.historial) ? muestra.historial.map(h => ({
                    ...h,
                    fechaCambio: formatearFechaHora(h.fechaCambio)
                })) : [],
                createdAt: formatearFechaHora(muestra.createdAt),
                updatedAt: formatearFechaHora(muestra.updatedAt),
                creadoPor: muestra.creadoPor ? {
                    ...muestra.creadoPor,
                    fechaCreacion: formatearFechaHora(muestra.createdAt)
                } : null,
                precioTotal: formatearPrecio(muestra.precioTotal),
                analisisSeleccionados: Array.isArray(muestra.analisisSeleccionados) ? 
                    muestra.analisisSeleccionados.map(analisis => ({
                        ...analisis,
                        precio: formatearPrecioCOP(analisis.precio)
                    })) : []
            };            // Eliminar el campo firmas si la muestra está rechazada, en cotización o aceptada
            if (muestra.estado === 'Rechazada' || muestra.estado === 'En Cotizacion' || muestra.estado === 'Aceptada') {
                delete muestraFormateada.firmas;
            }

            return muestraFormateada;
        });

        // Formatear la respuesta con paginación
        const respuesta = req.pagination ? 
            formatPaginationResponse(muestrasFormateadas, total, req.pagination) : 
            {
                data: muestrasFormateadas,
                total
            };

        ResponseHandler.success(res, respuesta, 'Muestras obtenidas correctamente');
    } catch (error) {
        console.error('Error al obtener muestras:', error);
        next(error);
    }
};

const obtenerDatosUsuarioExterno = async (documento) => {
    if (!documento) {
        console.log('No se proporcionó documento para obtener datos de usuario');
        return {
            nombre: 'Usuario no identificado',
            documento: 'No disponible'
        };
    }

    try {
        console.log(`Consultando API externa para documento: ${documento}`);
        let userData;

        // Primero intentar con la ruta específica de roles
        try {
            const responseRoles = await axios.get(`${BASE_URL}/api/usuarios/roles/${documento}`);
            if (responseRoles.data && responseRoles.data.nombre) {
                userData = responseRoles.data;
                console.log('Usuario encontrado en API (roles):', userData);
            }
        } catch (rolesError) {
            console.log('No se encontró en roles, intentando ruta general');
        }

        // Si no se encontró en roles, intentar con la ruta general
        if (!userData) {
            try {
                const response = await axios.get(`${BASE_URL}/api/usuarios`, {
                    params: { documento }
                });
                console.log('Respuesta de la API general:', response.data);

                if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                    userData = response.data[0];
                    console.log('Usuario encontrado en API general:', userData);
                }
            } catch (apiError) {
                console.log('Error al consultar API general:', apiError.message);
            }
        }

        // Si aún no tenemos datos, buscar en la base de datos local
        if (!userData) {
            console.log('Buscando en base de datos local');
            const usuarioLocal = await Usuario.findOne({ documento }).lean();
            if (usuarioLocal) {
                userData = usuarioLocal;
                console.log('Usuario encontrado en base de datos local:', userData);
            }
        }

        // Si encontramos datos del usuario, devolverlos
        if (userData) {
            return {
                _id: userData._id,
                nombre: userData.nombre || 'Usuario no identificado',
                documento: userData.documento,
                email: userData.email || '',
                telefono: userData.telefono || '',
                direccion: userData.direccion || ''
            };
        }

        // Si no se encontró el usuario en ninguna fuente
        console.log(`No se encontró usuario para documento: ${documento}, usando valor por defecto`);
        return {
            nombre: 'Usuario no identificado',
            documento: documento
        };
    } catch (error) {
        console.error('Error al obtener datos del usuario:', error.message);
        return {
            nombre: 'Usuario no identificado',
            documento: documento
        };
    }
};

const obtenerMuestra = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // Usar el servicio para obtener la muestra
        const muestra = await muestrasService.obtenerMuestra(id);
        
        // Retornar la muestra exactamente como está en la base de datos
        ResponseHandler.success(res, { muestra }, 'Muestra obtenida correctamente');
    } catch (error) {
        next(error);
    }
};

// Función para procesar análisis y calcular precio total
const procesarAnalisisYPrecio = (analisisSeleccionados) => {
    let analisisLimpios = [];
    let precioTotal = 0;

    if (analisisSeleccionados && Array.isArray(analisisSeleccionados)) {
        analisisLimpios = analisisSeleccionados.map(analisis => {
            // Asegurarse de que el precio sea un número
            const precio = typeof analisis.precio === 'string' ? 
                parseInt(analisis.precio.replace(/[^0-9]/g, '')) : 
                (analisis.precio || 0);
            
            // Acumular el precio total
            precioTotal += precio;

            return {
                nombre: analisis.nombre,
                precio: precio,
                unidad: analisis.unidad,
                metodo: analisis.metodo,
                rango: analisis.rango
            };
        });
    }

    return { analisisLimpios, precioTotal };
};

const registrarMuestra = async (req, res, next) => {
    try {
        const datos = req.body;
        
        // Verificar que el usuario esté autenticado
        if (!req.usuario) {
            throw new ValidationError('Usuario no autenticado');
        }        // Solo verificar rol de administrador si no es una cotización o aceptada
        if (datos.estado !== 'En Cotizacion' && datos.estado !== 'Aceptada' && (!req.usuario || req.usuario.rol !== 'administrador')) {
            throw new ValidationError('No tiene permisos para registrar muestras. Se requiere rol de administrador');
        }

        // Procesar análisis y calcular precio total
        const { analisisLimpios, precioTotal } = procesarAnalisisYPrecio(datos.analisisSeleccionados);

        console.log('Análisis seleccionados:', analisisLimpios);
        console.log('Precio total calculado:', precioTotal);        // Determinar el estado inicial de la muestra
        const esRechazada = datos.estado === 'Rechazada';
        const esCotizada = datos.estado === 'En Cotizacion';
        const esAceptada = datos.estado === 'Aceptada';
        
        let estadoInicial;
        if (esRechazada) {
            estadoInicial = 'Rechazada';
        } else if (esCotizada) {
            estadoInicial = 'En Cotizacion';
        } else if (esAceptada) {
            estadoInicial = 'Aceptada';
        } else {
            estadoInicial = 'Recibida';
        }

        // Validar que el estado sea válido
        if (!estadosValidos.includes(estadoInicial)) {
            throw new ValidationError(`Estado no válido: ${estadoInicial}. Los estados válidos son: ${estadosValidos.join(', ')}`);
        }

        const motivoRechazo = esRechazada ? datos.observaciones : '';

        // Verificar que tenemos el ID del usuario
        if (!req.usuario || !req.usuario.id) {
            throw new ValidationError('Usuario no autenticado o ID no disponible');
        }

        // Obtener datos del usuario que crea la muestra
        const datosUsuario = {
            nombre: req.usuario.nombre || 'Usuario no identificado',
            documento: req.usuario.documento,
            email: req.usuario.email,
            telefono: req.usuario.telefono,
            direccion: req.usuario.direccion,
            rol: req.usuario.rol
        };
        
        console.log('Datos del usuario desde token:', datosUsuario);

        // Obtener datos del cliente
        let datosCliente;
        if (req.usuario.rol === 'cliente') {
            // Si es cliente, usar sus propios datos
            datosCliente = {
                _id: req.usuario.id,
                nombre: req.usuario.nombre,
                documento: req.usuario.documento,
                email: req.usuario.email,
                telefono: req.usuario.telefono,
                direccion: req.usuario.direccion
            };
        } else {
            // Si es administrador, buscar datos del cliente
            try {
                console.log('Consultando datos del cliente con documento:', datos.documento);
                
                const response = await axios.get(`${BASE_URL}/api/usuarios/buscar`, {
                    params: { documento: datos.documento },
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('Respuesta de la API de usuarios:', response.data);
                
                if (response.data && response.data.nombre) {
                    datosCliente = {
                        _id: response.data._id,
                        nombre: response.data.nombre,
                        documento: response.data.documento,
                        email: response.data.email,
                        telefono: response.data.telefono,
                        direccion: response.data.direccion
                    };
                    console.log('Datos del cliente encontrados:', datosCliente);
                } else {
                    console.log('No se encontraron datos del cliente, usando valores por defecto');
                    datosCliente = {
                        nombre: 'Cliente no identificado',
                        documento: datos.documento
                    };
                }
            } catch (error) {
                console.error('Error al obtener datos del cliente:', error.response?.data || error.message);
                datosCliente = {
                    nombre: 'Cliente no identificado',
                    documento: datos.documento
                };
            }
        }

        if (!datosCliente) {
            datosCliente = {
                documento: datos.documento,
                nombre: 'Cliente no identificado'
            };
        }

        // Generar ID único de muestra
        const fecha = new Date();
        const año = fecha.getFullYear().toString().slice(-2);
        const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const dia = fecha.getDate().toString().padStart(2, '0');
        
        // Obtener el último consecutivo del día
        const ultimaMuestra = await Muestra.findOne({
            id_muestra: new RegExp(`^${datos.tipoDeAgua.codigo}${datos.tipoAnalisis.charAt(0)}${año}${mes}${dia}`)
        }).sort({ id_muestra: -1 });
        
        let consecutivo = '001';
        if (ultimaMuestra) {
            const ultimoConsecutivo = parseInt(ultimaMuestra.id_muestra.slice(-3));
            consecutivo = (ultimoConsecutivo + 1).toString().padStart(3, '0');
        }
        
        const id_muestra = `${datos.tipoDeAgua.codigo}${datos.tipoAnalisis.charAt(0)}${año}${mes}${dia}${consecutivo}`;

        // Crear la muestra con los datos formateados correctamente
        const muestra = new Muestra({
            ...datos,
            id_muestra,
            cliente: datosCliente,
            estado: estadoInicial,
            preservacionMuestra: datos.preservacionMuestra,
            descripcion: datos.descripcion,
            precioTotal,
            analisisSeleccionados: analisisLimpios,
            rechazoMuestra: esRechazada ? {
                rechazada: true,
                motivo: motivoRechazo,
                fechaRechazo: new Date()
            } : {
                rechazada: false,
                motivo: null,
                fechaRechazo: null
            },
            creadoPor: {
                _id: new mongoose.Types.ObjectId(),
                nombre: datosUsuario.nombre,
                documento: datosUsuario.documento,
                email: datosUsuario.email,
                rol: datosUsuario.rol,
                fechaCreacion: formatearFechaHora(fecha)
            },
            historial: [{
                estado: estadoInicial,
                usuario: {
                    _id: new mongoose.Types.ObjectId(),
                    nombre: datosUsuario.nombre,
                    documento: datosUsuario.documento,
                    email: datosUsuario.email,
                    rol: datosUsuario.rol
                },
                fechaCambio: new Date(),
                observaciones: esRechazada ? motivoRechazo :                             (esCotizada ? 'Muestra en proceso de cotización' : 
                             (esAceptada ? 'Cotización aceptada, pendiente recepción' : 
                             'Muestra recibida'))
            }],
            actualizadoPor: []
        });

        // Guardar la muestra
        const muestraGuardada = await muestra.save();
         //AUDITORIAS
         setImmediate(async () => {
            try {
                await AuditoriaService.registrarAccion({
                    usuario: req.usuario,
                    accion: {
                        descripcion: 'registro nueva muestra',
                        tipo: 'POST',
                        modulo: 'muestras',
                        criticidad: muestraGuardada.estado === 'Rechazada' ? 'alta' : 'media'
                    },
                    detalles: {
                        id_muestra: muestraGuardada.id_muestra,
                        cliente: muestraGuardada.cliente,
                        tipoDeAgua: muestraGuardada.tipoDeAgua,
                        tipoMuestreo: muestraGuardada.tipoMuestreo,
                        lugarMuestreo: muestraGuardada.lugarMuestreo,
                        fechaHoraMuestreo: muestraGuardada.fechaHoraMuestreo,
                        tipoAnalisis: Array.isArray(muestraGuardada.tipoAnalisis) ? muestraGuardada.tipoAnalisis[0] : muestraGuardada.tipoAnalisis,
                        identificacionMuestra: muestraGuardada.identificacionMuestra,
                        planMuestreo: muestraGuardada.planMuestreo,
                        condicionesAmbientales: muestraGuardada.condicionesAmbientales,
                        preservacionMuestra: muestraGuardada.preservacionMuestra,
                        estado: muestraGuardada.estado,
                        analisisSeleccionados: muestraGuardada.analisisSeleccionados,
                        precioTotal: muestraGuardada.precioTotal,
                        observaciones: muestraGuardada.observaciones,
                        firmas: muestraGuardada.firmas,
                        metadata: {
                            version: '1.1',
                            entorno: process.env.NODE_ENV || 'development',
                            creacion: muestraGuardada.createdAt,
                            creadoPor: muestraGuardada.creadoPor
                        }
                    },
                    fecha: new Date()
                });
            } catch (error) {
                console.error('[AUDITORIA ERROR]', error.message);
            }
        });

        // Preparar la respuesta simplificada
        const respuesta = {
            id_muestra: muestraGuardada.id_muestra,
            _id: muestraGuardada._id,
            cliente: {
                _id: muestraGuardada.cliente._id,
                nombre: muestraGuardada.cliente.nombre,
                documento: muestraGuardada.cliente.documento,
                email: muestraGuardada.cliente.email,
                telefono: muestraGuardada.cliente.telefono,
                direccion: muestraGuardada.cliente.direccion
            },
            tipoDeAgua: {
                tipo: muestraGuardada.tipoDeAgua.tipo,
                codigo: muestraGuardada.tipoDeAgua.codigo,
                descripcion: muestraGuardada.tipoDeAgua.descripcion
            },
            tipoMuestreo: muestraGuardada.tipoMuestreo,
            lugarMuestreo: muestraGuardada.lugarMuestreo,
            fechaHoraMuestreo: formatearFechaHora(muestraGuardada.fechaHoraMuestreo),
            tipoAnalisis: muestraGuardada.tipoAnalisis,
            identificacionMuestra: muestraGuardada.identificacionMuestra,
            planMuestreo: muestraGuardada.planMuestreo,
            condicionesAmbientales: muestraGuardada.condicionesAmbientales,
            preservacionMuestra: muestraGuardada.preservacionMuestra,
            analisisSeleccionados: Array.isArray(muestraGuardada.analisisSeleccionados) ? 
                muestraGuardada.analisisSeleccionados.map(analisis => ({
                    nombre: analisis.nombre,
                    precio: formatearPrecioCOP(analisis.precio),
                    unidad: analisis.unidad,
                    metodo: analisis.metodo,
                    rango: analisis.rango
                })) : [],
            estado: muestraGuardada.estado,
            rechazoMuestra: {
                rechazada: muestraGuardada.rechazoMuestra.rechazada,
                motivo: muestraGuardada.rechazoMuestra.motivo,
                fechaRechazo: muestraGuardada.rechazoMuestra.fechaRechazo
            },
            observaciones: muestraGuardada.observaciones,
            historial: Array.isArray(muestraGuardada.historial) ? 
                muestraGuardada.historial.map(h => ({
                    estado: h.estado,
                    usuario: {
                        _id: h.usuario._id,
                        nombre: h.usuario.nombre,
                        documento: h.usuario.documento,
                        email: h.usuario.email,
                        rol: h.usuario.rol
                    },
                    fechaCambio: formatearFechaHora(h.fechaCambio),
                    observaciones: h.observaciones
                })) : [],
            creadoPor: {
                _id: muestraGuardada.creadoPor._id,
                nombre: muestraGuardada.creadoPor.nombre,
                documento: muestraGuardada.creadoPor.documento,
                email: muestraGuardada.creadoPor.email,
                fechaCreacion: formatearFechaHora(muestraGuardada.createdAt)
            },
            actualizadoPor: Array.isArray(muestraGuardada.actualizadoPor) ? 
                muestraGuardada.actualizadoPor.map(a => ({
                    _id: a._id,
                    nombre: a.nombre,
                    documento: a.documento,
                    fecha: formatearFechaHora(a.fecha),
                    accion: a.accion
                })) : [],
            createdAt: formatearFechaHora(muestraGuardada.createdAt),
            updatedAt: formatearFechaHora(muestraGuardada.updatedAt),
            precioTotal: formatearPrecioCOP(muestraGuardada.precioTotal)
        };        // Solo incluir firmas en la respuesta si la muestra no está rechazada, en cotización o aceptada
        if (!esRechazada && !esCotizada && !esAceptada && muestraGuardada.firmas) {
            respuesta.firmas = {
                firmaAdministrador: muestraGuardada.firmas.firmaAdministrador ? {
                    nombre: muestraGuardada.firmas.firmaAdministrador.nombre,
                    documento: muestraGuardada.firmas.firmaAdministrador.documento,
                    firma: muestraGuardada.firmas.firmaAdministrador.firma
                } : null,
                firmaCliente: muestraGuardada.firmas.firmaCliente ? {
                    nombre: muestraGuardada.firmas.firmaCliente.nombre,
                    documento: muestraGuardada.firmas.firmaCliente.documento,
                    firma: muestraGuardada.firmas.firmaCliente.firma
                } : null
            };
        }

        return res.status(201).json({
            success: true,            message: esRechazada ? 'Muestra rechazada exitosamente' : 
                    (esCotizada ? 'Muestra en proceso de cotización exitosamente' : 
                    (esAceptada ? 'Cotización aceptada exitosamente' :
                    'Muestra registrada exitosamente')),
            data: {
                muestra: respuesta
            }
        });

    } catch (error) {
        console.error('Error al registrar muestra:', error);
        if (error instanceof ValidationError) {
            return ResponseHandler.error(res, error);
        }
        return ResponseHandler.error(res, new Error('Error interno al registrar la muestra'));
    }
};

const actualizarMuestra = async (req, res, next) => {
    try {
        const usuario = obtenerDatosUsuario(req);
        const { id } = req.params;
        let datosActualizacion = { ...req.body };

        // Eliminar campos que no se pueden actualizar
        const camposInmutables = ['documento', 'fechaHoraRecepcion', 'tipoAnalisis', 'tipoDeAgua'];
        camposInmutables.forEach(campo => delete datosActualizacion[campo]);

        // Validaciones específicas
        if (datosActualizacion.estado === 'Rechazada' && !datosActualizacion.observaciones) {
            throw new ValidationError('Debe especificar el motivo del rechazo en las observaciones');
        }

        if (datosActualizacion.preservacionMuestra === 'Otro' && !datosActualizacion.descripcion) {
            throw new ValidationError('Debe especificar el método de preservación cuando selecciona "Otro"');
        }

        // Asegurarse de que analisisSeleccionados sea un array si está presente
        if (datosActualizacion.analisisSeleccionados) {
            if (!Array.isArray(datosActualizacion.analisisSeleccionados)) {
                throw new ValidationError('analisisSeleccionados debe ser un array');
            }
        }

        // *** NUEVA LÓGICA: Detectar cambios de estado y enviar notificaciones ***
        let cambioDeEstado = false;
        let estadoAnterior = null;

        // Si se está cambiando el estado, obtener el estado anterior
        if (datosActualizacion.estado) {
            try {
                const muestraActual = await muestrasService.obtenerMuestra(id);
                if (muestraActual && muestraActual.estado !== datosActualizacion.estado) {
                    cambioDeEstado = true;
                    estadoAnterior = muestraActual.estado;
                    console.log(`🔄 [ACTUALIZAR_MUESTRA] Cambio de estado detectado: ${estadoAnterior} → ${datosActualizacion.estado}`);
                }
            } catch (error) {
                console.error('[ACTUALIZAR_MUESTRA] Error al obtener estado anterior:', error.message);
            }
        }

        // Usar el servicio para actualizar la muestra
        const muestra = await muestrasService.actualizarMuestra(id, datosActualizacion, usuario);

        // *** Si hubo cambio de estado, enviar notificación ***
        if (cambioDeEstado) {
            try {
                console.log(`🔔 [ACTUALIZAR_MUESTRA] Enviando notificación para cambio de estado`);
                const { enviarNotificacionCambioEstado } = require('../../notificaciones/services/notificationService');
                
                await enviarNotificacionCambioEstado(
                    muestra.cliente.documento,
                    muestra.id_muestra,
                    estadoAnterior,
                    datosActualizacion.estado,
                    datosActualizacion.observaciones || `Cambio de estado a ${datosActualizacion.estado}`
                );
                console.log(`✅ [ACTUALIZAR_MUESTRA] Notificación enviada exitosamente`);
            } catch (error) {
                console.error('[ACTUALIZAR_MUESTRA] Error al enviar notificación:', error.message);
                // No fallar la actualización por error en notificación
            }
        }

        // Formatear la respuesta
        const respuesta = {
            id_muestra: muestra.id_muestra,
            cliente: muestra.cliente,
            tipoDeAgua: muestra.tipoDeAgua,
            tipoMuestreo: muestra.tipoMuestreo,
            lugarMuestreo: muestra.lugarMuestreo,
            fechaHoraMuestreo: formatearFechaHora(muestra.fechaHoraMuestreo),
            tipoAnalisis: muestra.tipoAnalisis,
            identificacionMuestra: muestra.identificacionMuestra,
            planMuestreo: muestra.planMuestreo,
            condicionesAmbientales: muestra.condicionesAmbientales,
            preservacionMuestra: muestra.preservacionMuestra,
            analisisSeleccionados: Array.isArray(muestra.analisisSeleccionados) ? 
                muestra.analisisSeleccionados.map(analisis => ({
                    nombre: analisis.nombre,
                    precio: formatearPrecioCOP(analisis.precio),
                    unidad: analisis.unidad,
                    metodo: analisis.metodo,
                    rango: analisis.rango
                })) : [],
            estado: muestra.estado,
            rechazoMuestra: muestra.rechazoMuestra,
            observaciones: muestra.observaciones,
            historial: Array.isArray(muestra.historial) ? 
                muestra.historial.map(h => ({
                    estado: h.estado,
                    usuario: h.usuario,
                    fechaCambio: formatearFechaHora(h.fechaCambio),
                    observaciones: h.observaciones
                })) : [],
            createdAt: formatearFechaHora(muestra.createdAt),
            updatedAt: formatearFechaHora(muestra.updatedAt),
            precioTotal: formatearPrecioCOP(muestra.precioTotal)
        };

        // Registrar la acción en auditoría
        setImmediate(async () => {
            try {
                await AuditoriaService.registrarAccion({
                    usuario,
                    accion: {
                        descripcion: 'actualización de muestra'
                    },
                    detalles: {
                        idMuestra: muestra.id_muestra,
                        cambios: datosActualizacion,
                        estadoFinal: muestra.estado
                    }
                });
            } catch (error) {
                console.error('[AUDITORIA ERROR]', error.message);
            }
        });

        ResponseHandler.success(res, { muestra: respuesta }, 'Muestra actualizada exitosamente');
    } catch (error) {
        if (error instanceof ValidationError || error instanceof NotFoundError) {
            return ResponseHandler.error(res, error);
        }
        next(error);
    }
};

const registrarFirma = async (req, res, next) => {
    try {
        const usuario = obtenerDatosUsuario(req);
        validarRolAdministrador(usuario);
        const { id } = req.params;
        const { firmas } = req.body;
        
        // Redirigir la solicitud al controlador de firma-digital
        // Modificar el body para que coincida con lo que espera el controlador de firma-digital
        req.body.id_muestra = id;
        req.body.firmas = firmas;
        
        // Importar y usar el controlador de firma-digital
        const { guardarFirma } = require('../../firma-digital/controllers/firmaController');
        return guardarFirma(req, res);
    } catch (error) {
        next(error);
    }
};

const eliminarMuestra = async (req, res, next) => {
    try {
        const usuario = obtenerDatosUsuario(req);
        const { id } = req.params;
        
        // Usar el servicio para eliminar la muestra
        await muestrasService.eliminarMuestra(id, usuario);

        ResponseHandler.success(res, null, 'Muestra eliminada exitosamente');
    } catch (error) {
        next(error);
    }
};

// Crear una nueva muestra
const crearMuestra = async (req, res) => {
    try {
        const muestra = await muestrasService.crearMuestra(req.body, req.user);
        res.status(201).json(muestra);
    } catch (error) {
        if (error instanceof ValidationError) {
            res.status(400).json({ error: error.message });
        } else if (error instanceof DatabaseError) {
            res.status(500).json({ error: 'Error al crear la muestra' });
        } else {
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
};

// Obtener muestras por tipo y estado
const obtenerMuestrasPorTipoEstado = async (req, res) => {
    try {
        const { tipo, estado } = req.query;
        const muestras = await muestrasService.obtenerMuestras(tipo, estado);
        res.json(muestras);
    } catch (error) {
        if (error instanceof ValidationError) {
            res.status(400).json({ error: error.message });
        } else if (error instanceof DatabaseError) {
            res.status(500).json({ error: 'Error al obtener las muestras' });
        } else {
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
};

const actualizarEstadoMuestra = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        // Validar que el estado sea válido
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({
                success: false,
                message: 'Estado no válido'
            });
        }

        // Obtener la muestra
        const muestra = await Muestra.findById(id);
        if (!muestra) {
            return res.status(404).json({
                success: false,
                message: 'Muestra no encontrada'
            });
        }

        const estadoAnterior = muestra.estado;

        // Actualizar el estado
        muestra.estado = estado;

        // Registrar el cambio en el historial
        muestra.historialEstados.push({
            estado,
            estadoAnterior,
            fecha: new Date(),
            usuario: req.usuario._id,
            observaciones: req.body.observaciones || `Cambio de estado de ${estadoAnterior} a ${estado}`
        });

        // Si la muestra es rechazada, actualizar el campo de rechazo
        if (estado === 'Rechazada') {
            muestra.rechazoMuestra = {
                rechazada: true,
                motivo: req.body.observaciones || 'Muestra rechazada',
                fechaRechazo: new Date()
            };
        }

        await muestra.save();

        res.json({
            success: true,
            message: 'Estado de la muestra actualizado correctamente',
            data: muestra
        });
    } catch (error) {
        console.error('Error al actualizar estado de la muestra:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el estado de la muestra'
        });
    }
};

// Obtener muestras por ID de cliente
const obtenerMuestrasPorCliente = async (req, res, next) => {
    try {
        console.log('Recibida solicitud para obtener muestras de cliente');
        const { identificador } = req.params;
        console.log('Identificador recibido:', identificador);

        const muestras = await muestrasService.obtenerMuestrasPorCliente(identificador);
        
        // Formatear las fechas y datos en los resultados
        const muestrasFormateadas = muestras.map(muestra => ({
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
            fechaHoraMuestreo: formatearFechaHora(muestra.fechaHoraMuestreo),
            tipoAnalisis: muestra.tipoAnalisis,
            identificacionMuestra: muestra.identificacionMuestra,
            planMuestreo: muestra.planMuestreo,
            condicionesAmbientales: muestra.condicionesAmbientales,
            preservacionMuestra: muestra.preservacionMuestra,
            analisisSeleccionados: muestra.analisisSeleccionados.map(analisis => ({
                ...analisis,
                precio: formatearPrecioCOP(analisis.precio)
            })),
            estado: muestra.estado,
            rechazoMuestra: muestra.rechazoMuestra,
            observaciones: muestra.observaciones,
            firmas: muestra.firmas,
            creadoPor: {
                ...muestra.creadoPor,
                fechaCreacion: formatearFechaHora(muestra.createdAt)
            },
            historial: Array.isArray(muestra.historial) ? 
                muestra.historial.map(h => ({
                    ...h,
                    fechaCambio: formatearFechaHora(h.fechaCambio)
                })) : [],
            createdAt: formatearFechaHora(muestra.createdAt),
            updatedAt: formatearFechaHora(muestra.updatedAt),
            precioTotal: formatearPrecioCOP(muestra.precioTotal)
        }));

        console.log(`Se encontraron ${muestrasFormateadas.length} muestras para el cliente`);

        ResponseHandler.success(res, { 
            muestras: muestrasFormateadas,
            total: muestrasFormateadas.length
        }, 'Muestras obtenidas correctamente');
    } catch (error) {
        console.error('Error al obtener muestras por cliente:', error);
        if (error instanceof NotFoundError) {
            return ResponseHandler.error(res, error, 404);
        }
        next(error);
    }
};

module.exports = {
    // Controladores de Usuario
    validarUsuarioController,
    
    // Controladores de Tipos de Agua
    obtenerTiposAgua,
    crearTipoAgua,
    actualizarTipoAgua,
    
    // Controladores de Muestras
    obtenerMuestras,
    obtenerMuestra,
    registrarMuestra,
    actualizarMuestra,
    registrarFirma,
    eliminarMuestra,
    crearMuestra,
    obtenerMuestrasPorTipoEstado,
    actualizarEstadoMuestra,
    obtenerMuestrasPorCliente
};