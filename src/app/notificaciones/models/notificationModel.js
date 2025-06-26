const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    clienteId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        index: true,
        default: null
    },
    clienteDocumento: {
        type: String,
        required: false,
        index: true,
        default: null
    },
    muestraId: {
        type: String, // id_muestra como RM250615003
        required: true,
        index: true
    },
    tipo: {
        type: String,
        enum: ['cambio_estado', 'recordatorio', 'resultado_disponible', 'cotizacion_actualizada'],
        required: true
    },
    titulo: {
        type: String,
        required: true,
        maxlength: 100
    },
    mensaje: {
        type: String,
        required: true,
        maxlength: 500
    },
    data: {
        estadoAnterior: String,
        estadoNuevo: String,
        fechaCambio: Date,
        observaciones: String,
        // Datos adicionales específicos del tipo de notificación
        metadata: {
            type: mongoose.Schema.Types.Mixed
        }
    },
    canal: {
        type: String,
        enum: ['push', 'websocket', 'email', 'sms'],
        default: 'push'
    },
    estado: {
        type: String,
        enum: ['pendiente', 'enviada', 'entregada', 'leida', 'fallida'],
        default: 'pendiente'
    },
    intentos: {
        type: Number,
        default: 0,
        max: 5
    },
    fechaEnvio: Date,
    fechaEntrega: Date,
    fechaLectura: Date,
    error: {
        codigo: String,
        mensaje: String,
        detalles: mongoose.Schema.Types.Mixed
    },
    deviceTokens: [{
        token: String,
        platform: String,
        enviada: { type: Boolean, default: false },
        entregada: { type: Boolean, default: false },
        error: String
    }]
}, {
    timestamps: true
});

// Índices para consultas eficientes
notificationSchema.index({ clienteId: 1, createdAt: -1 });
notificationSchema.index({ clienteDocumento: 1, createdAt: -1 });
notificationSchema.index({ muestraId: 1, tipo: 1 });
notificationSchema.index({ estado: 1, createdAt: -1 });
notificationSchema.index({ 'data.estadoNuevo': 1 });

// Método para marcar como leída
notificationSchema.methods.marcarComoLeida = function() {
    this.estado = 'leida';
    this.fechaLectura = new Date();
    return this.save();
};

// Método para reintentar envío
notificationSchema.methods.reintentar = function() {
    if (this.intentos < 5) {
        this.intentos += 1;
        this.estado = 'pendiente';
        this.error = undefined;
        return this.save();
    }
    throw new Error('Máximo número de intentos alcanzado');
};

// Método estático para obtener notificaciones por cliente (por ID o documento)
notificationSchema.statics.obtenerPorCliente = function(identificador, limite = 20) {
    const query = (typeof identificador === 'string' && !identificador.match(/^[0-9a-fA-F]{24}$/))
        ? { clienteDocumento: identificador }
        : { clienteId: identificador };
    return this.find(query)
               .sort({ createdAt: -1 })
               .limit(limite)
               .lean();
};

// Método estático para obtener notificaciones no leídas (por ID o documento)
notificationSchema.statics.obtenerNoLeidas = function(identificador) {
    const query = (typeof identificador === 'string' && !identificador.match(/^[0-9a-fA-F]{24}$/))
        ? { clienteDocumento: identificador, estado: { $in: ['enviada', 'entregada'] } }
        : { clienteId: identificador, estado: { $in: ['enviada', 'entregada'] } };
    return this.find(query).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Notification', notificationSchema);
