const https = require('https');
const fs = require('fs');

console.log('🔍 VERIFICAR CLAVE PRIVADA EN PRODUCCIÓN');
console.log('=========================================');

// URL de tu backend en Render
const BACKEND_URL = 'https://backend-sena-lab.onrender.com';

// Función para hacer petición HTTP
function makeRequest(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (error) {
                    resolve({ error: 'Respuesta no válida', rawData: data });
                }
            });
        }).on('error', reject);
    });
}

async function verificarProduccion() {
    try {
        console.log('\n1. VERIFICANDO ESTADO DEL SERVIDOR:');
        const healthResponse = await makeRequest(`${BACKEND_URL}/health`);
        console.log('✅ Servidor respondiendo:', healthResponse.status || 'OK');
        
        console.log('\n2. VERIFICANDO CONFIGURACIÓN FIREBASE:');
        const firebaseResponse = await makeRequest(`${BACKEND_URL}/api/debug/firebase-config`);
        
        if (firebaseResponse.error) {
            console.log('❌ Error al verificar Firebase:', firebaseResponse.error);
            console.log('Respuesta cruda:', firebaseResponse.rawData);
        } else {
            console.log('✅ Firebase configurado correctamente');
            console.log('Project ID:', firebaseResponse.projectId);
            console.log('Client Email:', firebaseResponse.clientEmail);
            console.log('Private Key ID:', firebaseResponse.privateKeyId);
            console.log('Private Key Length:', firebaseResponse.privateKeyLength);
            console.log('Private Key Format Valid:', firebaseResponse.privateKeyValid);
        }
        
        console.log('\n3. PROBANDO ENDPOINT DE DIAGNÓSTICO FCM:');
        const fcmResponse = await makeRequest(`${BACKEND_URL}/api/debug/diagnostico-fcm`);
        
        if (fcmResponse.error) {
            console.log('❌ Error en diagnóstico FCM:', fcmResponse.error);
        } else {
            console.log('✅ Diagnóstico FCM exitoso');
            console.log('Firebase inicializado:', fcmResponse.firebaseInitialized);
            console.log('FCM disponible:', fcmResponse.fcmAvailable);
        }
        
    } catch (error) {
        console.log('❌ Error en verificación:', error.message);
    }
}

// Ejecutar verificación
verificarProduccion().then(() => {
    console.log('\n📋 RESUMEN:');
    console.log('1. Si ves errores, la clave privada aún no está configurada correctamente');
    console.log('2. Si todo está ✅, la clave privada está bien configurada');
    console.log('3. Después de ver todo ✅, prueba enviar notificaciones');
});

// También crear un endpoint temporal para verificar la clave
console.log('\n🔧 ENDPOINT TEMPORAL PARA VERIFICAR CLAVE:');
console.log('Puedes usar este endpoint para verificar la clave en producción:');
console.log(`${BACKEND_URL}/api/debug/private-key-check`);
console.log('(Solo disponible si habilitamos endpoints de debug)');
