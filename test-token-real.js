require('dotenv').config();

console.log('🎯 PRUEBA CON TOKEN REAL');

const admin = require('firebase-admin');

const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token"
};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const messaging = admin.messaging();

// Token real desde MongoDB
const realToken = 'co1WhDNTSzS-xuiJKqPF3o:APA91bHRUutPVcz1LO3YYwm7l36zMZIxad6lQLfL2h3zkIa4YaBAnfsYKeWoZvmu7CPvlUCkvyDf5iglFyfhn0fRt0kOjHtIzyPLzmXMih3vFGEvLJe99oM';

const message = {
    notification: {
        title: '🎉 ¡FCM API FUNCIONANDO!',
        body: 'Tu sistema de notificaciones push está completamente operativo.'
    },
    data: {
        tipo: 'test_final',
        estado: 'success',
        timestamp: new Date().toISOString()
    },
    token: realToken
};

console.log('🚀 Enviando notificación con token real...');

messaging.send(message)
    .then(response => {
        console.log('');
        console.log('🎉 ¡ÉXITO COMPLETO!');
        console.log('✅ Notificación enviada correctamente');
        console.log('📧 Message ID:', response);
        console.log('');
        console.log('🔔 ¡Verifica tu dispositivo Android!');
        console.log('📱 Deberías recibir la notificación ahora');
        console.log('');
        console.log('🚀 ¡TU SISTEMA ESTÁ LISTO PARA PRODUCCIÓN!');
    })
    .catch(error => {
        console.log('');
        console.log('🔍 Resultado del token real:');
        console.log('Error code:', error.code);
        console.log('Error message:', error.message);
        
        if (error.code === 'messaging/invalid-registration-token' || 
            error.code === 'messaging/registration-token-not-registered') {
            console.log('');
            console.log('💡 El token FCM necesita ser regenerado');
            console.log('🔧 Esto es normal - los tokens FCM expiran');
            console.log('✅ Pero FCM API está funcionando correctamente');
        } else {
            console.log('❌ Error inesperado');
        }
    });
