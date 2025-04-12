require('dotenv').config();
const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');
const Perfil = require('../models/perfilModel');

const MONGO_URI = process.env.MONGODB_URI;

async function conectarGenerarPerfiles() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("Conectado a MongoDB");

    const usuarios = await Usuario.find();

    for (let usuario of usuarios) {
      const existePerfil = await Perfil.findOne({ usuarioId: usuario._id });
      if (!existePerfil) {
        await Perfil.create({
          usuarioId: usuario._id,
          nombre: usuario.nombre || '',
          email: usuario.email || '',
          telefono: usuario.telefono || '',
          direccion: usuario.direccion || '',
          fotoPerfil: ''
        });
        console.log(`✅ Perfil creado para: ${usuario._id}`);
      } else {
        console.log(`⏩ Perfil ya existe para: ${usuario._id}`);
      }
    }

  } catch (error) {
    console.error('❌ Error al generar perfiles:', error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Desconectado de MongoDB");
  }
}

conectarGenerarPerfiles();