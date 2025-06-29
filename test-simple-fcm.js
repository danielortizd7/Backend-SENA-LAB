require('dotenv').config();

console.log('🧪 PRUEBA SIMPLE FCM API');
console.log('Project ID:', process.env.FIREBASE_PROJECT_ID);

const admin = require('firebase-admin');

// Inicializar Firebase
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

try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase inicializado');
    
    const messaging = admin.messaging();
    console.log('✅ Messaging obtenido');
    
    // Probar con token inválido para verificar error
    messaging.send({
        token: 'test_token_invalid',
        notification: { title: 'Test', body: 'Test' }
    }).then(response => {
        console.log('✅ Respuesta:', response);
    }).catch(error => {
        console.log('🔍 Error esperado:', error.code);
        if (error.code === 'messaging/invalid-registration-token') {
            console.log('✅ ¡FCM API ESTÁ FUNCIONANDO! (Error esperado con token inválido)');
        } else {
            console.log('❌ Error inesperado:', error.message);
        }
    });
    
} catch (error) {
    console.log('❌ Error inicialización:', error.message);
}
