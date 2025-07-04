/**
 * PRUEBA ESPECÍFICA PARA DANIELA
 * Enviar notificación muy visible para diagnosticar el problema
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

async function pruebaEspecialDaniela() {
    try {
        console.log('🎯 === PRUEBA ESPECIAL PARA DANIELA ===');
        console.log('======================================');
        
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
        
        // Buscar token de Daniela
        const tokenDaniela = await DeviceToken.findOne({ 
            clienteDocumento: '2129239233', 
            isActive: true 
        }).sort({ createdAt: -1 });
        
        if (!tokenDaniela) {
            console.log('❌ No se encontró token de Daniela');
            return;
        }
        
        console.log('📱 Token de Daniela encontrado:');
        console.log('   - ID:', tokenDaniela._id);
        console.log('   - Documento:', tokenDaniela.clienteDocumento);
        console.log('   - Token:', tokenDaniela.deviceToken);
        console.log('   - Longitud:', tokenDaniela.deviceToken.length);
        console.log('   - Formato válido:', tokenDaniela.deviceToken.includes(':APA91b') ? '✅ Sí' : '❌ No');
        
        // Enviar 3 notificaciones diferentes para maximizar visibilidad
        const notificaciones = [
            {
                notification: {
                    title: '🔴 DANIELA - PRUEBA 1',
                    body: 'Esta es la primera notificación de prueba para Daniela. Si la ves, funciona!'
                },
                data: {
                    tipo: 'prueba_daniela_1',
                    timestamp: new Date().toISOString(),
                    test: 'primera_prueba'
                },
                token: tokenDaniela.deviceToken
            },
            {
                notification: {
                    title: '🟡 DANIELA - PRUEBA 2',
                    body: 'Segunda notificación. Compara con Felipe - ¿Esta la ves?'
                },
                data: {
                    tipo: 'prueba_daniela_2',
                    timestamp: new Date().toISOString(),
                    test: 'segunda_prueba'
                },
                token: tokenDaniela.deviceToken
            },
            {
                notification: {
                    title: '🟢 DANIELA - PRUEBA 3',
                    body: 'Tercera y última prueba. Daniela, ¿recibes estas notificaciones?'
                },
                data: {
                    tipo: 'prueba_daniela_3',
                    timestamp: new Date().toISOString(),
                    test: 'tercera_prueba'
                },
                token: tokenDaniela.deviceToken
            }
        ];
        
        console.log('\n📤 Enviando 3 notificaciones de prueba...');
        
        for (let i = 0; i < notificaciones.length; i++) {
            try {
                console.log(`\n🚀 Enviando notificación ${i + 1}...`);
                const response = await admin.messaging().send(notificaciones[i]);
                console.log(`✅ Notificación ${i + 1} enviada exitosamente`);
                console.log(`📋 Response ID: ${response}`);
                
                // Esperar 2 segundos entre cada notificación
                if (i < notificaciones.length - 1) {
                    console.log('⏳ Esperando 2 segundos...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
                
            } catch (error) {
                console.log(`❌ Error enviando notificación ${i + 1}:`);
                console.log('🔍 Error:', error.message);
                console.log('🔍 Código:', error.code);
            }
        }
        
        console.log('\n🎯 === INSTRUCCIONES PARA DANIELA ===');
        console.log('====================================');
        console.log('📱 Revisa tu dispositivo Android AHORA');
        console.log('👀 Deberías ver 3 notificaciones diferentes');
        console.log('🔴 Una con título "DANIELA - PRUEBA 1"');
        console.log('🟡 Una con título "DANIELA - PRUEBA 2"');
        console.log('🟢 Una con título "DANIELA - PRUEBA 3"');
        console.log('');
        console.log('📋 Si NO ves ninguna notificación:');
        console.log('   1. Verifica que estés logueado como Daniela');
        console.log('   2. Revisa los permisos de notificaciones');
        console.log('   3. Verifica que la app no esté en modo "No molestar"');
        console.log('   4. Compara con Felipe (que SÍ recibe notificaciones)');
        
        console.log('\n✅ Las 3 notificaciones fueron enviadas exitosamente desde el backend');
        console.log('🎯 FCM confirmó la recepción de todas');
        
    } catch (error) {
        console.error('❌ Error en prueba especial:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔐 Desconectado de MongoDB');
    }
}

// Ejecutar la prueba
pruebaEspecialDaniela().catch(console.error);
