const { verificarRolUsuario, validarUsuario } = require('../../app/registro-muestras/services/usuariosService');
const { ResponseHandler } = require('../utils/responseHandler');
const { AuthenticationError } = require('../errors/AppError');

const verificarDocumento = async (req, res, next) => {
    try {
        const documento = req.header('X-Usuario-Documento');
        
        if (!documento) {
            throw new AuthenticationError('Documento de usuario no proporcionado');
        }

        const usuarioValido = await validarUsuario(documento);
        if (!usuarioValido) {
            throw new AuthenticationError('Usuario no válido');
        }

        req.documento = documento;
        next();
    } catch (error) {
        console.error("Error en verificación de documento:", error);
        ResponseHandler.error(res, error);
    }
};

const verificarRolAdministrador = async (req, res, next) => {
    try {
        const documento = req.documento;
        if (!documento) {
            throw new AuthenticationError('Documento de usuario no encontrado en la solicitud');
        }

        const rolInfo = await verificarRolUsuario(documento);
        if (!rolInfo || rolInfo.rol !== 'administrador') {
            throw new AuthenticationError(
                "Acceso denegado. Se requieren permisos de administrador.",
                { rolActual: rolInfo?.rol || "No definido" }
            );
        }

        req.rolInfo = rolInfo;
        next();
    } catch (error) {
        console.error("Error en verificación de rol:", error);
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
    verificarDocumento,
    verificarRolAdministrador,
    verificarLaboratorista
}; 
