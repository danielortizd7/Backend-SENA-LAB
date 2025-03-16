import jwt from 'jsonwebtoken';

export const verificarToken = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ mensaje: "Acceso denegado. Token no proporcionado." });
        }

        // Decodificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Guardar la información del usuario en el request
        req.usuario = {
            id: decoded.id,
            rol: decoded.rol
        };
        
        next();
    } catch (error) {
        res.status(401).json({ 
            mensaje: "Error en la autenticación", 
            error: error.message 
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