const jwt = require('jsonwebtoken');
const config = require('../config/database');
const validator = require('validator');
const { validate: isEmail } = require('email-validator');
const { json } = require('express');

// Middleware de autenticación
const autenticar = (usuarioModel) => async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                error: 'Autenticación requerida',
                detalles: 'Token no proporcionado'
            });
        }

        const decodificado = jwt.verify(token, config.jwtConfig.secret);
        
        const usuario = await usuarioModel.findById(decodificado.userId)
            .populate('rol')
            .exec();

        if (!usuario || !usuario.activo) {
            return res.status(401).json({
                error: 'Usuario no autorizado',
                detalles: 'Usuario no encontrado o inactivo'
            });
        }
        
        // Asignar usuario y sus permisos a req
        req.usuario = {
            ...usuario.toObject(),
            permisos: usuario.rol?.permisos || []
        };
        
        next();
    } catch (error) {
        console.error("Error de autenticación:", error);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ // Corregido de join a json
                error: 'Sesión expirada',
                detalles: 'Por favor, inicie sesión nuevamente'
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Token inválido',
                detalles: 'El token proporcionado no es válido'
            });
        }
        return res.status(401).json({
            error: 'Error de autenticación',
            detalles: error.message
        });
    }
};

const soloRoles = (rolesPermitidos = []) => {
    return (req, res, next) => {
        try {
            const usuario = req.usuario;
            if (!usuario) {
                return res.status(401).json({ error: 'Autenticación requerida' });
            }

            if (usuario.rol.name === 'cliente') {
                return res.status(403).json({
                    error: 'Acceso denegado',
                    detalle: 'Los clientes no pueden iniciar sesión'
                });
            }

            if (rolesPermitidos.includes(usuario.rol)) {
                return next();
            }

            return res.status(403).json({
                error: 'Acceso denegado',
                detalle: `Esta acción solo está permitida para: ${rolesPermitidos.join(', ')}`
            });
        } catch (error) {
            return res.status(500).json({ error: 'Error al verificar rol: ' + error.message });
        }
    };
};

// Middleware de verificación de permisos
const verificarPermisos = (permisosRequeridos = []) => {
    return async (req, res, next) => {
        try {
            if (req.usuario.rol?.name === 'super_admin') {
                return next();
            }

            const permisos = req.usuario.permisos || [];
            const permisosQueFaltan = permisosRequeridos.filter(
                permiso => !permisos.includes(permiso)
            );

            if (permisosQueFaltan.length > 0) {
                return res.status(403).json({
                    error: 'Acceso denegado',
                    detalles: `No tiene los siguientes permisos requeridos: ${permisosQueFaltan.join(', ')}`
                });
            }

            next();
        } catch (error) {
            return res.status(500).json({ 
                error: 'Error al verificar permisos', 
                detalles: error.message 
            });
        }
    };
};

const loggin = (req, res, next) => {
    const fecha = new Date().toISOString();
    const metodo = req.method;
    const url = req.originalUrl || req.url;
    const ip = req.ip || req.connection.remoteAddress;
    console.log(`[${fecha}] ${metodo} ${url} - IP: ${ip}`);
    req.tiempoInicio = Date.now();
    res.on('finish', () => {
        const duracion = Date.now() - req.tiempoInicio;
        const statusCode = res.statusCode;
        console.log(`[${fecha}] ${metodo} ${url} - Estado: ${statusCode} - Duración: ${duracion}ms`);
    });
    next();
};

const manejarErrores = (err, _req, res, next) => {
    console.error('Error en la aplicación:', err);
    if (err.statusCode) {
        return res.status(err.statusCode).json({
            error: err.message || 'Error en la aplicación',
            detalles: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Error de validación',
            detalles: err.message
        });
    }
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Error de autenticación',
            detalles: err.message
        });
    }
    res.status(500).json({
        error: 'Error interno del servidor',
        mensaje: err.message,
        detalles: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

const verificarDatosCliente = (req, res, next) => {
    if (req.usuario?.rol === 'cliente' && !req.body.razonSocial) {
        return res.status(400).json({
            error: 'Razón social es requerida para clientes'
        });
    }
    next();
}

module.exports = {
    autenticar,
    verificarPermisos,
    soloRoles,
    loggin,
    manejarErrores,
    verificarDatosCliente
};