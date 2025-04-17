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

    // Solo devolvemos lo necesario
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

    res.json(perfil); // Ya viene "limpio" desde el servicio
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar perfil de usuario
const actualizarPerfil = async (req, res) => {
  try {
    const usuarioId = req.params.idUsuario;
    const actualizacionDatos = { ...req.body };

    if (req.file) {
      const perfilActual = await perfilService.obtenerPerfilPorUsuario(usuarioId);

      // Si existe una foto anterior, la eliminamos
      if (perfilActual && perfilActual.fotoPerfil) {
        const rutaAnterior = path.join(__dirname, '..', 'public', perfilActual.fotoPerfil); // asegúrate de que la ruta esté bien
        if (fs.existsSync(rutaAnterior)) {
          fs.unlinkSync(rutaAnterior);
        }
      }

      actualizacionDatos.fotoPerfil = `/uploads/${req.file.filename}`;
    }

    const perfilActualizado = await perfilService.actualizarPerfil(usuarioId, actualizacionDatos);

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
