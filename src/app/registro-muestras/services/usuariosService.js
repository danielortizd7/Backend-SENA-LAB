const axios = require('axios');
const { AuthenticationError } = require('../../../shared/errors/AppError');

const USUARIOS_API = 'https://back-usuarios-f.onrender.com/api/usuarios';
const ROL_ADMIN_ID = '67d8c23082d1ef13162bdc18';

const verificarRolUsuario = async (documento) => {
    try {
        // Consultar el rol del usuario en la API externa
        const response = await axios.get(`${USUARIOS_API}/roles/${ROL_ADMIN_ID}`);
        const rolAdmin = response.data;

        if (!rolAdmin) {
            throw new AuthenticationError('No se pudo verificar el rol de administrador');
        }

        // Aquí podrías agregar la lógica para verificar si el usuario específico tiene este rol
        // Por ahora, solo verificamos que el rol exista
        return {
            rol: rolAdmin.name,
            descripcion: rolAdmin.description
        };
    } catch (error) {
        console.error('Error al verificar rol:', error);
        if (error.response) {
            throw new AuthenticationError(`Error al verificar rol: ${error.response.data.message || 'Error en la API externa'}`);
        }
        throw new AuthenticationError('Error al verificar rol del usuario');
    }
};

const validarUsuario = async (documento) => {
    try {
        // Aquí iría la lógica para validar el usuario por documento
        // Por ahora retornamos true para simular la validación
        return true;
    } catch (error) {
        console.error('Error al validar usuario:', error);
        throw new AuthenticationError('Error al validar usuario');
    }
};

module.exports = {
    verificarRolUsuario,
    validarUsuario
}; 