const https = require('https');

console.log('🔍 VERIFICACIÓN DE CONFIGURACIÓN EN PRODUCCIÓN');
console.log('=============================================');

// URL de tu backend actual
const BACKEND_URL = 'https://backend-registro-muestras.onrender.com';

function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        data: JSON.parse(data),
                        headers: res.headers
                    });
                } catch (error) {
                    resolve({
                        status: res.statusCode,
                        data: data,
                        headers: res.headers,
                        parseError: true
                    });
                }
            });
        });
        
        req.on('error', reject);
        req.end();
    });
}

async function verificarConfiguracion() {
    try {
        console.log('\n📊 ANÁLISIS DE LOGS:');
        console.log('✅ Private key present: true');
        console.log('✅ Private key length: 1703');
        console.log('✅ Private key starts with BEGIN: true');
        console.log('✅ Private key ends with END: true');
        console.log('❌ No aparece "🔧 Usando FIREBASE_PRIVATE_KEY_BASE64"');
        
        console.log('\n🔍 DIAGNÓSTICO:');
        console.log('1. La configuración Base64 FUNCIONÓ (no hay error RS256)');
        console.log('2. Pero puede estar usando la variable tradicional');
        console.log('3. El nuevo error es 404 /batch de Firebase');
        
        console.log('\n💡 POSIBLES CAUSAS DEL ERROR 404 /batch:');
        console.log('1. ❌ Project ID incorrecto en Firebase Console');
        console.log('2. ❌ Token FCM válido pero proyecto deshabilitado');
        console.log('3. ❌ Cloud Messaging API no habilitada');
        console.log('4. ❌ Región incorrecta en Firebase');
        
        console.log('\n🔧 VERIFICACIONES NECESARIAS:');
        console.log('1. Confirmar Project ID en Firebase Console');
        console.log('2. Verificar que Cloud Messaging esté habilitado');
        console.log('3. Comprobar que el token FCM sea válido');
        console.log('4. Revisar si la variable BASE64 se está usando');
        
        console.log('\n📝 PASOS INMEDIATOS:');
        console.log('1. Ve a Firebase Console → Project Settings');
        console.log('2. Confirma Project ID: aqualab-83795');
        console.log('3. Ve a Cloud Messaging y verifica que esté habilitado');
        console.log('4. Regenera un token FCM desde la app Android');
        console.log('5. Prueba con el nuevo token');
        
        console.log('\n✅ PROGRESO CONFIRMADO:');
        console.log('- Servidor funcionando correctamente');
        console.log('- Base64 eliminó el error RS256');
        console.log('- Firebase se está inicializando');
        console.log('- Tokens válidos detectados');
        console.log('- Solo falta resolver el acceso a Cloud Messaging');
        
        console.log('\n⚡ PRUEBA RÁPIDA:');
        console.log('1. Regenera token FCM en la app');
        console.log('2. Registra el nuevo token');
        console.log('3. Cambia el estado de una muestra');
        console.log('4. Si persiste, revisar Firebase Console');
        
    } catch (error) {
        console.error('❌ Error en verificación:', error.message);
    }
}

// También crear endpoint de diagnóstico temporal
console.log('\n🛠️ ENDPOINT DE DIAGNÓSTICO TEMPORAL:');
console.log('Puedes crear un endpoint temporal para verificar:');
console.log(`${BACKEND_URL}/api/debug/firebase-config`);

verificarConfiguracion();
