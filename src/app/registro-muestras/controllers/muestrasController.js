const { validationResult } = require('express-validator');
const { ResponseHandler } = require('../../../shared/utils/responseHandler');
const { ValidationError, NotFoundError } = require('../../../shared/errors/AppError');
const { Muestra, estadosValidos, TipoAgua } = require('../../../shared/models/muestrasModel');
const { analisisDisponibles, matrizMap, getAnalisisPorTipoAgua } = require('../../../shared/models/analisisModel');
const Usuario = require('../../../shared/models/usuarioModel');
const { validarUsuario } = require('../services/usuariosService');
const muestrasService = require('../services/muestrasService');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const USUARIOS_API = 'https://back-usuarios-f.onrender.com/api/usuarios';
const BUSCAR_USUARIO_API = 'https://back-usuarios-f.onrender.com/api/usuarios';

// ============= Funciones de Utilidad =============
const obtenerDatosUsuario = (req) => {
    if (!req.usuario) {
        throw new ValidationError('Usuario no autenticado');
    }
    return {
        id: req.usuario.id,
        documento: req.usuario.documento,
        nombre: req.usuario.nombre,
        email: req.usuario.email,
        rol: req.usuario.rol
    };
};

const normalizarCampos = (datos) => {
    // Normalizar tipo de análisis
    if (datos.tipoAnalisis) {
        datos.tipoAnalisis = datos.tipoAnalisis.charAt(0).toUpperCase() + 
                            datos.tipoAnalisis.slice(1).toLowerCase();
        if (datos.tipoAnalisis === 'Fisicoquimico') {
            datos.tipoAnalisis = 'Fisicoquímico';
        }
    }

    // Normalizar preservación
    if (datos.preservacionMuestra) {
        datos.preservacionMuestra = datos.preservacionMuestra.charAt(0).toUpperCase() + 
                                  datos.preservacionMuestra.slice(1).toLowerCase();
        if (datos.preservacionMuestra === 'Refrigeracion') {
            datos.preservacionMuestra = 'Refrigeración';
        }
    }

    // Normalizar tipo de agua
    if (datos.tipoDeAgua?.tipo) {
        datos.tipoDeAgua.tipo = datos.tipoDeAgua.tipo.toLowerCase();
    }

    return datos;
};

const validarDatosMuestra = (datos) => {
    const errores = [];

    // Validar campos requeridos
    if (!datos.documento) errores.push('El documento es requerido');
    if (!datos.tipoDeAgua?.tipo) errores.push('El tipo de agua es requerido');
    if (!datos.tipoAnalisis) errores.push('El tipo de análisis es requerido');
    if (!datos.fechaHoraMuestreo) errores.push('La fecha y hora de muestreo son requeridas');
    if (!datos.preservacionMuestra) errores.push('El método de preservación es requerido');
    if (!datos.lugarMuestreo) errores.push('El lugar de muestreo es requerido');

    // Validar análisis seleccionados
    if (!Array.isArray(datos.analisisSeleccionados) || datos.analisisSeleccionados.length === 0) {
        errores.push('Debe seleccionar al menos un análisis');
    }

    // Validar firmas
    if (!datos.firmas?.firmaAdministrador?.firma || !datos.firmas?.firmaCliente?.firma) {
        errores.push('Se requieren las firmas del administrador y del cliente');
    }

    // Validar preservación "Otra"
    if (datos.preservacionMuestra === 'Otra' && !datos.preservacionOtra) {
        errores.push('Debe especificar el método de preservación cuando selecciona "Otra"');
    }

    // Validar subtipo de agua residual
    if (datos.tipoDeAgua?.tipo === 'residual' && !datos.tipoDeAgua?.subtipoResidual) {
        errores.push('Debe especificar el subtipo de agua residual');
    }

    if (errores.length > 0) {
        throw new ValidationError(errores.join('. '));
    }
};

const validarRolAdministrador = (usuario) => {
    if (!usuario || !usuario.rol) {
        throw new ValidationError('Usuario no autenticado o sin rol definido');
    }

    if (usuario.rol !== 'administrador') {
        throw new ValidationError('Se requieren permisos de administrador');
    }

    return true;
};

