require('dotenv').config();

async function probarFCMReal() {
    console.log('🚀 === PRUEBA REAL DE FCM ===\n');
    
    try {
        // Inicializar Firebase
        const admin = require('firebase-admin');
        
        if (admin.apps.length === 0) {
            const serviceAccount = {
                type: "service_account",
                project_id: process.env.FIREBASE_PROJECT_ID,
                private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
                private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                client_email: process.env.FIREBASE_CLIENT_EMAIL,
                client_id: process.env.FIREBASE_CLIENT_ID,
                auth_uri: "https://accounts.google.com/o/oauth2/auth",
                token_uri: "https://oauth2.googleapis.com/token",
                auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
                client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL)}`
            };
            
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: process.env.FIREBASE_PROJECT_ID
            });
        }
        
        const messaging = admin.messaging();
        
        // Buscar un token real de la base de datos
        const mongoose = require('mongoose');
        await mongoose.connect(process.env.MONGODB_URI);
        
        const DeviceToken = require('./src/app/notificaciones/models/deviceTokenModel');
        const tokens = await DeviceToken.find({ isActive: true }).limit(1);
        
        if (tokens.length === 0) {
            console.log('❌ No hay tokens activos en la base de datos para probar');
            return;
        }
        
        const tokenReal = tokens[0].deviceToken;
        console.log(`🔍 Token encontrado: ${tokenReal.substring(0, 20)}...`);
        console.log(`📱 Cliente: ${tokens[0].clienteDocumento}`);
        console.log(`⚙️ Plataforma: ${tokens[0].platform}`);
        
        // Probar envío real
        console.log('\n🚀 Enviando notificación de prueba...');
        
        const mensaje = {
            notification: {
                title: '🧪 Prueba FCM',
                body: 'Esta es una prueba para verificar que FCM funciona correctamente'
            },
            data: {
                tipo: 'test',
                timestamp: new Date().toISOString()
            },
            token: tokenReal
        };
        
        console.log('📋 Mensaje a enviar:');
        console.log(JSON.stringify(mensaje, null, 2));
        
        try {
            const response = await messaging.send(mensaje);
            console.log('\n✅ ¡NOTIFICACIÓN ENVIADA EXITOSAMENTE!');
            console.log(`📧 Message ID: ${response}`);
            console.log('🎉 Firebase Cloud Messaging está funcionando correctamente');
            
        } catch (sendError) {
            console.log('\n❌ Error enviando notificación:');
            console.log(`🔍 Código: ${sendError.code}`);
            console.log(`📝 Mensaje: ${sendError.message}`);
            
            if (sendError.message.includes('404') || sendError.message.includes('/batch')) {
                console.log('\n🔧 DIAGNÓSTICO DEL ERROR 404:');
                console.log('   El error 404/batch indica que:');
                console.log('   1. Firebase Cloud Messaging API NO está habilitada');
                console.log('   2. O el proyecto no tiene permisos correctos');
                console.log('\n💡 SOLUCIÓN:');
                console.log('   1. Ve a Google Cloud Console:');
                console.log(`      https://console.cloud.google.com/apis/library/fcm.googleapis.com?project=${process.env.FIREBASE_PROJECT_ID}`);
                console.log('   2. Asegúrate de que "Firebase Cloud Messaging API" esté HABILITADA');
                console.log('   3. Si ya está habilitada, intenta deshabilitarla y volver a habilitarla');
                console.log('   4. Espera unos minutos para que los cambios se propaguen');
                
            } else if (sendError.code === 'messaging/registration-token-not-registered') {
                console.log('\n⚠️ Token expirado o inválido (esto es normal)');
                console.log('   El token FCM puede haber expirado o la app fue desinstalada');
                console.log('   Pero Firebase respondió correctamente, así que FCM está funcionando');
                
            } else if (sendError.code === 'messaging/invalid-registration-token') {
                console.log('\n⚠️ Token inválido (esto es normal)');
                console.log('   El formato del token puede ser incorrecto');
                console.log('   Pero Firebase respondió correctamente, así que FCM está funcionando');
                
            } else {
                console.log('\n❓ Error desconocido');
            }
        }
        
        await mongoose.disconnect();
        
    } catch (error) {
        console.error('❌ Error general:', error);
    }
    
    console.log('\n🚀 === FIN DE PRUEBA REAL ===');
}

// Ejecutar prueba
probarFCMReal();
