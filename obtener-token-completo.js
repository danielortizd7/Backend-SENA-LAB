/**
 * OBTENER TOKEN COMPLETO DE CLIENTE ESPECÍFICO
 * Script para obtener el token FCM completo desde la base de datos
 */

const mongoose = require('mongoose');
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

async function obtenerTokenCompleto(clienteIdentificador) {
    try {
        console.log(`🔍 === OBTENIENDO TOKEN COMPLETO PARA CLIENTE: ${clienteIdentificador} ===`);
        
        // Conectar a MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado a MongoDB');
        
        // Buscar tokens del cliente (por documento o por ID)
        let query = { isActive: true };
        
        // Si es un ObjectId válido, buscar por clienteId también
        if (clienteIdentificador.match(/^[0-9a-fA-F]{24}$/)) {
            query = {
                $or: [
                    { clienteDocumento: clienteIdentificador, isActive: true },
                    { clienteId: clienteIdentificador, isActive: true }
                ]
            };
            console.log('🔍 Buscando por ObjectId y documento');
        } else {
            query = { clienteDocumento: clienteIdentificador, isActive: true };
            console.log('🔍 Buscando solo por documento');
        }
        
        console.log('🔍 Query:', JSON.stringify(query, null, 2));
        
        const tokens = await DeviceToken.find(query).sort({ createdAt: -1 });
        
        if (tokens.length === 0) {
            console.log(`❌ No se encontraron tokens activos para cliente ${clienteIdentificador}`);
            
            // Buscar todos los tokens para ver qué hay
            console.log('\n🔍 Buscando TODOS los tokens para debug...');
            const todosLosTokens = await DeviceToken.find({}).sort({ createdAt: -1 }).limit(10);
            
            console.log(`📋 Últimos ${todosLosTokens.length} tokens en la base de datos:`);
            todosLosTokens.forEach((token, index) => {
                console.log(`${index + 1}. Doc: ${token.clienteDocumento || 'N/A'}, ID: ${token.clienteId || 'N/A'}, Platform: ${token.platform}, Activo: ${token.isActive}`);
            });
            
            return null;
        }
        
        console.log(`📱 Encontrados ${tokens.length} tokens activos:`);
        
        tokens.forEach((token, index) => {
            console.log(`\n🔑 TOKEN ${index + 1}:`);
            console.log('================');
            console.log('📋 ID:', token._id);
            console.log('👤 Cliente Documento:', token.clienteDocumento);
            console.log('📱 Platform:', token.platform);
            console.log('📅 Creado:', token.createdAt);
            console.log('🔄 Última vez usado:', token.lastUsed);
            console.log('✅ Activo:', token.isActive);
            console.log('🔑 Token completo:', token.deviceToken);
            console.log('📏 Longitud del token:', token.deviceToken.length);
            console.log('🔍 Formato válido:', token.deviceToken.includes(':APA91b') ? '✅ Sí' : '❌ No');
            
            // Mostrar en formato JSON para fácil copia
            console.log('\n📋 JSON COMPLETO:');
            console.log(JSON.stringify({
                _id: token._id,
                clienteDocumento: token.clienteDocumento,
                deviceToken: token.deviceToken,
                platform: token.platform,
                isActive: token.isActive,
                createdAt: token.createdAt,
                updatedAt: token.updatedAt,
                lastUsed: token.lastUsed
            }, null, 2));
        });
        
        // Devolver el token más reciente
        const tokenMasReciente = tokens[0];
        console.log('\n🎯 TOKEN MÁS RECIENTE SELECCIONADO:');
        console.log('===================================');
        console.log('🔑 Token:', tokenMasReciente.deviceToken);
        
        return tokenMasReciente.deviceToken;
        
    } catch (error) {
        console.error('❌ Error obteniendo token:', error);
        return null;
    } finally {
        await mongoose.disconnect();
        console.log('🔐 Desconectado de MongoDB');
    }
}

// Función para probar directamente con el token obtenido
async function probarTokenObtenido(clienteDocumento) {
    const token = await obtenerTokenCompleto(clienteDocumento);
    
    if (!token) {
        console.log('❌ No se pudo obtener el token');
        return;
    }
    
    console.log('\n🚀 === PROBANDO TOKEN OBTENIDO ===');
    console.log('==================================');
    
    // Usar el script de prueba existente
    const admin = require('firebase-admin');
    
    try {
        // Configurar Firebase si no está inicializado
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
        
        // Enviar mensaje de prueba
        const message = {
            notification: {
                title: '🎉 Token Obtenido Exitosamente',
                body: `Token FCM para ${clienteDocumento} funcionando correctamente.`
            },
            data: {
                tipo: 'prueba_token_obtenido',
                clienteDocumento: clienteDocumento,
                timestamp: new Date().toISOString()
            },
            token: token
        };
        
        console.log('📤 Enviando notificación de prueba...');
        const response = await admin.messaging().send(message);
        
        console.log('✅ ¡NOTIFICACIÓN ENVIADA EXITOSAMENTE!');
        console.log('📋 Response ID:', response);
        console.log('📱 Revisa el dispositivo Android de', clienteDocumento);
        
    } catch (error) {
        console.log('❌ Error enviando notificación de prueba:');
        console.log('🔍 Error:', error.message);
        console.log('🔍 Código:', error.code);
        
        if (error.code === 'messaging/registration-token-not-registered') {
            console.log('💡 El token ha expirado, regenera el token en la app Android');
        } else if (error.code === 'messaging/invalid-argument') {
            console.log('💡 El token tiene formato inválido');
        }
    }
}

// Obtener cliente desde argumentos o usar el del log
const clienteDocumento = process.argv[2] || '2129239233';

console.log('🔍 Cliente a buscar:', clienteDocumento);
console.log('📝 Uso: node obtener-token-completo.js [clienteDocumento]');
console.log('');

probarTokenObtenido(clienteDocumento).catch(console.error);
