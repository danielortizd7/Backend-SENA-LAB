const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['super_admin', 'administrador', 'laboratorista', 'cliente']
  },
  permisos: {
    type: [String],
    required: true,
    default: []
  },
  description: {
    type: String,
  }
});

roleSchema.methods.tienePermiso = function(permiso) {
  return this.permisos.includes(permiso);
};


module.exports = mongoose.model('Role', roleSchema);
