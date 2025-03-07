export const verificarAdmin = (req, res, next) => {
    if (!req.usuario || req.usuario.rol !== "administrador") {
        return res.status(403).json({ mensaje: "Acceso denegado. Se requieren permisos de administrador." });
    }
    next();
};