// Función de validación de análisis según tipo de agua
const validarAnalisisParaTipoAgua = (analisisSeleccionados, tipoAgua, subtipoResidual = null) => {
    // Determinar matriz permitida según tipo de agua
    let matrizPermitida;
    switch (tipoAgua) {
        case 'potable':
            matrizPermitida = 'AP';
            break;
        case 'natural':
            matrizPermitida = 'AS';
            break;
        case 'residual':
            matrizPermitida = subtipoResidual === 'doméstica' ? 'ARD' : 'ARnD';
            break;
        default:
            throw new ValidationError('Tipo de agua no válido');
    }

    // Verificar cada análisis seleccionado
    for (const analisis of analisisSeleccionados) {
        const analisisInfo = analisisDisponibles.find(a => a.nombre === analisis);
        if (!analisisInfo) {
            throw new ValidationError(`El análisis "${analisis}" no existe en el catálogo`);
        }

        if (!analisisInfo.matriz.includes(matrizPermitida)) {
            throw new ValidationError(`El análisis "${analisis}" no es válido para ${tipoAgua}${subtipoResidual ? ` ${subtipoResidual}` : ''}`);
        }
    }
    return true;
};

// ============= Controladores de Usuario =============
const validarUsuarioController = async (req, res) => {
    try {
        const { documento } = req.query;
        
        if (!documento) {
            return ResponseHandler.error(res, new ValidationError('El documento es requerido'));
        }

        const resultado = await validarUsuario(documento);
        return ResponseHandler.success(res, resultado, 'Usuario validado correctamente');
    } catch (error) {
        console.error('Error en validarUsuarioController:', error);
        return ResponseHandler.error(res, error);
    }
};

// ============= Controladores de Tipos de Agua =============
const obtenerTiposAgua = async (req, res, next) => {
    try {
        const tiposAgua = await TipoAgua.find({ activo: true });
        ResponseHandler.success(res, { tiposAgua }, 'Tipos de agua obtenidos exitosamente');
    } catch (error) {
        next(error);
    }
};

const crearTipoAgua = async (req, res, next) => {
    try {
        const { tipo, descripcion } = req.body;
        
        if (!tipo || !descripcion) {
            throw new ValidationError('Tipo y descripción son requeridos');
        }

        const tipoAgua = new TipoAgua({
            tipo: tipo.toLowerCase(),
            descripcion
        });

        await tipoAgua.save();
        ResponseHandler.success(res, { tipoAgua }, 'Tipo de agua creado exitosamente', 201);
    } catch (error) {
        next(error);
    }
};

const actualizarTipoAgua = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { descripcion, activo } = req.body;

        const tipoAgua = await TipoAgua.findByIdAndUpdate(
            id,
            { descripcion, activo },
            { new: true }
        );

        if (!tipoAgua) {
            throw new ValidationError('Tipo de agua no encontrado');
        }

        ResponseHandler.success(res, { tipoAgua }, 'Tipo de agua actualizado exitosamente');
    } catch (error) {
        next(error);
    }
};

// ============= Controladores de Análisis =============
const obtenerAnalisis = async (req, res) => {
    try {
        ResponseHandler.success(res, { 
            analisis: analisisDisponibles,
            matrices: matrizMap
        }, 'Análisis obtenidos correctamente');
    } catch (error) {
        ResponseHandler.error(res, error);
    }
};

const obtenerAnalisisPorTipoAgua = async (req, res) => {
    try {
        const { tipo, subtipo } = req.query;
        const analisis = getAnalisisPorTipoAgua(tipo, subtipo);
        ResponseHandler.success(res, { 
            analisis,
            tipo,
            subtipo,
            matriz: matrizMap[tipo === 'residual' ? (subtipo === 'domestica' ? 'ARD' : 'ARnD') : tipo === 'potable' ? 'AP' : 'AS']
        }, 'Análisis filtrados correctamente');
    } catch (error) {
        ResponseHandler.error(res, error);
    }
};

