const mongoose = require('mongoose');

const auditoriaMuestrasSchema = new mongoose.Schema({
    usuario: {
        id: { type: String, required: true },
        nombre: { type: String, required: true },
        documento: { type: String, required: true },
        rol: { type: String, required: true }
    },
    accion: {
        tipo: { 
            type: String, 
            enum: ['POST', 'PUT', 'DELETE', 'PATCH'],
            required: true 
        },
       // ruta: { type: String, required: true },
        descripcion: { type: String }
    },
    muestra: {
        id: { type: String, required: true },
        tipo: { type: String },
        estado: { type: String },
        datosCompletos: { type: mongoose.Schema.Types.Mixed }
    },
 /*  cambios: {
        anteriores: { type: mongoose.Schema.Types.Mixed },
        nuevos: { type: mongoose.Schema.Types.Mixed }
    },
    metadata: {
        fecha: { type: Date, default: Date.now },
        ip: { type: String },
        userAgent: { type: String }
    }*/
}, { 
    timestamps: true,
    collection: 'auditoria_muestras' // Colección separada en MongoDB
});

// Índices para optimización
auditoriaMuestrasSchema.index({ 'usuario.documento': 1 });
auditoriaMuestrasSchema.index({ 'muestra.id': 1 });
auditoriaMuestrasSchema.index({ 'metadata.fecha': -1 });

module.exports = mongoose.model('AuditoriaMuestras', auditoriaMuestrasSchema);
