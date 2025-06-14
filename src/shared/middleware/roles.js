const { ValidationError } = require('../errors/AppError');

// Función para validar rol de usuario
const validarRolUsuario = (usuario) => {
    if (!usuario) {
        throw new ValidationError('Usuario no autenticado');
    }

    if (!usuario.rol) {
        throw new ValidationError('No se encontró el rol del usuario');
    }

    const rolesPermitidos = ['administrador', 'laboratorista'];
    const rolUsuario = usuario.rol.toLowerCase();
    
    if (!rolesPermitidos.includes(rolUsuario)) {
        throw new ValidationError(`No tienes permisos para realizar esta acción. Tu rol es: ${rolUsuario}`);
    }

    return true;
};

// Middleware para verificar rol de administrador
const verificarRolAdmin = (req, res, next) => {
    try {
        const { rol } = req.usuario;
        if (rol !== 'administrador') {
            throw new ValidationError('No tiene permisos para realizar esta acción. Se requiere rol de administrador.');
        }
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    verificarRolAdmin,
    validarRolUsuario
};
