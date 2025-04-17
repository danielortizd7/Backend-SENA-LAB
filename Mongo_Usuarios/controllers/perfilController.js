const perfilService = require('../service/perfilService');
const path = require('path');
const fs = require('fs');

// Crear un nuevo perfil
const crearPerfil = async (req, res) => {
  try {
    // Añadir la ruta de la foto si existe
    if (req.file) {
      req.body.fotoPerfil = `/uploads/${req.file.filename}`;
    }
    
    const perfil = await perfilService.crearPerfil(req.body);
    res.status(201).json(perfil);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener perfil de usuario
const obtenerPerfil = async (req, res) => {
  try {
    const perfil = await perfilService.obtenerPerfilPorUsuario(req.params.idUsuario);
    if (!perfil) return res.status(404).json({ mensaje: 'Perfil no encontrado' });
    
    res.json(perfil);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar perfil de usuario
const actualizarPerfil = async (req, res) => {
  try {
    const usuarioId = req.params.idUsuario;
    const actualizacionDatos = { ...req.body };
    
    // Si hay una nueva imagen, actualizar la ruta
    if (req.file) {
      // Primero obtenemos el perfil actual para ver si ya tiene una foto
      const perfilActual = await perfilService.obtenerPerfilPorUsuario(usuarioId);
      
      // Si ya tiene una foto, eliminar el archivo anterior
      if (perfilActual && perfilActual.fotoPerfil) {
        const rutaAnterior = path.join(__dirname, '..', perfilActual.fotoPerfil);
        if (fs.existsSync(rutaAnterior)) {
          fs.unlinkSync(rutaAnterior);
        }
      }
      
      // Actualizar con la nueva ruta
      actualizacionDatos.fotoPerfil = `/uploads/${req.file.filename}`;
    }
    
    const perfilActualizado = await perfilService.actualizarPerfil(usuarioId, actualizacionDatos);
    
    if (!perfilActualizado) {
      return res.status(404).json({ mensaje: 'Perfil no encontrado' });
    }
    
    res.json(perfilActualizado);
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