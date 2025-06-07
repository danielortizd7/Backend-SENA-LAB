/**
 * @typedef {Object} FiltrosAuditoria
 * @property {Date} [fecha.$gte] - Fecha inicio
 * @property {Date} [fecha.$lte] - Fecha fin
 * @property {RegExp} [creadoPor.nombre] - Nombre del usuario
 * @property {string} [creadoPor.rol] - Rol del usuario
 * @property {string} [accion.tipo] - Tipo de acción
 * @property {string} [estado] - Estado del registro
 */

/**
 * @typedef {Object} OpcionesPaginacion
 * @property {number} pagina - Número de página
 * @property {number} limite - Límite de registros por página
 * @property {boolean} [sinPaginacion] - Indica si se debe omitir la paginación
 */

/**
 * @typedef {Object} DatosAuditoria
 * @property {string} ip - IP del cliente
 * @property {string} userAgent - User agent del cliente
 * @property {Object} accion - Información de la acción realizada
 * @property {Object} detalles - Detalles adicionales de la acción
 */

module.exports = {};
