module.exports = (campoId = 'idUsuario') => (req, res, next) => {
    if (!req.usuario || req.usuario._id.toString() !== req.params[campoId].toString()) {
        return res.status(403).json({ error: 'Acceso denegado: solo el usuario propietario puede ver o editar este recurso.' });
    }
    next();
};