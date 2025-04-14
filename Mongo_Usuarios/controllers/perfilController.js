const perfilService = require('../service/perfilService');

const crearPerfil = async (req, res) => {
  try {
    const perfil = await perfilService.crearPerfil(req.body);
    res.status(201).json(perfil);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const obtenerPerfil = async (req, res) => {
  try {
    const perfil = await perfilService.obtenerPerfilPorUsuario(req.params.idUsuario);
    if (!perfil) return res.status(404).json({ mensaje: 'Perfil no encontrado' });
    res.json(perfil);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const actualizarPerfil = async (req, res) => {
  try {
    const perfilActualizado = await perfilService.actualizarPerfil(req.params.idUsuario, req.body);
    if (!perfilActualizado) return res.status(404).json({ mensaje: 'Perfil no encontrado' });
    res.json(perfilActualizado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  crearPerfil,
  obtenerPerfil,
  actualizarPerfil
};
