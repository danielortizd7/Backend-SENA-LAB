/**
 * PRUEBA CON TOKEN VÁLIDO
 * Usa este script para probar notificaciones con un token FCM válido
 */

const axios = require('axios');

const BACKEND_URL = 'https://backend-registro-muestras.onrender.com';

// Función para probar con un token específico
async function probarConToken(token) {
    console.log('🚀 === PRUEBA CON TOKEN VÁLIDO ===');
    console.log(`🔑 Token: ${token.substring(0, 20)}...`);
    console.log(`🌐 Backend: ${BACKEND_URL}`);
    
    try {
        // Paso 1: Registrar token
        console.log('\n1️⃣ Registrando token...');
        const registerResponse = await axios.post(`${BACKEND_URL}/api/notificaciones/register-token`, {
            token: token,
            clienteDocumento: '1235467890',
            platform: 'android'
        });
        
        console.log('✅ Token registrado exitosamente');
        console.log('📋 Respuesta:', registerResponse.data);
        
        // Paso 2: Enviar notificación de prueba
        console.log('\n2️⃣ Enviando notificación de prueba...');
        const notificationResponse = await axios.post(`${BACKEND_URL}/api/notificaciones/send-test`, {
            clienteDocumento: '1235467890',
            titulo: '🎉 ¡Prueba Exitosa!',
            mensaje: 'Las notificaciones FCM están funcionando correctamente.',
            muestraId: 'TEST-' + Date.now()
        });
        
        console.log('✅ Notificación enviada exitosamente');
        console.log('📋 Respuesta:', notificationResponse.data);
        
        console.log('\n🎯 RESULTADO:');
        console.log('=============');
        console.log('✅ Token válido y funcional');
        console.log('✅ Backend procesando correctamente');
        console.log('✅ Firebase configurado correctamente');
        console.log('📱 Revisa tu dispositivo Android para ver la notificación');
        
    } catch (error) {
        console.log('❌ Error en la prueba:');
        console.log('   Status:', error.response?.status);
        console.log('   Error:', error.response?.data?.error || error.message);
        console.log('   Data:', error.response?.data);
        
        if (error.response?.status === 400) {
            console.log('\n💡 POSIBLES CAUSAS:');
            console.log('- Token FCM inválido o expirado');
            console.log('- Formato de token incorrecto');
            console.log('- El token no pertenece a tu proyecto Firebase');
        }
    }
}

// Función para ayuda
function mostrarAyuda() {
    console.log('🔍 === CÓMO USAR ESTE SCRIPT ===');
    console.log('================================');
    console.log('');
    console.log('1. Obtén un token FCM válido desde tu app Android');
    console.log('2. Ejecuta: node probar-token-valido.js "tu-token-completo"');
    console.log('');
    console.log('📱 CÓMO OBTENER EL TOKEN EN ANDROID:');
    console.log('===================================');
    console.log('FirebaseMessaging.getInstance().getToken()');
    console.log('    .addOnCompleteListener(task -> {');
    console.log('        String token = task.getResult();');
    console.log('        Log.d("FCM", "Token: " + token);');
    console.log('    });');
    console.log('');
    console.log('📋 EJEMPLO DE USO:');
    console.log('==================');
    console.log('node probar-token-valido.js "dKj2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z8..."');
}

// Obtener token desde argumentos de línea de comandos
const token = process.argv[2];

if (!token) {
    console.log('❌ Error: No se proporcionó token');
    mostrarAyuda();
    process.exit(1);
}

if (token.length < 20) {
    console.log('❌ Error: Token demasiado corto (posiblemente inválido)');
    mostrarAyuda();
    process.exit(1);
}

// Ejecutar prueba
probarConToken(token).catch(console.error);
