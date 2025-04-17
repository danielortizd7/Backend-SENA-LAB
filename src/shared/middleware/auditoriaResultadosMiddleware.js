const AuditoriaModel = require('../../app/auditoria/models/auditoriaModel');
const auditoriaService = require('../../app/auditoria/services/auditoriaService');
const { getClientIp } = require('@supercharge/request-ip');

module.exports = {
  registrarAccionResultados: async (req, res, next) => {
    try {
      const { usuario, body, params } = req;

      const resultados = body.resultados;

      // Validación para evitar el error
      if (!resultados || typeof resultados !== 'object' || Array.isArray(resultados)) {
        console.warn(' Middleware omitido: resultados inválidos o no enviados');
        return next(); // No bloquea, solo omite la auditoría
      }
      
      const metodo = req.method.toUpperCase();

     /* const cambiosResultados = Object.entries(req._cambiosResultados || {}).map(([parametro, datos]) => ({
        parametro,
        valorAnterior: datos.valorAnterior,
        valorNuevo: datos.valorNuevo,
        unidad: datos.unidad || '',
        fechaCambio: new Date()
      }));*/
      
      const datosAuditoria = {
        accion: {
          tipo: metodo,
          descripcion: `Operación de ${req.method} sobre resultados`,
          metodo: req.method,
      //   ruta: req.originalUrl,
          permisosRequeridos: ['registrar_resultados']
        },
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          rol: usuario.rol,
          documento: usuario.documento,
       //   permisos: usuario.permisos || []
        },
        detalles: {
          idMuestra: params.id || params.idMuestra || body.idMuestra || body.id_muestra || (() => {
            // Si no hay ID, continuar sin error pero registrar advertencia
            console.warn('Advertencia: No se encontró ID de muestra en la solicitud');
            return 'ID_NO_PROVISTO';
          })(),
          cambios: {
            antes: null,
            despues: body.resultados || {}
          },
          cambiosResultados: Object.keys(body.resultados || {}).map(parametro => ({
            parametro: parametro,
            valorAnterior: null,
            valorNuevo: body.resultados[parametro].valor,
            unidad: body.resultados[parametro].unidad || '',
            fechaCambio: new Date()
          })),
        /*  ip: getClientIp(req),
          userAgent: req.headers['user-agent']*/
        },
        estado: 'exitoso',
        fecha: new Date()
      };

      // Crear y registrar documento de auditoría
      const auditoriaDoc = new AuditoriaModel({
        ...datosAuditoria,
        fecha: new Date(),
        estado: 'exitoso'
      });
      await auditoriaService.registrarAccion(auditoriaDoc);
      next();
    } catch (error) {
      console.error('Error en middleware de auditoría:', {
        message: error.message,
        stack: error.stack,
        request: {
          method: req.method,
          url: req.originalUrl,
          params: req.params,
          body: req.body
        }
      });
      next(error);
    }
  }
};
