/**
 * COMPARAR TOKENS DANIELA VS FELIPE
 * Script para probar ambos tokens FCM y comparar resultados
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

async function obtenerToken(clienteDocumento) {
    try {
        const query = { clienteDocumento: clienteDocumento, isActive: true };
        const tokens = await DeviceToken.find(query).sort({ createdAt: -1 });
        
        if (tokens.length === 0) {
            return null;
        }
        
        return tokens[0];
        
    } catch (error) {
        console.error(`❌ Error obteniendo token para ${clienteDocumento}:`, error);
        return null;
    }
}

async function probarToken(clienteDocumento, tokenData) {
    try {
        console.log(`\n🚀 === PROBANDO TOKEN DE ${clienteDocumento} ===`);
        console.log('===============================================');
        
        if (!tokenData) {
            console.log('❌ No se encontró token para', clienteDocumento);
            return { success: false, error: 'Token no encontrado' };
        }
        
        console.log('📋 Token encontrado:');
        console.log('   - ID:', tokenData._id);
        console.log('   - Documento:', tokenData.clienteDocumento);
        console.log('   - Platform:', tokenData.platform);
        console.log('   - Creado:', tokenData.createdAt);
        console.log('   - Activo:', tokenData.isActive);
        console.log('   - Longitud token:', tokenData.deviceToken.length);
        console.log('   - Formato válido:', tokenData.deviceToken.includes(':APA91b') ? '✅ Sí' : '❌ No');
        
        // Enviar mensaje de prueba
        const message = {
            notification: {
                title: `🎯 Prueba ${clienteDocumento}`,
                body: `Notificación de prueba para ${clienteDocumento}. Si ves esto, ¡funciona perfectamente!`
            },
            data: {
                tipo: 'prueba_comparacion',
                clienteDocumento: clienteDocumento,
                timestamp: new Date().toISOString()
            },
            token: tokenData.deviceToken
        };
        
        console.log('📤 Enviando notificación de prueba...');
        const response = await admin.messaging().send(message);
        
        console.log('✅ ¡NOTIFICACIÓN ENVIADA EXITOSAMENTE!');
        console.log('📋 Response ID:', response);
        
        return { success: true, responseId: response, tokenData };
        
    } catch (error) {
        console.log(`❌ Error enviando notificación a ${clienteDocumento}:`);
        console.log('🔍 Error:', error.message);
        console.log('🔍 Código:', error.code);
        
        if (error.code === 'messaging/registration-token-not-registered') {
            console.log('💡 El token ha expirado, regenera el token en la app Android');
        } else if (error.code === 'messaging/invalid-argument') {
            console.log('💡 El token tiene formato inválido');
        }
        
        return { success: false, error: error.message, code: error.code };
    }
}

async function compararTokens() {
    try {
        console.log('🔍 === COMPARACIÓN DE TOKENS DANIELA VS FELIPE ===');
        console.log('==================================================');
        
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
        
        // Obtener tokens
        console.log('\n📋 Obteniendo tokens...');
        const tokenDaniela = await obtenerToken('2129239233');
        const tokenFelipe = await obtenerToken('1235467890');
        
        // Probar ambos tokens
        const resultadoDaniela = await probarToken('Daniela (2129239233)', tokenDaniela);
        const resultadoFelipe = await probarToken('Felipe (1235467890)', tokenFelipe);
        
        // Mostrar resumen
        console.log('\n📊 === RESUMEN DE COMPARACIÓN ===');
        console.log('==================================');
        
        console.log('\n👩 DANIELA:');
        console.log('   - Token encontrado:', tokenDaniela ? '✅ Sí' : '❌ No');
        console.log('   - Notificación enviada:', resultadoDaniela.success ? '✅ Sí' : '❌ No');
        if (resultadoDaniela.success) {
            console.log('   - Response ID:', resultadoDaniela.responseId);
        } else {
            console.log('   - Error:', resultadoDaniela.error);
        }
        
        console.log('\n👨 FELIPE:');
        console.log('   - Token encontrado:', tokenFelipe ? '✅ Sí' : '❌ No');
        console.log('   - Notificación enviada:', resultadoFelipe.success ? '✅ Sí' : '❌ No');
        if (resultadoFelipe.success) {
            console.log('   - Response ID:', resultadoFelipe.responseId);
        } else {
            console.log('   - Error:', resultadoFelipe.error);
        }
        
        // Conclusiones
        console.log('\n🎯 === CONCLUSIONES ===');
        console.log('=======================');
        
        if (resultadoDaniela.success && resultadoFelipe.success) {
            console.log('✅ Ambos tokens funcionan correctamente');
            console.log('📱 Revisar dispositivos Android de ambos usuarios');
            console.log('💡 Si alguno no recibe notificaciones, el problema está en el dispositivo');
        } else if (resultadoDaniela.success && !resultadoFelipe.success) {
            console.log('✅ Token de Daniela funciona');
            console.log('❌ Token de Felipe tiene problemas');
        } else if (!resultadoDaniela.success && resultadoFelipe.success) {
            console.log('❌ Token de Daniela tiene problemas');
            console.log('✅ Token de Felipe funciona');
        } else {
            console.log('❌ Ambos tokens tienen problemas');
            console.log('🔧 Revisar configuración de Firebase y tokens');
        }
        
    } catch (error) {
        console.error('❌ Error en comparación:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔐 Desconectado de MongoDB');
    }
}

// Ejecutar comparación
compararTokens().catch(console.error);
