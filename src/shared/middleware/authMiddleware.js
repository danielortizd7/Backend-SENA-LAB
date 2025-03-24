const { verificarRolUsuario, validarUsuario } = require('../../app/registro-muestras/services/usuariosService');
const { ResponseHandler } = require('../utils/responseHandler');
const { AuthenticationError } = require('../errors/AppError');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const { AuthorizationError } = require('../errors/AppError');

// Función para obtener el payload del token sin verificar la firma
const decodeToken = (token) => {
    try {
        return jwt.decode(token, { complete: true });
    } catch (error) {
        console.error('Error decodificando token:', error);
        return null;
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Intento de login recibido:', { email });

        // Usuario administrador por defecto (debería venir de variables de entorno en producción)
        const defaultAdmin = {
            id: process.env.ADMIN_ID || '1',
            email: process.env.ADMIN_EMAIL || 'danielortizd7@gmail.com',
            password: process.env.ADMIN_PASSWORD || 'Daniel123!',
            nombre: process.env.ADMIN_NAME || 'Daniel Ortiz',
            rol: { name: 'administrador' }
        };

        // Verificar credenciales
        if (email === defaultAdmin.email && password === defaultAdmin.password) {
            const token = jwt.sign(
                {
                    id: defaultAdmin.id,
                    email: defaultAdmin.email,
                    rol: defaultAdmin.rol.name,
                    nombre: defaultAdmin.nombre
                },
                process.env.JWT_SECRET || 'tu_clave_secreta',
                { expiresIn: '8h' }
            );

            console.log('Login exitoso para:', email);
            return ResponseHandler.success(res, {
                token,
                usuario: {
                    id: defaultAdmin.id,
                    email: defaultAdmin.email,
                    nombre: defaultAdmin.nombre,
                    rol: defaultAdmin.rol
                }
            }, 'Login exitoso');
        }

        return ResponseHandler.error(res, new AuthenticationError('Credenciales inválidas'));
    } catch (error) {
        console.error('Error en login:', error);
        return ResponseHandler.error(res, error);
    }
};

const verificarToken = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return ResponseHandler.error(res, new AuthenticationError('Token no proporcionado'));
        }

        // Decodificar el token sin verificar la firma
        const decodedToken = decodeToken(token);
        if (!decodedToken) {
            return ResponseHandler.error(res, new AuthenticationError('Token malformado', { code: 'INVALID_TOKEN' }));
        }

        // Extraer el payload
        const decoded = decodedToken.payload;

        // Verificar la expiración manualmente
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < now) {
            return ResponseHandler.error(res, new AuthenticationError('Token expirado', { code: 'TOKEN_EXPIRED' }));
        }

        // Adaptar la estructura del token
        req.usuario = {
            id: decoded.userId || decoded.id,
            email: decoded.email,
            nombre: decoded.nombre,
            rol: decoded.rol,
            permisos: decoded.permisos || [],
            documento: decoded.userId || decoded.id
        };

        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return ResponseHandler.error(res, new AuthenticationError('Error de autenticación', { code: 'AUTH_ERROR' }));
    }
};

const verificarDocumento = async (req, res, next) => {
    try {
        const token = req.headers.authorization;
        
        if (!token) {
            throw new AuthenticationError('Token no proporcionado');
        }

        // Limpiar el token
        const tokenLimpio = token.startsWith('Bearer ') ? token.slice(7) : token;

        // Decodificar el token sin verificar la firma
        const decoded = jwt.decode(tokenLimpio);
        
        if (!decoded) {
            throw new AuthenticationError('Token inválido');
        }

        // Verificar manualmente la expiración
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
            throw new AuthenticationError('Token expirado');
        }

        console.log('Token decodificado:', {
            id: decoded.id || decoded.userId,
            rol: decoded.rol,
            exp: new Date(decoded.exp * 1000)
        });

        // Extraer información del usuario
        req.usuario = {
            id: decoded.id || decoded.userId,
            documento: decoded.documento || decoded.id || decoded.userId,
            nombre: decoded.nombre,
            email: decoded.email,
            rol: decoded.rol
        };

        // Validar que tengamos la información mínima necesaria
        if (!req.usuario.id || !req.usuario.rol) {
            throw new AuthenticationError('Token no contiene la información necesaria del usuario');
        }

        // Asignar el documento del usuario para uso en controladores
        req.usuarioDocumento = req.usuario.documento;

        next();
    } catch (error) {
        console.error('Error en middleware de autenticación:', error);
        next(error);
    }
};

const verificarRolAdministrador = async (req, res, next) => {
    try {
        if (!req.usuario) {
            throw new AuthenticationError('Usuario no encontrado en la solicitud');
        }

        if (!req.usuario.esAdmin && req.usuario.rol !== 'administrador') {
            throw new AuthenticationError(
                "Acceso denegado. Se requieren permisos de administrador.",
                { rolActual: req.usuario.rol || "No definido" }
            );
        }

        next();
    } catch (error) {
        console.error("Error en verificación de rol:", error);
        ResponseHandler.error(res, error);
    }
};

const verificarLaboratorista = async (req, res, next) => {
    try {
        const token = req.headers.authorization;
        if (!token) {
            throw new AuthorizationError('Token no proporcionado');
        }

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
            throw new AuthorizationError('No se pudo verificar el usuario');
        }

        // Buscar el usuario en la respuesta
        const usuarios = Array.isArray(response.data) ? response.data : [response.data];
        const usuario = usuarios.find(u => {
            // Verificar si el rol es un objeto o un string
            const rol = typeof u.rol === 'string' ? u.rol : u.rol?.name;
            return rol === 'laboratorista' && u.activo === true;
        });

        if (!usuario) {
            throw new AuthorizationError('Acceso denegado - Se requiere rol de laboratorista');
        }

        // Agregar información del laboratorista al request para uso posterior
        req.laboratorista = {
            documento: usuario.documento,
            nombre: usuario.nombre,
            id: usuario._id
        };

        next();
    } catch (error) {
        console.error('Error en verificación de laboratorista:', error);
        next(new AuthorizationError('No autorizado - Se requiere rol de laboratorista'));
    }
};

module.exports = {
    login,
    verificarToken,
    verificarDocumento,
    verificarRolAdministrador,
    verificarLaboratorista
};