// ============= Controladores de Muestras =============
const obtenerMuestras = async (req, res, next) => {
    try {
        const { tipo, estado, fechaInicio, fechaFin } = req.query;
        let filtro = {};

        // Aplicar filtros si se proporcionan
        if (tipo) filtro['tipoDeAgua.tipo'] = tipo;
        if (estado) filtro.estado = estado;
        if (fechaInicio || fechaFin) {
            filtro.fechaHoraMuestreo = {};
            if (fechaInicio) filtro.fechaHoraMuestreo.$gte = new Date(fechaInicio);
            if (fechaFin) filtro.fechaHoraMuestreo.$lte = new Date(fechaFin);
        }

        const muestras = await Muestra.find(filtro)
            .populate('creadoPor', 'nombre email documento')
            .populate('actualizadoPor.usuario', 'nombre email documento')
            .sort({ fechaHoraMuestreo: -1 });

        ResponseHandler.success(res, { muestras }, 'Muestras obtenidas correctamente');
    } catch (error) {
        next(error);
    }
};

const obtenerMuestra = async (req, res, next) => {
    try {
        const { id } = req.params;
        const muestra = await Muestra.findOne({ id_muestra: id })
            .populate('creadoPor', 'nombre email documento')
            .populate('actualizadoPor.usuario', 'nombre email documento');

        if (!muestra) {
            throw new NotFoundError('Muestra no encontrada');
        }

        ResponseHandler.success(res, { muestra }, 'Muestra obtenida correctamente');
    } catch (error) {
        next(error);
    }
};

const generarIdMuestra = async (tipoAgua, tipoAnalisis) => {
    const fecha = new Date();
    const año = fecha.getFullYear().toString().slice(-2);
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const dia = fecha.getDate().toString().padStart(2, '0');
    
    // Primer carácter: Tipo de agua
    let tipoChar;
    switch (tipoAgua.toLowerCase()) {
        case 'potable':
            tipoChar = 'P';
            break;
        case 'residual':
            tipoChar = 'R';
            break;
        case 'natural':
            tipoChar = 'N';
            break;
        default:
            tipoChar = 'O';
    }
    
    // Segundo carácter: Tipo de análisis
    let analisisChar;
    switch (tipoAnalisis.toLowerCase()) {
        case 'fisicoquímico':
        case 'fisicoquimico':
            analisisChar = 'F';
            break;
        case 'microbiológico':
        case 'microbiologico':
            analisisChar = 'M';
            break;
        default:
            throw new Error('Tipo de análisis no válido');
    }
    
    // Buscar el último consecutivo del día
    const patron = `^${tipoChar}${analisisChar}${año}${mes}${dia}`;
    const ultimaMuestra = await Muestra.findOne({
        id_muestra: new RegExp(patron)
    }).sort({ id_muestra: -1 });
    
    // Generar consecutivo
    let consecutivo = '001';
    if (ultimaMuestra) {
        const ultimoConsecutivo = parseInt(ultimaMuestra.id_muestra.slice(-3));
        if (ultimoConsecutivo >= 999) {
            throw new Error('Se ha alcanzado el límite de muestras para el día');
        }
        consecutivo = (ultimoConsecutivo + 1).toString().padStart(3, '0');
    }
    
    // Generar id_muestra final
    return `${tipoChar}${analisisChar}${año}${mes}${dia}${consecutivo}`;
};

const crearMuestra = async (req, res, next) => {
    try {
        console.log('Iniciando creación de muestra...');
        const datosMuestra = normalizarCampos(req.body);
        
        // Validar datos
        validarDatosMuestra(datosMuestra);

        // Obtener datos del usuario
        const usuario = obtenerDatosUsuario(req);

        // Preparar datos de firmas
        const firmas = {
            cedulaAdministrador: usuario.documento,
            firmaAdministrador: datosMuestra.firmas.firmaAdministrador.firma,
            cedulaCliente: datosMuestra.documento,
            firmaCliente: datosMuestra.firmas.firmaCliente.firma,
            fechaFirmaAdministrador: new Date(datosMuestra.firmas.firmaAdministrador.fecha),
            fechaFirmaCliente: new Date(datosMuestra.firmas.firmaCliente.fecha)
        };

        // Generar ID de muestra
        const id_muestra = await generarIdMuestra(datosMuestra.tipoDeAgua.tipo, datosMuestra.tipoAnalisis);
        console.log('ID de muestra generado:', id_muestra);

        // Crear la muestra
        const muestra = new Muestra({
            ...datosMuestra,
            id_muestra,
            firmas,
            creadoPor: usuario.id,
            estado: 'Recibida',
            historial: [{
                estado: 'Recibida',
                cedulaadministrador: usuario.documento,
                nombreadministrador: usuario.nombre,
                fechaCambio: new Date(),
                observaciones: datosMuestra.observaciones || 'Muestra registrada inicialmente'
            }]
        });

        await muestra.save();
        console.log('Muestra creada exitosamente con ID:', muestra.id_muestra);
        
        ResponseHandler.success(res, { muestra }, 'Muestra creada exitosamente');
    } catch (error) {
        console.error('Error al crear muestra:', error.message);
        if (error instanceof ValidationError) {
            return ResponseHandler.error(res, error);
        }
        next(error);
    }
};

