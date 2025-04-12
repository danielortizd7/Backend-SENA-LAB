const Perfil = require('../models/perfilModel');

const obtenerPerfilPorUsuario = async (usuarioId) => {
  return await Perfil.findOne({ usuarioId }).populate('usuarioId');
};

const actualizarPerfil = async (usuarioId, datos) => {
  return await Perfil.findOneAndUpdate(
    { usuarioId },
    { $set: datos },
    { new: true }
  );
};

module.exports = {
  obtenerPerfilPorUsuario,
  actualizarPerfil
};