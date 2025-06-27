const https = require('https');

console.log('🧪 === DIAGNÓSTICO RÁPIDO FCM ===\n');

// Primero probar que el servidor esté arriba
console.log('1️⃣ Probando conectividad básica...');

const testConnectivity = () => {
    return new Promise((resolve) => {
        const req = https.request({
            hostname: 'backend-sena-lab.onrender.com',
            port: 443,
            path: '/',
            method: 'GET',
            timeout: 5000
        }, (res) => {
            console.log(`✅ Servidor responde: ${res.statusCode}`);
            resolve(true);
        });
        
        req.on('error', (error) => {
            console.log(`❌ Error de conectividad: ${error.message}`);
            resolve(false);
        });
        
        req.setTimeout(5000, () => {
            console.log('❌ Timeout de conectividad');
            req.destroy();
            resolve(false);
        });
        
        req.end();
    });
};

// Luego probar el endpoint de test-firebase que sabemos que funciona
const testFirebaseEndpoint = () => {
    return new Promise((resolve) => {
        const req = https.request({
            hostname: 'backend-sena-lab.onrender.com',
            port: 443,
            path: '/api/notificaciones/test-firebase',
            method: 'GET',
            timeout: 10000
        }, (res) => {
            console.log(`✅ Endpoint test-firebase responde: ${res.statusCode}`);
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    console.log('📋 Estado Firebase:', response.data?.status || 'No disponible');
                    resolve(response);
                } catch (e) {
                    console.log('📄 Respuesta:', data.substring(0, 200) + '...');
                    resolve({ raw: data });
                }
            });
        });
        
        req.on('error', (error) => {
            console.log(`❌ Error en test-firebase: ${error.message}`);
            resolve(null);
        });
        
        req.setTimeout(10000, () => {
            console.log('❌ Timeout en test-firebase');
            req.destroy();
            resolve(null);
        });
        
        req.end();
    });
};

async function ejecutarDiagnostico() {
    const conectividad = await testConnectivity();
    
    if (conectividad) {
        console.log('\n2️⃣ Probando endpoint test-firebase...');
        const firebaseTest = await testFirebaseEndpoint();
        
        if (firebaseTest && firebaseTest.data) {
            if (firebaseTest.data.status === 'COMPLETA') {
                console.log('\n🔍 DIAGNÓSTICO: Firebase está configurado correctamente');
                console.log('💡 El problema está en FCM API o tokens inválidos');
            } else {
                console.log('\n❌ DIAGNÓSTICO: Firebase no está configurado correctamente');
                console.log('📝 Variables faltantes:', firebaseTest.data.missingVars);
            }
        }
    }
    
    console.log('\n🏁 Diagnóstico completado');
}

ejecutarDiagnostico();
