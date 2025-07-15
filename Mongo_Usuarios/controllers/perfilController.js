const perfilService = require('../service/perfilService');
const path = require('path');
const fs = require('fs');

// Crear un nuevo perfil
const crearPerfil = async (req, res) => {
  try {
    if (req.file) {
      req.body.fotoPerfil = `/uploads/${req.file.filename}`;
    }

    const perfil = await perfilService.crearPerfil(req.body);

    res.status(201).json({
      mensaje: 'Perfil creado exitosamente',
      perfil: {
        nombre: perfil.nombre,
        direccion: perfil.direccion,
        telefono: perfil.telefono,
        fotoPerfil: perfil.fotoPerfil
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener perfil de usuario
const obtenerPerfil = async (req, res) => {
  try {
    const perfil = await perfilService.obtenerPerfilPorUsuario(req.params.idUsuario);

    if (!perfil) return res.status(404).json({ mensaje: 'Perfil no encontrado' });

    const urlBase = req.protocol + '://' + req.get('host');
    const fotoPerfilUrl = perfil.fotoPerfil ? `${urlBase}${perfil.fotoPerfil}` : null;

    res.json({
      nombre: perfil.nombre,
      email: perfil.email,
      telefono: perfil.telefono,
      direccion: perfil.direccion,
      fotoPerfil: fotoPerfilUrl
    }); 
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar perfil 
const actualizarPerfil = async (req, res) => {
  try {
    const usuarioId = req.params.idUsuario;
    const actualizacionDatos = { ...req.body };

    if (req.file) {
      const perfilActual = await perfilService.obtenerPerfilPorUsuario(usuarioId);

      if (perfilActual && perfilActual.fotoPerfil) {
        const rutaAnterior = path.join(__dirname, '..', 'public', perfilActual.fotoPerfil); 
        if (fs.existsSync(rutaAnterior)) {
          fs.unlinkSync(rutaAnterior);
        }
      }

      actualizacionDatos.fotoPerfil = `/uploads/${req.file.filename}`;
    }

    // Actualizar perfil
    const perfilActualizado = await perfilService.actualizarPerfil(usuarioId, actualizacionDatos);

    // Sincronizar datos en Usuario
    const Usuario = require('../models/Usuario');
    const camposUsuario = {};
    if (actualizacionDatos.nombre) camposUsuario.nombre = actualizacionDatos.nombre;
    if (actualizacionDatos.email) camposUsuario.email = actualizacionDatos.email;
    if (actualizacionDatos.telefono) camposUsuario.telefono = actualizacionDatos.telefono;
    if (actualizacionDatos.direccion) camposUsuario.direccion = actualizacionDatos.direccion;
    // Solo actualiza si hay algún campo
    if (Object.keys(camposUsuario).length > 0) {
      await Usuario.findByIdAndUpdate(usuarioId, { $set: camposUsuario });
    }

    if (!perfilActualizado) {
      return res.status(404).json({ mensaje: 'Perfil no encontrado' });
    }

    res.json({
      mensaje: 'Perfil actualizado correctamente',
      perfil: perfilActualizado
    });
    
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  crearPerfil,
  obtenerPerfil,
  actualizarPerfil
};
