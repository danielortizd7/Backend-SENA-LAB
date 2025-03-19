const Resultado = require('../models/Resultado.js');
const { Muestra } = require('../../shared/models/modelMuestras.js');

class ResultadoService {
    static async registrarResultados(idMuestra, datos) {
        const muestra = await Muestra.findOne({ id_muestra: idMuestra });
        if (!muestra) {
            throw new Error('Muestra no encontrada');
        }

        if (!muestra.documento || !muestra.fechaHora || !muestra.tipoMuestreo) {
            throw new Error('La muestra no contiene todos los datos requeridos');
        }

        const resultado = new Resultado({
            idMuestra,
            documento: muestra.documento,
            fechaHora: muestra.fechaHora,
            tipoMuestreo: muestra.tipoMuestreo,
            parametros: datos.parametros,
            cedulaLaboratorista: datos.cedulaLaboratorista,
            nombreLaboratorista: datos.nombreLaboratorista,
            observacion: datos.observacion || 'Muestra en buen estado',
            historialCambios: [{
                accion: 'Registrado',
                nombre: datos.nombreLaboratorista,
                cedula: datos.cedulaLaboratorista,
                fecha: new Date()
            }]
        });

        return await resultado.save();
    }

    static async obtenerResultados(idMuestra) {
        return await Resultado.findOne({ idMuestra }).sort({ createdAt: -1 });
    }

    static async actualizarResultados(idMuestra, datos) {
        const resultado = await Resultado.findOne({ idMuestra });
        if (!resultado) {
            throw new Error('Resultado no encontrado');
        }

        if (resultado.verificado) {
            throw new Error('Este resultado ya fue verificado, no se puede editar');
        }

        if (resultado.cedulaLaboratorista !== datos.cedulaLaboratorista) {
            throw new Error('No autorizado para modificar este resultado');
        }

        // Actualizar parámetros
        if (datos.parametros) {
            resultado.parametros = datos.parametros;
        }

        // Actualizar observación
        if (datos.observacion) {
            resultado.observacion = datos.observacion;
        }

        // Registrar el cambio en el historial
        resultado.historialCambios.push({
            accion: 'Editado',
            nombre: resultado.nombreLaboratorista,
            cedula: datos.cedulaLaboratorista,
            cambios: datos,
            fecha: new Date()
        });

        return await resultado.save();
    }

    static async eliminarResultados(idMuestra) {
        const resultado = await Resultado.findOneAndDelete({ idMuestra });
        if (!resultado) {
            throw new Error('Resultado no encontrado');
        }
        return resultado;
    }

    static async verificarResultados(idMuestra, datos) {
        const resultado = await Resultado.findOne({ idMuestra });
        if (!resultado) {
            throw new Error('Resultado no encontrado');
        }

        if (resultado.verificado) {
            throw new Error('Este resultado ya fue verificado');
        }

        resultado.verificado = true;
        resultado.verificadoPor = {
            nombre: datos.nombreLaboratorista,
            cedula: datos.cedulaLaboratorista,
            fecha: new Date()
        };

        resultado.historialCambios.push({
            accion: 'Verificado',
            nombre: datos.nombreLaboratorista,
            cedula: datos.cedulaLaboratorista,
            fecha: new Date()
        });

        return await resultado.save();
    }
}

module.exports = ResultadoService;
