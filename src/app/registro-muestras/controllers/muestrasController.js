const { validationResult } = require('express-validator');
const { ResponseHandler } = require('../../../shared/utils/responseHandler');
const { ValidationError, NotFoundError } = require('../../../shared/errors/AppError');
const { Muestra, estadosValidos, TipoAgua, TIPOS_AGUA, SUBTIPOS_RESIDUAL } = require('../../../shared/models/muestrasModel');
const { getAnalisisPorTipoAgua } = require('../../../shared/models/analisisModel');
const Usuario = require('../../../shared/models/usuarioModel');
const { validarUsuario } = require('../services/usuariosService');
const muestrasService = require('../services/muestrasService');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { formatPaginationResponse } = require('../../../shared/middleware/paginationMiddleware');

// URL base para las peticiones a la API de usuarios
const BASE_URL = 'https://backend-sena-lab-1-qpzp.onrender.com';

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
    const errores = [];

    // Si la muestra está rechazada, solo validar campos básicos
    if (datos.estado === 'Rechazada') {
        if (!datos.documento) errores.push('El documento es requerido');
        if (!datos.tipoDeAgua?.tipo) errores.push('El tipo de agua es requerido');
        if (!datos.lugarMuestreo) errores.push('El lugar de muestreo es requerido');
        if (!datos.observaciones) errores.push('El motivo de rechazo es requerido');
        
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
    }

    // Validar firmas solo si no es una muestra rechazada
    if (datos.estado !== 'Rechazada' && (!datos.firmas?.firmaAdministrador?.firma || !datos.firmas?.firmaCliente?.firma)) {
        errores.push('Se requieren las firmas del administrador y del cliente');
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
        // Convertir a zona horaria de Colombia (America/Bogota)
        const fechaObj = new Date(fecha);
        
        // Formatear fecha
        const dia = fechaObj.getDate().toString().padStart(2, '0');
        const mes = (fechaObj.getMonth() + 1).toString().padStart(2, '0');
        const año = fechaObj.getFullYear();
        
        // Formatear hora en formato AM/PM
        let horas = fechaObj.getHours();
        const minutos = fechaObj.getMinutes().toString().padStart(2, '0');
        const segundos = fechaObj.getSeconds().toString().padStart(2, '0');
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
        sort[req.pagination.sortBy] = req.pagination.sortOrder === 'desc' ? -1 : 1;

        // Ejecutar las consultas en paralelo
        const [muestras, total] = await Promise.all([
            Muestra.find(filtro)
                .select('id_muestra tipoDeAgua lugarMuestreo fechaHoraMuestreo estado cliente tipoMuestreo tipoAnalisis identificacionMuestra planMuestreo condicionesAmbientales preservacionMuestra analisisSeleccionados rechazoMuestra observaciones firmas historial creadoPor actualizadoPor createdAt updatedAt')
                .sort(sort)
                .skip(req.pagination.skip)
                .limit(req.pagination.limit)
                .lean(),
            Muestra.countDocuments(filtro)
        ]);

        // Formatear las fechas en los resultados
        const muestrasFormateadas = muestras.map(muestra => {
            const muestraFormateada = {
                ...muestra,
                fechaHoraMuestreo: formatearFechaHora(muestra.fechaHoraMuestreo),
                historial: muestra.historial.map(h => ({
                    ...h,
                    fechaCambio: formatearFechaHora(h.fechaCambio)
                })),
                createdAt: formatearFechaHora(muestra.createdAt),
                updatedAt: formatearFechaHora(muestra.updatedAt),
                creadoPor: {
                    ...muestra.creadoPor,
                    fechaCreacion: formatearFechaHora(muestra.createdAt)
                }
            };

            // Eliminar el campo firmas si la muestra está rechazada
            if (muestra.estado === 'Rechazada') {
                delete muestraFormateada.firmas;
            }

            return muestraFormateada;
        });

        // Formatear la respuesta con paginación
        const respuesta = formatPaginationResponse(
            muestrasFormateadas,
            total,
            req.pagination
        );

        ResponseHandler.success(res, respuesta, 'Muestras obtenidas correctamente');
    } catch (error) {
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
        const muestra = await Muestra.findOne({ id_muestra: id })
            .populate('creadoPor', 'nombre email documento')
            .lean();

        if (!muestra) {
            throw new NotFoundError('Muestra no encontrada');
        }

        // Formatear la fecha y actualizar datos de usuarios
        const muestraFormateada = {
            ...muestra,
            fechaHoraMuestreo: formatearFechaHora(muestra.fechaHoraMuestreo),
            historial: muestra.historial.map(h => ({
                ...h,
                fechaCambio: formatearFechaHora(h.fechaCambio)
            })),
            createdAt: formatearFechaHora(muestra.createdAt),
            updatedAt: formatearFechaHora(muestra.updatedAt),
            creadoPor: {
                ...muestra.creadoPor,
                fechaCreacion: formatearFechaHora(muestra.createdAt)
            }
        };

        // Eliminar el campo firmas si la muestra está rechazada
        if (muestra.estado === 'Rechazada') {
            delete muestraFormateada.firmas;
        }

        ResponseHandler.success(res, { muestra: muestraFormateada }, 'Muestra obtenida correctamente');
    } catch (error) {
        next(error);
    }
};

