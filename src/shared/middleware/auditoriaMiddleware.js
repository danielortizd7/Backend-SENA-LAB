const { ResponseHandler } = require('../utils/responseHandler');
const auditoriaService = require('../../app/auditoria/services/auditoriaService');
const { getClientIp } = require('@supercharge/request-ip');

const registrarAccion = async (req, res, next) => {
    try {
        // Solo registrar si es una operación CRUD
        const metodosAuditables = ['POST', 'PUT', 'DELETE'];
        if (!metodosAuditables.includes(req.method)) {
            return next();
        }

        // Obtener datos del usuario
        const usuario = req.usuario || {
            id: 'anonimo',
            nombre: 'Usuario no autenticado',
            rol: 'invitado',
            documento: 'N/A'
        };

        // Obtener IP del cliente
        const ip = getClientIp(req);

        // Preparar datos de auditoría
        const datosAuditoria = {
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                rol: usuario.rol,
                documento: usuario.documento
            },
            accion: {
                tipo: req.method,
                ruta: req.originalUrl,
                descripcion: `${req.method} ${req.originalUrl}`
            },
            detalles: {
                ip,
                userAgent: req.headers['user-agent'],
                parametros: req.params,
                query: req.query,
                body: req.method === 'GET' ? null : req.body
            },
            fecha: new Date()
        };

        // Registrar en base de datos
        await auditoriaService.registrarAccion(datosAuditoria);

        next();
    } catch (error) {
        console.error('Error en middleware de auditoría:', error);
        next();
    }
};

const registrarAccionCRUD = (modelo) => {
    return async (req, res, next) => {
        try {
            const usuario = req.usuario || {
                id: 'anonimo',
                nombre: 'Usuario no autenticado',
                rol: 'invitado',
                documento: 'N/A'
            };

            let datosAntes = null;
            let datosDespues = null;

            // Para operaciones PUT y DELETE, obtener datos antes del cambio
            if (['PUT', 'DELETE'].includes(req.method)) {
                const id = req.params.id;
                if (id) {
                    datosAntes = await modelo.findById(id).lean();
                }
            }

            // Continuar con la operación
            const oldSend = res.send;
            res.send = async function(data) {
                try {
                    // Para operaciones POST y PUT, obtener datos después del cambio
                    if (['POST', 'PUT'].includes(req.method)) {
                        if (data && data._id) {
                            datosDespues = await modelo.findById(data._id).lean();
                        }
                    }

                    // Registrar auditoría con datos completos
                    await auditoriaService.registrarAccion({
                        usuario: {
                            id: usuario.id,
                            nombre: usuario.nombre,
                            rol: usuario.rol,
                            documento: usuario.documento
                        },
                        accion: {
                            tipo: req.method,
                            ruta: req.originalUrl,
                            descripcion: `${req.method} ${modelo.modelName}`
                        },
                        detalles: {
                            idMuestra: req.params.id,
                            cambios: {
                                antes: datosAntes,
                                despues: datosDespues
                            },
                            ip: getClientIp(req),
                            userAgent: req.headers['user-agent']
                        },
                        fecha: new Date()
                    });
                } catch (error) {
                    console.error('Error registrando auditoría:', error);
                }
                oldSend.apply(res, arguments);
            };

            next();
        } catch (error) {
            console.error('Error en middleware CRUD:', error);
            next(error);
        }
    };
};

module.exports = {
    registrarAccion,
    registrarAccionCRUD
};
