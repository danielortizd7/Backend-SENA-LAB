const mongoose = require('mongoose');

const accionSchema = new mongoose.Schema({
    tipo: { type: String, required: true },
    ruta: { type: String, required: true },
    descripcion: { type: String, required: true }
});

const usuarioSchema = new mongoose.Schema({
    id: { type: String, required: true },
    nombre: { type: String, required: true },
    rol: { type: String, required: true },
    documento: { type: String, required: true }
}, { _id: false });

const detallesSchema = new mongoose.Schema({
    ip: { type: String },
    userAgent: { type: String },
    parametros: { type: Object },
    query: { type: Object },
    body: { type: Object },
    idMuestra: { type: String },
    cambios: {
        antes: { type: Object },
        despues: { type: Object }
    }
}, { _id: false });

const auditoriaSchema = new mongoose.Schema({
    usuario: { type: usuarioSchema, required: true },
    accion: { type: accionSchema, required: true },
    detalles: { type: detallesSchema, required: true },
    fecha: { type: Date, required: true, default: Date.now }
}, { 
    timestamps: true,
    collection: 'registros_auditoria'
});

const Auditoria = mongoose.models.Auditoria || mongoose.model('Auditoria', auditoriaSchema);

module.exports = { Auditoria };