const actualizarMuestra = async (req, res, next) => {
    try {
        const usuario = obtenerDatosUsuario(req);
        const { id } = req.params;
        const datosActualizacion = normalizarCampos(req.body);
        
        // Validar campos que no se pueden actualizar
        const camposInmutables = ['documento', 'fechaHoraRecepcion', 'tipoAnalisis', 'tipoDeAgua'];
        const camposActualizacion = Object.keys(datosActualizacion);
        const camposInvalidos = camposInmutables.filter(campo => camposActualizacion.includes(campo));
        
        if (camposInvalidos.length > 0) {
            throw new ValidationError(`Los siguientes campos no se pueden modificar: ${camposInvalidos.join(', ')}`);
        }

        // Validaciones específicas
        if (datosActualizacion.estado === 'Rechazada' && !datosActualizacion.motivoRechazo) {
            throw new ValidationError('Debe especificar el motivo del rechazo');
        }

        if (datosActualizacion.preservacionMuestra === 'Otra' && !datosActualizacion.preservacionOtra) {
            throw new ValidationError('Debe especificar el método de preservación cuando selecciona "Otra"');
        }

        // Actualizar la muestra
        const muestra = await Muestra.findOneAndUpdate(
            { id_muestra: id },
            {
                ...datosActualizacion,
                $push: {
                    actualizadoPor: {
                        usuario: usuario.id,
                        nombre: usuario.nombre,
                        fecha: new Date(),
                        accion: 'Actualización de muestra'
                    }
                }
            },
            { new: true }
        );

        if (!muestra) {
            throw new NotFoundError('Muestra no encontrada');
        }

        ResponseHandler.success(res, { muestra }, 'Muestra actualizada exitosamente');
    } catch (error) {
        if (error instanceof ValidationError || error instanceof NotFoundError) {
            return ResponseHandler.error(res, error);
        }
        next(error);
    }
};

const registrarFirma = async (req, res, next) => {
    try {
        const usuario = obtenerDatosUsuario(req);
        validarRolAdministrador(usuario);
        const { id } = req.params;
        const { firmas } = req.body;
        const muestra = await muestrasService.registrarFirma(id, firmas, usuario);
        ResponseHandler.success(res, { muestra }, 'Firma registrada exitosamente');
    } catch (error) {
        next(error);
    }
};

const eliminarMuestra = async (req, res, next) => {
    try {
        const usuario = obtenerDatosUsuario(req);
        const { id } = req.params;
        
        const muestra = await Muestra.findOneAndDelete({ id_muestra: id });
        
        if (!muestra) {
            throw new NotFoundError('Muestra no encontrada');
        }

        ResponseHandler.success(res, null, 'Muestra eliminada exitosamente');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    // Controladores de Usuario
    validarUsuarioController,
    
    // Controladores de Tipos de Agua
    obtenerTiposAgua,
    crearTipoAgua,
    actualizarTipoAgua,
    
    // Controladores de Análisis
    obtenerAnalisis,
    obtenerAnalisisPorTipoAgua,
    
    // Controladores de Muestras
    obtenerMuestras,
    obtenerMuestra,
    crearMuestra,
    actualizarMuestra,
    registrarFirma,
    eliminarMuestra
};