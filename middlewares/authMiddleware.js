import { verificarRolUsuario } from '../services/usuariosService.js';

export const verificarToken = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        if (!authHeader) {
            return res.status(401).json({ 
                mensaje: "Acceso denegado. Header de autorización no encontrado." 
            });
        }

        const token = authHeader.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                mensaje: "Acceso denegado. Token no proporcionado." 
            });
        }

        try {
            const usuario = await verificarRolUsuario(token);
            if (!usuario || !usuario.rol) {
                return res.status(401).json({ 
                    mensaje: "Token inválido: información del usuario incompleta." 
                });
            }

            req.usuario = {
                id: usuario.id,
                rol: usuario.rol
            };
            next();
        } catch (error) {
            console.error("Error al verificar token:", error.message);
            return res.status(401).json({ 
                mensaje: "Token inválido o expirado",
                detalles: error.message 
            });
        }
    } catch (error) {
        console.error("Error en middleware de autenticación:", error);
        res.status(500).json({ 
            mensaje: "Error en la autenticación",
            detalles: error.message 
        });
    }
};

export const verificarAdmin = async (req, res, next) => {
    if (!req.usuario || req.usuario.rol !== "administrador") {
        return res.status(403).json({ 
            mensaje: "Acceso denegado. Se requieren permisos de administrador.",
            detalles: `Rol actual: ${req.usuario?.rol || "No definido"}` 
        });
    }
    next();
};