const { ValidationError } = require("../../../../shared/errors/AppError");

class AuditoriaValidator {
  static validarFechas(fechaInicio, fechaFin) {
    if (!fechaInicio || !fechaFin) {
      throw new ValidationError("Se requieren fechaInicio y fechaFin para la consulta");
    }
    
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      throw new ValidationError("Las fechas proporcionadas no son válidas");
    }
    
    if (inicio > fin) {
      throw new ValidationError("La fecha de inicio debe ser anterior a la fecha fin");
    }
  }

  static validarRegistroAccion(datosAuditoria) {
    if (!datosAuditoria.accion) {
      throw new ValidationError("Se requiere especificar la acción realizada");
    }

    if (!datosAuditoria.creadoPor) {
      throw new ValidationError("Se requiere especificar el usuario que realiza la acción");
    }
  }

  static validarPaginacion(pagina, limite) {
    const paginaNum = parseInt(pagina);
    const limiteNum = parseInt(limite);

    if (isNaN(paginaNum) || paginaNum < 1) {
      throw new ValidationError("El número de página debe ser un número positivo");
    }

    if (isNaN(limiteNum) || limiteNum < 1) {
      throw new ValidationError("El límite de registros debe ser un número positivo");
    }

    return {
      pagina: paginaNum,
      limite: limiteNum
    };
  }
}

module.exports = AuditoriaValidator;