const registrarMuestra = async (req, res, next) => {
    try {
        const datos = req.body;
        
        // Verificar que el usuario sea administrador
        if (!req.usuario || req.usuario.rol !== 'administrador') {
            throw new ValidationError('No tiene permisos para registrar muestras. Se requiere rol de administrador');
        }
        
        // Validar los datos de la muestra
        validarDatosMuestra(datos);

        // Verificar que tenemos el ID del usuario
        if (!req.usuario || !req.usuario.id) {
            throw new ValidationError('Usuario no autenticado o ID no disponible');
        }

        // Obtener datos del administrador directamente del token
        const datosAdministrador = {
            nombre: req.usuario.nombre || 'Usuario no identificado',
            documento: req.usuario.documento,
            email: req.usuario.email,
            telefono: req.usuario.telefono,
            direccion: req.usuario.direccion
        };
        
        console.log('Datos del administrador desde token:', datosAdministrador);

        // Obtener datos del cliente desde la API de usuarios
        let datosCliente;
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

        // Determinar si la muestra está siendo rechazada
        const esRechazada = datos.estado === 'Rechazada';
        const motivoRechazo = esRechazada ? datos.observaciones : '';

        // Crear la muestra con los datos formateados correctamente
        const muestra = new Muestra({
            ...datos,
            id_muestra,
            cliente: datosCliente,
            estado: esRechazada ? 'Rechazada' : 'Recibida',
            preservacionMuestra: datos.preservacionMuestra,
            descripcion: datos.descripcion,
            rechazoMuestra: {
                rechazada: esRechazada,
                motivo: motivoRechazo,
                fechaRechazo: esRechazada ? new Date() : null
            },
            firmas: {
                administrador: {
                    nombre: datosAdministrador.nombre,
                    documento: datosAdministrador.documento,
                    firmaAdministrador: esRechazada ? '' : (datos.firmas?.firmaAdministrador?.firma || '')
                },
                cliente: {
                    nombre: datosCliente.nombre,
                    documento: datosCliente.documento,
                    firmaCliente: esRechazada ? '' : (datos.firmas?.firmaCliente?.firma || '')
                }
            },
            creadoPor: {
                nombre: datosAdministrador.nombre,
                documento: datosAdministrador.documento,
                email: datosAdministrador.email,
                fechaCreacion: formatearFechaHora(fecha)
            },
            historial: [{
                estado: esRechazada ? 'Rechazada' : 'Recibida',
                administrador: datosAdministrador,
                fechaCambio: new Date(),
                observaciones: esRechazada ? motivoRechazo : (datos.observaciones || 'Registro inicial de muestra')
            }],
            actualizadoPor: []
        });

        console.log('Datos de la muestra antes de guardar:', {
            cliente: muestra.cliente,
            creadoPor: muestra.creadoPor,
            firmas: muestra.firmas,
            estado: muestra.estado,
            rechazoMuestra: muestra.rechazoMuestra
        });

        // Guardar la muestra
        const muestraGuardada = await muestra.save();

        // Preparar la respuesta simplificada
        const respuesta = {
            id_muestra: muestraGuardada.id_muestra,
            cliente: {
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
            descripcion: muestraGuardada.descripcion,
            analisisSeleccionados: muestraGuardada.analisisSeleccionados,
            estado: muestraGuardada.estado,
            rechazoMuestra: {
                rechazada: muestraGuardada.rechazoMuestra.rechazada,
                motivo: muestraGuardada.rechazoMuestra.motivo
            },
            observaciones: muestraGuardada.observaciones,
            historial: muestraGuardada.historial.map(h => ({
                estado: h.estado,
                administrador: {
                    nombre: h.administrador.nombre,
                    documento: h.administrador.documento,
                    email: h.administrador.email
                },
                fechaCambio: formatearFechaHora(h.fechaCambio),
                observaciones: h.observaciones
            })),
            creadoPor: {
                nombre: muestraGuardada.creadoPor.nombre,
                documento: muestraGuardada.creadoPor.documento,
                email: muestraGuardada.creadoPor.email,
                fechaCreacion: formatearFechaHora(muestraGuardada.createdAt)
            },
            actualizadoPor: muestraGuardada.actualizadoPor.map(a => ({
                nombre: a.nombre,
                documento: a.documento,
                fecha: formatearFechaHora(a.fecha),
                accion: a.accion
            })),
            createdAt: formatearFechaHora(muestraGuardada.createdAt),
            updatedAt: formatearFechaHora(muestraGuardada.updatedAt)
        };

        // Solo incluir firmas en la respuesta si la muestra no está rechazada
        if (!esRechazada) {
            respuesta.firmas = {
                administrador: {
                    nombre: muestraGuardada.firmas.administrador.nombre,
                    documento: muestraGuardada.firmas.administrador.documento,
                    firmaAdministrador: muestraGuardada.firmas.administrador.firmaAdministrador
                },
                cliente: {
                    nombre: muestraGuardada.firmas.cliente.nombre,
                    documento: muestraGuardada.firmas.cliente.documento,
                    firmaCliente: muestraGuardada.firmas.cliente.firmaCliente
                }
            };
        }

        return res.status(201).json({
            success: true,
            message: esRechazada ? 'Muestra rechazada exitosamente' : 'Muestra registrada exitosamente',
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
        const datosActualizacion = normalizarCampos(req.body);
        
        // Validar campos que no se pueden actualizar
        const camposInmutables = ['documento', 'fechaHoraRecepcion', 'tipoAnalisis', 'tipoDeAgua'];
        const camposActualizacion = Object.keys(datosActualizacion);
        const camposInvalidos = camposInmutables.filter(campo => camposActualizacion.includes(campo));
        
        if (camposInvalidos.length > 0) {
            throw new ValidationError(`Los siguientes campos no se pueden modificar: ${camposInvalidos.join(', ')}`);
        }

        // Validaciones específicas
        if (datosActualizacion.estado === 'Rechazada' && !datosActualizacion.observaciones) {
            throw new ValidationError('Debe especificar el motivo del rechazo en las observaciones');
        }

        if (datosActualizacion.preservacionMuestra === 'Otro' && !datosActualizacion.descripcion) {
            throw new ValidationError('Debe especificar el método de preservación cuando selecciona "Otro"');
        }

        // Preparar datos para actualizar
        const datosParaActualizar = { ...datosActualizacion };
        
        // Si se está rechazando la muestra, actualizar el campo rechazoMuestra
        if (datosActualizacion.estado === 'Rechazada') {
            datosParaActualizar.rechazoMuestra = {
                rechazada: true,
                motivo: datosActualizacion.observaciones,
                fechaRechazo: new Date()
            };
            
            // Agregar al historial
            datosParaActualizar.$push = {
                ...datosParaActualizar.$push,
                historial: {
                    estado: 'Rechazada',
                    administrador: {
                        documento: usuario.documento,
                        nombre: usuario.nombre,
                        email: usuario.email
                    },
                    fechaCambio: new Date(),
                    observaciones: datosActualizacion.observaciones
                }
            };
        }

        // Actualizar la muestra
        const muestra = await Muestra.findOneAndUpdate(
            { id_muestra: id },
            {
                ...datosParaActualizar,
                $push: {
                    ...datosParaActualizar.$push,
                    actualizadoPor: {
                        documento: usuario.documento,
                        nombre: usuario.nombre,
                        fecha: new Date(),
                        accion: 'Actualización de muestra'
                    }
                }
            },
            { new: true }
        );

        if (!muestra) {
            throw new NotFoundError('Muestra no encontrada');
        }

        // Formatear fechas para la respuesta
        const formatearFecha = (fecha) => {
            // Convertir a zona horaria de Colombia (America/Bogota)
            const fechaObj = new Date(fecha);
            const fechaColombiana = new Date(fechaObj.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
            
            // Formatear fecha
            const dia = fechaColombiana.getDate().toString().padStart(2, '0');
            const mes = (fechaColombiana.getMonth() + 1).toString().padStart(2, '0');
            const año = fechaColombiana.getFullYear();
            
            // Formatear hora en formato 24 horas
            const horas = fechaColombiana.getHours().toString().padStart(2, '0');
            const minutos = fechaColombiana.getMinutes().toString().padStart(2, '0');
            const segundos = fechaColombiana.getSeconds().toString().padStart(2, '0');
            
            return {
                fecha: `${dia}/${mes}/${año}`,
                hora: `${horas}:${minutos}:${segundos}`
            };
        };

        // Preparar la respuesta
        const respuesta = {
            ...muestra.toObject(),
            createdAt: formatearFecha(muestra.createdAt),
            updatedAt: formatearFecha(muestra.updatedAt),
            fechaHoraMuestreo: formatearFecha(muestra.fechaHoraMuestreo),
            historial: muestra.historial.map(h => ({
                ...h,
                fechaCambio: formatearFecha(h.fechaCambio)
            })),
            creadoPor: {
                ...muestra.creadoPor,
                fechaCreacion: formatearFecha(muestra.createdAt)
            },
            firmas: {
                ...muestra.firmas,
                fechaFirmaAdministrador: muestra.firmas.fechaFirmaAdministrador ? formatearFecha(muestra.firmas.fechaFirmaAdministrador) : null,
                fechaFirmaCliente: muestra.firmas.fechaFirmaCliente ? formatearFecha(muestra.firmas.fechaFirmaCliente) : null
            }
        };

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
        const muestra = await muestrasService.registrarFirma(id, firmas, usuario);
        ResponseHandler.success(res, { muestra }, 'Firma registrada exitosamente');
    } catch (error) {
        next(error);
    }
};

const eliminarMuestra = async (req, res, next) => {
    try {
        const usuario = obtenerDatosUsuario(req);
        const { id } = req.params;
        
        const muestra = await Muestra.findOneAndDelete({ id_muestra: id });
        
        if (!muestra) {
            throw new NotFoundError('Muestra no encontrada');
        }

        ResponseHandler.success(res, null, 'Muestra eliminada exitosamente');
    } catch (error) {
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
    eliminarMuestra
};