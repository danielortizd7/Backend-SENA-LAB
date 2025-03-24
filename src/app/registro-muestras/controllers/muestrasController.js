const { validationResult } = require('express-validator');
const { ResponseHandler } = require('../../../shared/utils/responseHandler');
const { ValidationError, NotFoundError } = require('../../../shared/errors/AppError');
const { Muestra, estadosValidos } = require('../../../shared/models/muestrasModel');
const Usuario = require('../../../shared/models/usuarioModel');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const muestrasService = require('../services/muestrasService');

const USUARIOS_API = 'https://back-usuarios-f.onrender.com/api/usuarios';
const BUSCAR_USUARIO_API = 'https://back-usuarios-f.onrender.com/api/usuarios';

// Obtener todas las muestras
const obtenerMuestras = async (req, res, next) => {
    try {
        console.log('Iniciando obtención de muestras...');
        const muestras = await Muestra.find()
            .populate('creadoPor', 'nombre email documento')
            .populate('actualizadoPor.usuario', 'nombre email documento')
            .sort({ fechaHora: -1 });
        console.log('Muestras obtenidas:', muestras);
        ResponseHandler.success(res, { muestras }, 'Muestras obtenidas correctamente');
    } catch (error) {
        console.error('Error detallado al obtener muestras:', error);
        next(error);
    }
};

// Obtener muestras por tipo de agua
const obtenerMuestrasPorTipo = async (req, res, next) => {
    try {
        console.log('Iniciando obtención de muestras por tipo...');
        const { tipo } = req.params;
        const muestras = await Muestra.find({ 'tipoDeAgua.tipo': tipo })
            .populate('creadoPor', 'nombre email documento')
            .populate('actualizadoPor.usuario', 'nombre email documento')
            .sort({ fechaHora: -1 });
        console.log('Muestras obtenidas por tipo:', muestras);
        ResponseHandler.success(res, { muestras }, `Muestras de tipo ${tipo} obtenidas correctamente`);
    } catch (error) {
        console.error('Error detallado al obtener muestras por tipo:', error);
        next(error);
    }
};

// Obtener muestras por estado
const obtenerMuestrasPorEstado = async (req, res, next) => {
    try {
        console.log('Iniciando obtención de muestras por estado...');
        const { estado } = req.params;
        if (!estadosValidos.includes(estado)) {
            console.log('Estado no válido:', estado);
            throw new ValidationError('Estado no válido');
        }

        const muestras = await Muestra.find({ estado })
            .populate('creadoPor', 'nombre email documento')
            .populate('actualizadoPor.usuario', 'nombre email documento')
            .sort({ fechaHora: -1 });

        console.log('Muestras obtenidas por estado:', muestras);
        ResponseHandler.success(res, { muestras }, `Muestras en estado ${estado} obtenidas correctamente`);
    } catch (error) {
        console.error('Error detallado al obtener muestras por estado:', error);
        next(error);
    }
};

// Obtener una muestra por ID
const obtenerMuestra = async (req, res, next) => {
    try {
        const { id } = req.params;
        const muestra = await muestrasService.obtenerMuestra(id);
        ResponseHandler.success(res, { muestra }, 'Muestra obtenida exitosamente');
    } catch (error) {
        next(error);
    }
};

// Función para obtener datos del usuario del token
const obtenerDatosUsuario = (req) => {
    if (!req.usuario) {
        throw new ValidationError('Usuario no autenticado');
    }

    const usuario = {
        id: req.usuario.id,
        documento: req.usuario.documento,
        nombre: req.usuario.nombre,
        email: req.usuario.email,
        rol: req.usuario.rol
    };

    console.log('Datos de usuario extraídos:', usuario);
    return usuario;
};

// Función para validar el rol de administrador
const validarRolAdministrador = (usuario) => {
    if (!usuario) {
        throw new ValidationError('Usuario no autenticado');
    }

    // Manejar diferentes formatos de rol
    const rol = typeof usuario.rol === 'string' ? usuario.rol : usuario.rol?.name;
    
    console.log('Validando rol de usuario:', {
        rol,
        usuarioOriginal: usuario
    });

    if (rol !== 'administrador') {
        throw new ValidationError('Solo los administradores pueden registrar muestras');
    }

    return true;
};

