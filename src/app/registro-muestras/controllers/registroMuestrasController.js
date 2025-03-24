const { validarUsuario } = require('../services/usuariosService');
const { ResponseHandler } = require('../../../shared/utils/responseHandler');

const validarUsuarioController = async (req, res) => {
    try {
        const { documento } = req.query;
        
        if (!documento) {
            return res.status(400).json({ 
                message: 'El documento es requerido' 
            });
        }

        const resultado = await validarUsuario(documento);
        return ResponseHandler.success(res, resultado, 'Usuario validado correctamente');
    } catch (error) {
        console.error('Error en validarUsuarioController:', error);
        return ResponseHandler.error(res, {
            message: error.message || 'Error al validar usuario',
            statusCode: 401
        });
    }
};

module.exports = {
    validarUsuarioController
}; 