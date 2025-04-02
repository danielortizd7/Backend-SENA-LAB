require('dotenv').config();
const crypto = require('crypto');
const { ObjectId } = require("mongodb");
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');

const usuarioSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  documento: {
    type: String,
    required: true,
    trim: true
  },
  telefono: {
    type: String,
    trim: true
  },
  direccion: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  rol: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  activo: {
    type: Boolean,
    default: true
  },
  detalles: {
    tipo: {
      type: String,
      enum: ['cliente']
    },
    razonSocial: {
      type: String
    },
    especialidad: String,
    nivelAcceso: Number,
    codigoSeguridad: String,
    registroAcciones: [{
      accion: String,
      fecha: Date,
      detalles: String
    }],
    historialSolicitudes: []
  },
  fechaCreacion: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  fechaActualizacion: Date,

  tokenRecuperacion: {
    token: {
      type: String,
      default: null
    },
    expiracion: {
      type: Date,
      default: null
    },
    intentos: {
      type: Number,
      default: 0
    }
  }
});

usuarioSchema.pre('findOneAndUpdate', function(next) {
  this.setOptions({ new: true, runValidators: true });
  this._update.fechaActualizacion = new Date();
  next();
});



usuarioSchema.statics.obtenerPorEmail = async function(email) {
  return await this.findOne({ email }).populate('rol').exec();
};

usuarioSchema.statics.obtenerPorId = async function(id) {
  return await this.findById(id).populate('rol');
};

usuarioSchema.statics.obtenerTodos = async function() {
  return await this.find({ })
    .select('-password -detalles')
    .populate('rol', '_id name')
    .exec();
};

usuarioSchema.statics.contarUsuarios = async function() {
  return await this.countDocuments({ activo: true });
};

usuarioSchema.statics.crear = async function(datos) {
  try {
    const nuevoUsuario = new this(datos);
    return await nuevoUsuario.save();
  } catch (error) {
    throw new Error(`Error al crear usuario: ${error.message}`);
  }
};

// En el modelo (usuarioModel.js)
usuarioSchema.statics.actualizarUsuario = async function(id, datosActualizados, usuarioActual) {
  try {
      // Validar que id sea un ObjectId válido
      if (!mongoose.Types.ObjectId.isValid(id)) {
          throw new Error('ID de usuario inválido');
      }
      
      const options = { 
          new: true, 
          runValidators: true,
          context: 'query'
      };
      
      const resultado = await this.findByIdAndUpdate(id, datosActualizados, options)
          .populate('rol');
          
      if (!resultado) {
          throw new Error(`Usuario con ID ${id} no encontrado`);
      }
      
      return resultado;
  } catch (error) {
      console.error('Error en actualizarUsuario:', error);
      throw new Error(`Error al actualizar: ${error.message}`);
  }
};

usuarioSchema.methods.puedeModificarUsuario = async function(usuarioObjetivoId) {
  if (!ObjectId.isValid(usuarioObjetivoId)) {
    throw new Error('ID de usuario no válido');
  }

  if (this._id.toString() === usuarioObjetivoId.toString()) {
    return true;
  }

  const usuarioObjetivo = await this.constructor.findById(usuarioObjetivoId).populate('rol');
  if (!usuarioObjetivo) {
    return false;
  }

  const miRol = this.rol.name.toLowerCase();
  const rolObjetivo = usuarioObjetivo.rol.name.toLowerCase();

  if (miRol === 'super_admin') {
    return rolObjetivo === 'administrador';
  }

  if (miRol === 'administrador') {
    return rolObjetivo === 'cliente' || rolObjetivo === 'laboratorista';
  }

  return false;
};



usuarioSchema.statics.generarTokenRecuperacion = async function(email) {
  const usuario = await this.findOne({ email }).populate('rol');
  if (!usuario) {
    return {
      email: email,
      token: 'token-simulado',
      nombre: 'Usuario no encontrado'
    };
  }
  
  const token = crypto.randomBytes(20).toString('hex');
  
  usuario.tokenRecuperacion = {
    token: token,
    expiracion: Date.now() + 3600000,
    intentos: 0
  };
  
  await usuario.save();
  
  return {
    email: usuario.email,
    token: token,
    nombre: usuario.nombre
  };
};

usuarioSchema.statics.validarTokenRecuperacion = async function(token) {
  const usuario = await this.findOne({ 
      'tokenRecuperacion.token': token,
      'tokenRecuperacion.expiracion': { $gt: new Date() }
  });
  
  if (!usuario) {
      return null;
  }
  
  usuario.tokenRecuperacion = undefined;
  await usuario.save();
  
  return usuario;
};

usuarioSchema.statics.actualizarContrasena = async function(userId, newHashedPassword) {
  try {
    const updatedUser = await this.findByIdAndUpdate(
      userId,
      { password: newHashedPassword },
      { new: true, runValidators: true }
    );
    return { success: true, user: updatedUser };
  } catch (error) {
    return { success: false, message: error.message };
  }
};
usuarioSchema.statics.inicializarRoles = async function() {
    const Role = require('./Role');
    const usuariosExistentes = await this.countDocuments({ rol: { $exists: true } });
    if (usuariosExistentes === 0) {
      const rolSuperAdmin = await Role.findOne({ name: 'super_admin' });
      if (!rolSuperAdmin) {
        throw new Error('No se encontró el rol super_admin en la colección de roles');
      }
      await this.create({
        email: 'agredoyudith00@gmail.com',
        nombre: 'Yudith Agredo',
        documento: '1108334033',
        rol: rolSuperAdmin._id,
        password: await bcrypt.hash('admin123', 10),
        activo: true,
        detalles: {
          codigoSeguridad: '3403'
        },
        fechaCreacion: new Date()
      });
    }
  };

  usuarioSchema.statics.obtenerRoles = async function () {
    return await this.find({ activo: true })
      .select('_id tipo')
      .populate('tipo', '_id name') 
      .exec();
  };

  usuarioSchema.statics.buscarPorDocumento = async function(documento) {
    return await this.findOne({ documento })
      .populate('rol', '_id name')
      .exec();
  };
  
usuarioSchema.statics.actualizarUsuario = async function(id, datosActualizados, usuarioActual) {
  try {
      const options = { 
          new: true, 
          runValidators: true,
          context: 'query'
      };
      
      return await this.findByIdAndUpdate(id, datosActualizados, options)
          .populate('rol');
  } catch (error) {
      console.error('Error en actualizarUsuario:', error);
      throw new Error(`Error al actualizar: ${error.message}`);
  }
};

const Usuario = mongoose.model('Usuario', usuarioSchema);

module.exports = Usuario;