// Función para verificar si un cliente existe
const verificarCliente = async (documento, token) => {
    try {
        console.log('Verificando cliente con documento:', documento);
        
        // Asegurarse de que el token esté en el formato correcto
        const tokenLimpio = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        
        // URL correcta del servicio de usuarios
        const url = 'https://back-usuarios-f.onrender.com/api/usuarios';
        
        console.log('Haciendo petición a:', url);
        
        const response = await axios.get(url, {
            headers: {
                'Authorization': tokenLimpio,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.data) {
            console.log('No se recibieron datos del servidor de usuarios');
            return null;
        }

        // Buscar el usuario por documento en la lista de usuarios
        const usuarios = Array.isArray(response.data) ? response.data : [response.data];
        const usuario = usuarios.find(u => u.documento === documento);
        
        if (!usuario) {
            console.log('No se encontró usuario con documento:', documento);
            return null;
        }

        // Verificar que el usuario sea un cliente
        const rol = typeof usuario.rol === 'string' ? usuario.rol : usuario.rol?.name;
        if (rol !== 'cliente') {
            console.log('El usuario no es un cliente. Rol:', rol);
            return null;
        }

        console.log('Cliente verificado exitosamente:', {
            documento: usuario.documento,
            nombre: usuario.nombre,
            rol: rol
        });
        
        return usuario;
    } catch (error) {
        console.error('Error al verificar cliente:', error.message);
        if (error.response) {
            console.error('Detalles del error:', {
                status: error.response.status,
                data: error.response.data
            });
        }
        return null;
    }
};

// Función para validar las firmas
const validarDominioFirmas = async (firmas, administrador, cliente) => {
    try {
        if (!firmas) {
            throw new ValidationError('Se requieren las firmas');
        }

        const { firmaAdministrador, firmaCliente } = firmas;

        // Validar firma del administrador
        if (!firmaAdministrador || !firmaAdministrador.firma) {
            throw new ValidationError('Se requiere la firma del administrador');
        }

        // Validar firma del cliente
        if (!firmaCliente || !firmaCliente.firma) {
            throw new ValidationError('Se requiere la firma del cliente');
        }

        // Validar que las firmas sean strings en base64
        const validarFormatoFirma = (firma) => {
            if (typeof firma !== 'string') {
                throw new ValidationError('La firma debe ser una cadena de texto en base64');
            }
            // Verificar que es base64 válido
            try {
                const decoded = Buffer.from(firma.split(',')[1] || firma, 'base64');
                if (decoded.length > 2 * 1024 * 1024) { // 2MB máximo
                    throw new ValidationError('La firma excede el tamaño máximo permitido (2MB)');
                }
            } catch (error) {
                throw new ValidationError('La firma debe estar en formato base64 válido');
            }
        };

        validarFormatoFirma(firmaAdministrador.firma);
        validarFormatoFirma(firmaCliente.firma);

        // Retornar objeto con las firmas validadas y metadatos
        return {
            administrador: {
                firma: firmaAdministrador.firma,
                documento: administrador.documento,
                nombre: administrador.nombre,
                fechaFirma: new Date(),
                rol: 'administrador'
            },
            cliente: {
                firma: firmaCliente.firma,
                documento: cliente.documento,
                nombre: cliente.nombre,
                fechaFirma: new Date(),
                rol: 'cliente'
            }
        };
    } catch (error) {
        console.error('Error en validación de firmas:', error);
        throw error;
    }
};

// Función para verificar si un usuario es administrador
const verificarAdministrador = async (token) => {
    try {
        // Limpiar el token
        const tokenLimpio = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        
        // Hacer la petición al servicio de usuarios
        const response = await axios.get(USUARIOS_API, {
            headers: {
                'Authorization': tokenLimpio,
                'Content-Type': 'application/json'
            }
        });

        if (!response.data) {
            console.log('No se recibieron datos del servidor de usuarios');
            return null;
        }

        // Buscar el usuario administrador en la respuesta
        const usuarios = Array.isArray(response.data) ? response.data : [response.data];
        const admin = usuarios.find(u => {
            const rol = typeof u.rol === 'string' ? u.rol : u.rol?.name;
            return rol === 'administrador';
        });

        if (!admin) {
            console.log('No se encontró un usuario administrador');
            return null;
        }

        return admin;
    } catch (error) {
        console.error('Error al verificar administrador:', error.message);
        return null;
    }
};

// Crear una nueva muestra
const crearMuestra = async (req, res) => {
    try {
        const token = req.headers.authorization;
        if (!token) {
            throw new ValidationError('Token no proporcionado');
        }

        // Obtener datos del administrador
        const adminData = await verificarAdministrador(token);
        if (!adminData) {
            throw new ValidationError('No autorizado - Se requiere rol de administrador');
        }

        // Verificar cliente
        const cliente = await verificarCliente(req.body.documento, token);
        if (!cliente) {
            throw new ValidationError('Cliente no encontrado o no válido');
        }

        // Validar las firmas
        const firmasValidadas = await validarDominioFirmas(req.body.firmas, adminData, cliente);

        // Crear el objeto de muestra con todos los campos requeridos
        const nuevaMuestra = {
            ...req.body,
            estado: 'Recibida',
            creadoPor: adminData._id || adminData.id, // Manejar ambos casos
            historial: [{
                estado: 'Recibida',
                cedulaadministrador: adminData.documento,
                nombreadministrador: adminData.nombre,
                fechaCambio: new Date(),
                observaciones: 'Muestra registrada inicialmente'
            }],
            firmas: {
                cedulaLaboratorista: adminData.documento,
                firmaLaboratorista: firmasValidadas.administrador.firma,
                cedulaCliente: cliente.documento,
                firmaCliente: firmasValidadas.cliente.firma
            }
        };

        // Crear la muestra en la base de datos
        const muestra = await Muestra.create(nuevaMuestra);

        res.status(201).json({
            success: true,
            message: 'Muestra creada exitosamente',
            data: muestra
        });

    } catch (error) {
        console.error('Error al crear muestra:', error);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message,
            errorCode: error.name === 'ValidationError' ? 'VALIDATION_ERROR' : 'INTERNAL_SERVER_ERROR',
            errors: error.errors
        });
    }
};

