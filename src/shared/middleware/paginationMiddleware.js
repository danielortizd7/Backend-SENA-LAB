const { ValidationError } = require('../errors/AppError');

/**
 * Middleware para manejar la paginación de manera consistente en toda la aplicación
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const paginationMiddleware = (req, res, next) => {
    try {
        // Valores por defecto
        const defaultPage = 1;
        const defaultLimit = 10;
        const defaultSortBy = 'createdAt';
        const defaultSortOrder = 'desc';

        // Obtener parámetros de la query
        let { 
            page = defaultPage,
            limit = defaultLimit,
            sortBy = defaultSortBy,
            sortOrder = defaultSortOrder
        } = req.query;

        // Convertir a números y validar
        page = parseInt(page);
        limit = parseInt(limit);

        // Validaciones
        if (isNaN(page) || page < 1) {
            throw new ValidationError('El número de página debe ser un número positivo');
        }

        if (isNaN(limit) || limit < 1) {
            throw new ValidationError('El límite debe ser un número positivo');
        }

        // Validar orden de clasificación
        if (!['asc', 'desc'].includes(sortOrder.toLowerCase())) {
            throw new ValidationError('El orden de clasificación debe ser "asc" o "desc"');
        }

        // Calcular skip para la paginación
        const skip = (page - 1) * limit;

        // Agregar los parámetros de paginación al request
        req.pagination = {
            page,
            limit,
            skip,
            sortBy,
            sortOrder: sortOrder.toLowerCase()
        };

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Función helper para formatear la respuesta paginada
 * @param {Array} data - Array de datos
 * @param {Number} total - Total de documentos
 * @param {Object} pagination - Objeto con información de paginación
 * @returns {Object} Objeto con datos paginados y metadata
 */
const formatPaginationResponse = (data, total, pagination) => {
    const { page, limit } = pagination;
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
        data,
        pagination: {
            total,
            totalPages,
            currentPage: page,
            limit,
            hasNextPage,
            hasPrevPage
        }
    };
};

module.exports = {
    paginationMiddleware,
    formatPaginationResponse
}; 