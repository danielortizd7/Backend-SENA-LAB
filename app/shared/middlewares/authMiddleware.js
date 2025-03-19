const jwt = require('jsonwebtoken');

// Middleware para verificar el token JWT
const verificarToken = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ mensaje: 'Acceso denegado. Token no proporcionado.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch (error) {
        console.error('Error de autenticación:', error);
        res.status(401).json({ mensaje: 'Token inválido o expirado' });
    }
};

// Middleware para verificar rol de administrador
const verificarAdmin = (req, res, next) => {
    try {
        if (!req.usuario) {
            return res.status(401).json({ mensaje: 'Usuario no autenticado' });
        }

        if (req.usuario.rol !== 'admin') {
            return res.status(403).json({ mensaje: 'Acceso denegado. Se requieren privilegios de administrador.' });
        }

        next();
    } catch (error) {
        console.error('Error al verificar rol de administrador:', error);
        res.status(500).json({ mensaje: 'Error al verificar permisos de administrador' });
    }
};

module.exports = { verificarToken, verificarAdmin };