// Actualizar una muestra
const actualizarMuestra = async (req, res, next) => {
    try {
        const { id } = req.params;
        const usuario = {
            documento: req.usuarioDocumento,
            nombre: req.body.actualizadoPor?.nombre || 'Usuario',
            rol: req.body.actualizadoPor?.rol || 'administrador'
        };

        const muestraActualizada = await muestrasService.actualizarMuestra(id, req.body, usuario);
        ResponseHandler.success(res, { muestra: muestraActualizada }, 'Muestra actualizada exitosamente');
    } catch (error) {
        next(error);
    }
};

// Registrar firma en una muestra
const registrarFirma = async (req, res, next) => {
    try {
        const { idMuestra } = req.params;
        const usuario = {
            documento: req.usuarioDocumento,
            nombre: req.body.nombre || 'Usuario',
            rol: req.body.rol || 'administrador'
        };

        const muestraFirmada = await muestrasService.registrarFirma(idMuestra, req.body, usuario);
        ResponseHandler.success(res, { muestra: muestraFirmada }, 'Firma registrada exitosamente');
    } catch (error) {
        next(error);
    }
};

// Eliminar una muestra
const eliminarMuestra = async (req, res, next) => {
    try {
        console.log('Iniciando eliminación de muestra...');
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.log('ID de muestra no válido:', id);
            throw new ValidationError('ID de muestra no válido');
        }

        const muestra = await Muestra.findByIdAndDelete(id);
        if (!muestra) {
            console.log('Muestra no encontrada con ID:', id);
            throw new NotFoundError('Muestra no encontrada');
        }

        ResponseHandler.success(res, null, 'Muestra eliminada correctamente');
    } catch (error) {
        console.error('Error detallado al eliminar muestra:', error);
        next(error);
    }
};

module.exports = {
    obtenerMuestras,
    obtenerMuestrasPorTipo,
    obtenerMuestrasPorEstado,
    obtenerMuestra,
    crearMuestra,
    actualizarMuestra,
    eliminarMuestra,
    registrarFirma
};