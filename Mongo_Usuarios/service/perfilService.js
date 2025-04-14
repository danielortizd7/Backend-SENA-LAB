const Perfil = require('../models/perfilModel');

const crearPerfil = async (datos) => {
  const nuevoPerfil = new Perfil(datos);
  return await nuevoPerfil.save();
};
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
  crearPerfil,
  obtenerPerfilPorUsuario,
  actualizarPerfil
};