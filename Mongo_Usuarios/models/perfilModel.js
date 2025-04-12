const mongoose = require('mongoose');

const PerfilSchema = new mongoose.Schema({
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
    unique: true
  },
  nombre: String,
  email: String,
  telefono: String,
  direccion: String,
  fotoPerfil: String
});

module.exports = mongoose.model('Perfil', PerfilSchema);