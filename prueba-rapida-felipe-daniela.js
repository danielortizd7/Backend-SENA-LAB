/**
 * PRUEBA RÁPIDA FELIPE VS DANIELA
 * Script simplificado para probar ambos tokens FCM
 */

const mongoose = require('mongoose');
const admin = require('firebase-admin');
require('dotenv').config();

async function pruebaRapida() {
    try {
        console.log('🚀 === PRUEBA RÁPIDA FCM ===');
        console.log('===========================');
        
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
        
        // Buscar tokens
        console.log('\n🔍 Buscando tokens...');
        
        const tokenFelipe = await DeviceToken.findOne({ clienteDocumento: '1024578963', isActive: true });
        const tokenDaniela = await DeviceToken.findOne({ clienteDocumento: '2129239233', isActive: true });
        
        console.log('\n👤 FELIPE:');
        if (tokenFelipe) {
            console.log('✅ Token encontrado');
            console.log('📱 Platform:', tokenFelipe.platform);
            console.log('📅 Creado:', tokenFelipe.createdAt);
            console.log('📏 Longitud:', tokenFelipe.deviceToken.length);
            
            // Probar envío
            try {
                const response = await admin.messaging().send({
                    notification: {
                        title: '🎯 Prueba Felipe',
                        body: `Notificación de prueba para Felipe - ${new Date().toLocaleTimeString()}`
                    },
                    token: tokenFelipe.deviceToken
                });
                console.log('✅ Notificación enviada exitosamente');
                console.log('📋 Response:', response);
            } catch (error) {
                console.log('❌ Error enviando:', error.message);
            }
        } else {
            console.log('❌ No se encontró token activo');
        }
        
        console.log('\n👤 DANIELA:');
        if (tokenDaniela) {
            console.log('✅ Token encontrado');
            console.log('📱 Platform:', tokenDaniela.platform);
            console.log('📅 Creado:', tokenDaniela.createdAt);
            console.log('📏 Longitud:', tokenDaniela.deviceToken.length);
            
            // Probar envío
            try {
                const response = await admin.messaging().send({
                    notification: {
                        title: '🎯 Prueba Daniela',
                        body: `Notificación de prueba para Daniela - ${new Date().toLocaleTimeString()}`
                    },
                    token: tokenDaniela.deviceToken
                });
                console.log('✅ Notificación enviada exitosamente');
                console.log('📋 Response:', response);
            } catch (error) {
                console.log('❌ Error enviando:', error.message);
            }
        } else {
            console.log('❌ No se encontró token activo');
        }
        
        console.log('\n🎯 INSTRUCCIONES:');
        console.log('================');
        console.log('1. Felipe: Revisar dispositivo Android ahora');
        console.log('2. Daniela: Revisar dispositivo Android ahora');
        console.log('3. Confirmar quién recibe las notificaciones');
        
    } catch (error) {
        console.error('❌ Error general:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔐 Desconectado de MongoDB');
    }
}

pruebaRapida().catch(console.error);
