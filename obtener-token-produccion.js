/**
 * OBTENER TOKEN DESDE ENDPOINT DE PRODUCCIÓN
 */

const axios = require('axios');

async function obtenerTokenDesdeProduccion(clienteDocumento) {
    try {
        console.log(`🔍 === OBTENIENDO TOKEN DESDE PRODUCCIÓN ===`);
        console.log(`👤 Cliente: ${clienteDocumento}`);
        
        const url = `https://backend-registro-muestras.onrender.com/api/notificaciones/debug/token-completo/${clienteDocumento}`;
        console.log(`🌐 URL: ${url}`);
        
        const response = await axios.get(url);
        
        if (response.data.success) {
            console.log('✅ Tokens obtenidos exitosamente');
            console.log(`📱 Cantidad de tokens: ${response.data.data.tokensCount}`);
            
            response.data.data.tokens.forEach((token, index) => {
                console.log(`\n🔑 TOKEN ${index + 1}:`);
                console.log('================');
                console.log('📋 ID:', token.id);
                console.log('👤 Cliente:', token.clienteDocumento);
                console.log('📱 Platform:', token.platform);
                console.log('✅ Activo:', token.isActive);
                console.log('📅 Creado:', token.createdAt);
                console.log('📏 Longitud:', token.tokenLength);
                console.log('🔍 Formato válido:', token.validFormat ? '✅ Sí' : '❌ No');
                console.log('🔑 TOKEN COMPLETO:');
                console.log(token.tokenCompleto);
                
                // Probar este token si es válido
                if (token.validFormat && token.isActive) {
                    console.log('\n🎯 Este token será usado para la prueba');
                    probarTokenCompleto(token.tokenCompleto);
                }
            });
        } else {
            console.log('❌ Error obteniendo tokens:', response.data.message);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

async function probarTokenCompleto(token) {
    console.log('\n🚀 === PROBANDO TOKEN COMPLETO ===');
    
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
        
        const message = {
            notification: {
                title: '🎉 Token Daniela Funcionando',
                body: 'El token FCM de Daniela Montenegro está funcionando correctamente.'
            },
            data: {
                tipo: 'prueba_daniela',
                timestamp: new Date().toISOString(),
                cliente: '2129239233'
            },
            token: token
        };
        
        console.log('📤 Enviando notificación...');
        const response = await admin.messaging().send(message);
        
        console.log('✅ ¡NOTIFICACIÓN ENVIADA EXITOSAMENTE!');
        console.log('📋 Response ID:', response);
        console.log('📱 Daniela debería recibir la notificación');
        
    } catch (error) {
        console.log('❌ Error enviando notificación:');
        console.log('🔍 Error:', error.message);
        console.log('🔍 Código:', error.code);
        
        if (error.code === 'messaging/registration-token-not-registered') {
            console.log('💡 El token ha expirado, Daniela debe regenerar el token');
        } else if (error.code === 'messaging/invalid-argument') {
            console.log('💡 El token tiene formato inválido');
        }
    }
}

require('dotenv').config();

const clienteDocumento = process.argv[2] || '2129239233';
console.log('👤 Buscando tokens para cliente:', clienteDocumento);

obtenerTokenDesdeProduccion(clienteDocumento).catch(console.error);
