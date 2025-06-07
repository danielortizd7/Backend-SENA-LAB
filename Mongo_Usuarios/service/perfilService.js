const Perfil = require('../models/perfilModel');

const crearPerfil = async (datos) => {
  const nuevoPerfil = new Perfil(datos);
  return await nuevoPerfil.save();
};

const obtenerPerfilPorUsuario = async (usuarioId) => {
  const perfil = await Perfil.findOne({ usuarioId }).populate({
    path: 'usuarioId',
    select: 'nombre email telefono direccion fotoPerfil' // Solo los datos públicos
  });

  if (!perfil) return null;

  // Armas una respuesta segura solo con los campos visibles
  return {
    nombre: perfil.nombre,
    email: perfil.email,
    telefono: perfil.telefono,
    direccion: perfil.direccion,
    fotoPerfil: perfil.fotoPerfil
  };
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
