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

        try{

            const usuario = await verificarRolUsuario(token);
            req.usuario = {
                id: usuario.id,
                rol: usuario.rol
            };
            next();
       
        } catch (Error) {
            console.error("Error al verificar token:", Error.message);
            return res.status(401).json({ 
                mensaje: "Token inválido o expirado",
                detalles: Error.message 
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
            mensaje: "Acceso denegado. Se requieren permisos de administrador." 
        });
    }
    next();
};