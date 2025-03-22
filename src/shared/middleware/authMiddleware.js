const { verificarRolUsuario } = require('../../app/registro-muestras/services/usuariosService');
const { ResponseHandler } = require('../utils/responseHandler');
const { AuthenticationError } = require('../errors/AppError');

const verificarToken = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        if (!authHeader) {
            throw new AuthenticationError('Header de autorización no encontrado');
        }

        const token = authHeader.replace('Bearer ', '');
        
        if (!token) {
            throw new AuthenticationError('Token no proporcionado');
        }

        try {
            const usuario = await verificarRolUsuario(token);
            if (!usuario || !usuario.rol) {
                throw new AuthenticationError('Token inválido: información del usuario incompleta');
            }

            req.usuario = {
                id: usuario.id,
                rol: usuario.rol,
                email: usuario.email
            };
            next();
        } catch (error) {
            if (error instanceof AuthenticationError) {
                ResponseHandler.error(res, error);
            } else {
                console.error("Error al verificar token:", error.message);
                ResponseHandler.error(res, new AuthenticationError('Token inválido o expirado'));
            }
        }
    } catch (error) {
        console.error("Error en middleware de autenticación:", error);
        ResponseHandler.error(res, error);
    }
};

const verificarAdmin = async (req, res, next) => {
    try {
        if (!req.usuario || req.usuario.rol !== "administrador") {
            throw new AuthenticationError(
                "Acceso denegado. Se requieren permisos de administrador.",
                { rolActual: req.usuario?.rol || "No definido" }
            );
        }
        next();
    } catch (error) {
        ResponseHandler.error(res, error);
    }
};

const verificarLaboratorista = async (req, res, next) => {
    try {
        if (!req.usuario || req.usuario.rol !== "laboratorista") {
            throw new AuthenticationError(
                "Acceso denegado. Se requieren permisos de laboratorista.",
                { rolActual: req.usuario?.rol || "No definido" }
            );
        }
        next();
    } catch (error) {
        ResponseHandler.error(res, error);
    }
};

module.exports = {
    verificarToken,
    verificarAdmin,
    verificarLaboratorista
}; 
