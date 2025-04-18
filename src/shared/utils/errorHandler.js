const { ResponseHandler } = require('./responseHandler');

const handleError = (res, error) => {
    console.error('Error:', error);

    // Error de validación
    if (error.name === 'ValidationError') {
        return ResponseHandler.error(res, {
            statusCode: 400,
            message: error.message,
            errorCode: 'VALIDATION_ERROR'
        });
    }

    // Error de no encontrado
    if (error.name === 'NotFoundError') {
        return ResponseHandler.error(res, {
            statusCode: 404,
            message: error.message,
            errorCode: 'NOT_FOUND'
        });
    }

    // Error de base de datos
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
        return ResponseHandler.error(res, {
            statusCode: 500,
            message: 'Error en la base de datos',
            errorCode: 'DATABASE_ERROR'
        });
    }

    // Error por defecto
    return ResponseHandler.error(res, {
        statusCode: 500,
        message: 'Error interno del servidor',
        errorCode: 'INTERNAL_SERVER_ERROR'
    });
};

module.exports = {
    handleError
}; 