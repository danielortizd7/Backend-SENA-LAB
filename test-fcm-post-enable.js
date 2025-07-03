require('dotenv').config();

async function probarFCMDespuesHabilitar() {
    console.log('🧪 === PRUEBA FCM DESPUÉS DE HABILITAR API ===');
    
    try {
        // Importar Firebase Admin
        const admin = require('firebase-admin');
        
        // Verificar si ya está inicializado
        if (admin.apps.length === 0) {
            console.log('🔧 Inicializando Firebase Admin SDK...');
            
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
                client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
            };
            
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: process.env.FIREBASE_PROJECT_ID
            });
            console.log('✅ Firebase inicializado correctamente');
        }
        
        // Obtener instancia de messaging
        const messaging = admin.messaging();
        console.log('✅ Messaging instance obtenida');
        
        // Token de prueba (el mismo que tienes en MongoDB)
        const testToken = 'co1WhDNTSzS-xuiJKqPF3o:APA91bHRUutPVcz1LO3YYwm7l36zMZIxad6lQLfL2h3zkIa4YaBAnfsYKeWoZvmu7CPvlUCkvyDf5iglFyfhn0fRt0kOjHtIzyPLzmXMih3vFGEvLJe99oM';
        
        console.log('🚀 Enviando notificación de prueba...');
        console.log(`📱 Token: ${testToken.substring(0, 30)}...`);
        
        const message = {
            notification: {
                title: '✅ FCM API FUNCIONANDO',
                body: '¡Excelente! La API de Firebase Cloud Messaging ya está habilitada y funcionando correctamente.'
            },
            data: {
                tipo: 'test_fcm_api',
                timestamp: new Date().toISOString(),
                test: 'true'
            },
            token: testToken
        };
        
        const response = await messaging.send(message);
        console.log('✅ ¡NOTIFICACIÓN ENVIADA EXITOSAMENTE!');
        console.log(`📧 Message ID: ${response}`);
        console.log('');
        console.log('🎉 ¡FCM API ESTÁ FUNCIONANDO CORRECTAMENTE!');
        console.log('🔔 Verifica tu dispositivo Android para la notificación');
        
        return {
            success: true,
            messageId: response,
            message: 'FCM API funcionando correctamente'
        };
        
    } catch (error) {
        console.error('❌ Error enviando notificación:', error);
        
        if (error.code === 'messaging/invalid-registration-token') {
            console.log('');
            console.log('💡 El token FCM puede haber expirado o ser inválido');
            console.log('🔧 Solución: Regenera el token en tu app Android');
        } else if (error.code === 'messaging/registration-token-not-registered') {
            console.log('');
            console.log('💡 El token FCM no está registrado para este proyecto');
            console.log('🔧 Verifica que la app Android use el mismo proyecto Firebase');
        } else if (error.message?.includes('404')) {
            console.log('');
            console.log('🚨 FCM API aún no está completamente propagada');
            console.log('⏰ Espera 5-10 minutos más y vuelve a intentar');
        } else {
            console.log('');
            console.log('🔍 Error inesperado:', error.code || error.message);
        }
        
        return {
            success: false,
            error: error.message,
            code: error.code
        };
    }
}

// Ejecutar prueba
probarFCMDespuesHabilitar()
    .then(resultado => {
        console.log('');
        console.log('🏁 === RESULTADO FINAL ===');
        console.log(`✅ Éxito: ${resultado.success}`);
        if (resultado.success) {
            console.log('🎯 ¡Tu sistema de notificaciones está 100% funcional!');
            console.log('🚀 ¡Listo para producción!');
        } else {
            console.log('🔧 Necesita ajustes adicionales');
        }
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    });
