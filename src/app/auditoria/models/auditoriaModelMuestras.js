const mongoose = require('mongoose');

const auditoriaMuestrasSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
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
            required: false,
            default: 'POST'
        },
       // ruta: { type: String, required: true },
        descripcion: { type: String }
    },
    muestra: {
      //  id: { type: String, required: true },
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

// Método estático para generar el próximo ID secuencial
auditoriaMuestrasSchema.statics.generarNuevoId = async function() {
    // Buscar el último documento con _id tipo string que empiece con "auditoria"
    const ultimoRegistro = await this.findOne({ _id: { $regex: /^auditoria/ } })
        .sort({ _id: -1 })
        .select('_id')
        .lean();

    let nuevoNumero = 1;
    if (ultimoRegistro && typeof ultimoRegistro._id === 'string') {
        const numeroActual = parseInt(ultimoRegistro._id.replace('auditoria', ''), 10);
        if (!isNaN(numeroActual)) {
            nuevoNumero = numeroActual + 1;
        }
    }

    const nuevoId = 'auditoria' + nuevoNumero.toString().padStart(3, '0');
    return nuevoId;
};

module.exports = mongoose.model('AuditoriaMuestras', auditoriaMuestrasSchema);
