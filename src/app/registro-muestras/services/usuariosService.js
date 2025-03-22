const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const { AuthenticationError } = require('../../../shared/errors/AppError');

const verificarRolUsuario = async (token) => {
    try {
        // Verificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Buscar el usuario en la base de datos
        const usuario = await Usuario.findById(decoded.id);
        
        if (!usuario) {
            throw new AuthenticationError('Usuario no encontrado');
        }

        return {
            id: usuario._id,
            rol: usuario.rol,
            email: usuario.email
        };
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            throw new AuthenticationError('Token inválido');
        }
        if (error instanceof jwt.TokenExpiredError) {
            throw new AuthenticationError('Token expirado');
        }
        throw error;
    }
};

module.exports = {
    verificarRolUsuario
}; 