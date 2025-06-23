const mongoose = require('mongoose');

const deviceTokenSchema = new mongoose.Schema({
    clienteId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    clienteDocumento: {
        type: String,
        required: true,
        index: true
    },
    deviceToken: {
        type: String,
        required: true,
        unique: true
    },
    platform: {
        type: String,
        enum: ['ios', 'android', 'web'],
        required: true
    },
    appVersion: {
        type: String,
        default: '1.0.0'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastUsed: {
        type: Date,
        default: Date.now
    },
    deviceInfo: {
        deviceId: String,
        deviceName: String,
        osVersion: String,
        appBuild: String
    }
}, {
    timestamps: true
});

// Índices compuestos para consultas eficientes
deviceTokenSchema.index({ clienteId: 1, isActive: 1 });
deviceTokenSchema.index({ clienteDocumento: 1, isActive: 1 });
deviceTokenSchema.index({ deviceToken: 1, isActive: 1 });

// Middleware para actualizar lastUsed
deviceTokenSchema.pre('save', function(next) {
    if (this.isModified('isActive') && this.isActive) {
        this.lastUsed = new Date();
    }
    next();
});

// Método para desactivar tokens antiguos del mismo dispositivo
deviceTokenSchema.statics.deactivateOldTokens = async function(clienteId, newDeviceToken) {
    await this.updateMany(
        { 
            clienteId: clienteId,
            deviceToken: { $ne: newDeviceToken }
        },
        { 
            isActive: false 
        }
    );
};

module.exports = mongoose.model('DeviceToken', deviceTokenSchema);
