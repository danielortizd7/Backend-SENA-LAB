/**
 * COMPARAR TOKENS FCM - FELIPE VS DANIELA
 * Script para comparar y probar tokens de ambos usuarios
 */

const mongoose = require('mongoose');
const admin = require('firebase-admin');
require('dotenv').config();

// Esquema del DeviceToken
const deviceTokenSchema = new mongoose.Schema({
    clienteId: mongoose.Schema.Types.ObjectId,
    clienteDocumento: String,
    deviceToken: String,
    platform: String,
    isActive: Boolean,
    createdAt: Date,
    updatedAt: Date,
    lastUsed: Date,
    deviceInfo: Object,
    appVersion: String
});

const DeviceToken = mongoose.model('DeviceToken', deviceTokenSchema, 'devicetokens');

async function obtenerYProbarToken(clienteDocumento, nombreCliente) {
    try {
        console.log(`\n🔍 === PROBANDO TOKEN DE ${nombreCliente.toUpperCase()} (${clienteDocumento}) ===`);
        console.log('='.repeat(60));
        
        // Buscar token del cliente
        const query = { clienteDocumento: clienteDocumento, isActive: true };
        const tokens = await DeviceToken.find(query).sort({ createdAt: -1 });
        
        if (tokens.length === 0) {
            console.log(`❌ No se encontraron tokens activos para ${nombreCliente}`);
            return null;
        }
        
        const token = tokens[0];
        console.log(`✅ Token encontrado para ${nombreCliente}:`);
        console.log('📋 ID:', token._id);
        console.log('📱 Platform:', token.platform);
        console.log('📅 Creado:', token.createdAt);
        console.log('🔄 Última vez usado:', token.lastUsed);
        console.log('📏 Longitud del token:', token.deviceToken.length);
        console.log('🔍 Formato válido:', token.deviceToken.includes(':APA91b') ? '✅ Sí' : '❌ No');
        
        // Probar envío de notificación
        console.log(`\n📤 Enviando notificación de prueba a ${nombreCliente}...`);
        
        const message = {
            notification: {
                title: `🎯 Prueba para ${nombreCliente}`,
                body: `Notificación de prueba enviada a ${nombreCliente} - ${new Date().toLocaleTimeString()}`
            },
            data: {
                tipo: 'prueba_comparativa',
                cliente: nombreCliente,
                documento: clienteDocumento,
                timestamp: new Date().toISOString()
            },
            token: token.deviceToken
        };
        
        const response = await admin.messaging().send(message);
        
        console.log(`✅ ¡NOTIFICACIÓN ENVIADA EXITOSAMENTE A ${nombreCliente.toUpperCase()}!`);
        console.log('📋 Response ID:', response);
        console.log(`📱 ${nombreCliente} debe revisar su dispositivo Android`);
        
        return {
            cliente: nombreCliente,
            documento: clienteDocumento,
            token: token.deviceToken,
            enviado: true,
            responseId: response
        };
        
    } catch (error) {
        console.log(`❌ Error con ${nombreCliente}:`, error.message);
        console.log('🔍 Código:', error.code);
        
        if (error.code === 'messaging/registration-token-not-registered') {
            console.log(`💡 Token de ${nombreCliente} ha expirado`);
        } else if (error.code === 'messaging/invalid-argument') {
            console.log(`💡 Token de ${nombreCliente} tiene formato inválido`);
        }
        
        return {
            cliente: nombreCliente,
            documento: clienteDocumento,
            enviado: false,
            error: error.message
        };
    }
}

async function compararTokens() {
    try {
        console.log('🚀 === COMPARACIÓN DE TOKENS FCM ===');
        console.log('===================================');
        
        // Conectar a MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado a MongoDB');
        
        // Configurar Firebase
        if (admin.apps.length === 0) {
            const firebaseConfig = {
                projectId: process.env.FIREBASE_PROJECT_ID,
                privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                clientId: process.env.FIREBASE_CLIENT_ID
            };

            admin.initializeApp({
                credential: admin.credential.cert(firebaseConfig),
                projectId: firebaseConfig.projectId
            });
            
            console.log('✅ Firebase inicializado');
        }
        
        // Probar ambos tokens
        const resultadoFelipe = await obtenerYProbarToken('1024578963', 'Felipe');
        const resultadoDaniela = await obtenerYProbarToken('2129239233', 'Daniela');
        
        // Resumen comparativo
        console.log('\n📊 === RESUMEN COMPARATIVO ===');
        console.log('==============================');
        
        console.log('\n👤 FELIPE:');
        if (resultadoFelipe) {
            console.log('📤 Enviado:', resultadoFelipe.enviado ? '✅ Sí' : '❌ No');
            if (resultadoFelipe.enviado) {
                console.log('📋 Response ID:', resultadoFelipe.responseId);
            } else {
                console.log('❌ Error:', resultadoFelipe.error);
            }
        } else {
            console.log('❌ No se encontró token');
        }
        
        console.log('\n👤 DANIELA:');
        if (resultadoDaniela) {
            console.log('📤 Enviado:', resultadoDaniela.enviado ? '✅ Sí' : '❌ No');
            if (resultadoDaniela.enviado) {
                console.log('📋 Response ID:', resultadoDaniela.responseId);
            } else {
                console.log('❌ Error:', resultadoDaniela.error);
            }
        } else {
            console.log('❌ No se encontró token');
        }
        
        console.log('\n🎯 === PRÓXIMOS PASOS ===');
        console.log('=========================');
        console.log('1. Felipe: Revisar dispositivo Android');
        console.log('2. Daniela: Revisar dispositivo Android');
        console.log('3. Comparar quién recibe las notificaciones');
        console.log('4. Identificar diferencias entre dispositivos');
        
    } catch (error) {
        console.error('❌ Error general:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔐 Desconectado de MongoDB');
    }
}

// Ejecutar comparación
compararTokens().catch(console.error);
